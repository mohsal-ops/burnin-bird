import crypto from "node:crypto";

// Cloudflare R2 (S3-compatible) — owner uploads live here instead of Vercel Blob
// (free 10 GB storage, free downloads, no account-wide transfer cap). Signed with
// AWS SigV4 by hand so the template needs no extra packages. Configured by five
// env vars the builder panel copies into every client project; when they're
// missing, callers fall back to Vercel Blob (see lib/storage.ts).

type R2Env = { bucket: string; publicUrl: string; endpoint: string; keyId: string; secret: string };

function env(): R2Env | null {
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;
  const endpoint = process.env.R2_ENDPOINT;
  const keyId = process.env.R2_ACCESS_KEY_ID;
  const secret = process.env.R2_SECRET_ACCESS_KEY;
  if (!bucket || !publicUrl || !endpoint || !keyId || !secret) return null;
  return { bucket, publicUrl: publicUrl.replace(/\/$/, ""), endpoint: endpoint.replace(/\/$/, ""), keyId, secret };
}

export const r2Enabled = () => env() !== null;

const sha256 = (s: string | Buffer) => crypto.createHash("sha256").update(s).digest("hex");
const hmac = (k: crypto.BinaryLike, s: string) => crypto.createHmac("sha256", k).update(s).digest();
const encodeKey = (key: string) => key.split("/").map((p) => encodeURIComponent(p)).join("/");
const rfc3986 = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

function stamp() {
  const iso = new Date().toISOString().replace(/[:-]|\.\d{3}/g, ""); // 20261007T105600Z
  return { amzDate: iso, date: iso.slice(0, 8) };
}

function signingKey(secret: string, date: string) {
  return hmac(hmac(hmac(hmac("AWS4" + secret, date), "auto"), "s3"), "aws4_request");
}

/** Safe, unique object key: <folder>/<uuid>-<clean-name>. */
export function objectKey(folder: string, filename: string) {
  const clean = (filename || "file").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-80);
  return `${folder.replace(/^\/|\/$/g, "")}/${crypto.randomUUID()}-${clean}`;
}

export function r2PublicUrl(key: string) {
  const e = env();
  return e ? `${e.publicUrl}/${encodeKey(key)}` : "";
}

/** Upload bytes from the server. Returns the public URL. */
export async function r2Put(key: string, body: Buffer, contentType: string): Promise<string> {
  const e = env();
  if (!e) throw new Error("R2 is not configured");
  const host = new URL(e.endpoint).host;
  const path = `/${e.bucket}/${encodeKey(key)}`;
  const { amzDate, date } = stamp();
  const payloadHash = "UNSIGNED-PAYLOAD";
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonical = ["PUT", path, "", `content-type:${contentType}`, `host:${host}`, `x-amz-content-sha256:${payloadHash}`, `x-amz-date:${amzDate}`, "", signedHeaders, payloadHash].join("\n");
  const scope = `${date}/auto/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonical)].join("\n");
  const sig = crypto.createHmac("sha256", signingKey(e.secret, date)).update(toSign).digest("hex");
  const res = await fetch(`${e.endpoint}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: `AWS4-HMAC-SHA256 Credential=${e.keyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`,
    },
    body: new Uint8Array(body),
  });
  if (!res.ok) throw new Error(`R2 upload failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return r2PublicUrl(key);
}

/** Delete an object by its public URL (best-effort). */
export async function r2DeleteByUrl(url: string): Promise<void> {
  const e = env();
  if (!e || !url.startsWith(e.publicUrl + "/")) return;
  const key = decodeURIComponent(url.slice(e.publicUrl.length + 1));
  const host = new URL(e.endpoint).host;
  const path = `/${e.bucket}/${encodeKey(key)}`;
  const { amzDate, date } = stamp();
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonical = ["DELETE", path, "", `host:${host}`, "x-amz-content-sha256:UNSIGNED-PAYLOAD", `x-amz-date:${amzDate}`, "", signedHeaders, "UNSIGNED-PAYLOAD"].join("\n");
  const scope = `${date}/auto/s3/aws4_request`;
  const sig = crypto.createHmac("sha256", signingKey(e.secret, date)).update(["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonical)].join("\n")).digest("hex");
  await fetch(`${e.endpoint}${path}`, {
    method: "DELETE",
    headers: { "x-amz-content-sha256": "UNSIGNED-PAYLOAD", "x-amz-date": amzDate, Authorization: `AWS4-HMAC-SHA256 Credential=${e.keyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}` },
  }).catch(() => {});
}

/**
 * Presigned PUT URL so the BROWSER uploads the file straight to R2 (no file
 * bytes through a Vercel function — no body-size cap, almost no CPU). Needs the
 * bucket's CORS policy to allow PUT from the site.
 */
export function r2PresignPut(key: string, expiresSec = 600): { uploadUrl: string; publicUrl: string } {
  const e = env();
  if (!e) throw new Error("R2 is not configured");
  const host = new URL(e.endpoint).host;
  const path = `/${e.bucket}/${encodeKey(key)}`;
  const { amzDate, date } = stamp();
  const scope = `${date}/auto/s3/aws4_request`;
  const q: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${e.keyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSec),
    "X-Amz-SignedHeaders": "host",
  };
  const query = Object.keys(q).sort().map((k) => `${rfc3986(k)}=${rfc3986(q[k])}`).join("&");
  const canonical = ["PUT", path, query, `host:${host}`, "", "host", "UNSIGNED-PAYLOAD"].join("\n");
  const sig = crypto.createHmac("sha256", signingKey(e.secret, date)).update(["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonical)].join("\n")).digest("hex");
  return { uploadUrl: `${e.endpoint}${path}?${query}&X-Amz-Signature=${sig}`, publicUrl: r2PublicUrl(key) };
}
