// ─────────────────────────────────────────────────────────────────────────────
// VegaStar Digital — new client site scaffolder
//
//   npm run new-project -- --name "Joe's Diner"
//   npm run new-project -- --name "Joe's Diner" --features menu,catering --mode direct --dry-run
//
// What it does (each step prints what it's doing):
//   1. GitHub  : create a new repo and push this template's code (with a fresh
//                SITE_CONFIG: new name, this project's future Vercel URL, chosen
//                features, placeholder contact info).
//   2. Neon    : create a new Postgres database and read its connection string.
//   3. Prisma  : run migrations against the new DB, then seed empty defaults +
//                a fresh admin (random password).
//   4. Vercel  : create a project linked to the new repo, set env vars, deploy.
//   5. Summary : print repo URL, live URL, and the admin login.
//
// Secrets: read at runtime from scaffold/.env (git-ignored). Never printed,
// never committed. Nothing external happens under --dry-run.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { tmpdir } from "os";
import path from "path";
import { fileURLToPath } from "url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NEON_REGION = process.env.NEON_REGION || "aws-us-east-2";
const PG_VERSION = 17;

// ── tiny helpers ─────────────────────────────────────────────────────────────
const log = (m) => console.log(m);
const step = (m) => console.log(`\n▶ ${m}`);
class FatalError extends Error {}
const die = (m) => {
  throw new FatalError(m);
};

function parseEnvFile(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "");
  }
  return out;
}

function parseArgs(argv) {
  const a = { features: "menu,catering,giftCard,rewards,blog,story", mode: "ask", private: true, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const next = () => argv[++i];
    if (k === "--name") a.name = next();
    else if (k === "--slug") a.slug = next();
    else if (k === "--features") a.features = next();
    else if (k === "--admin-email") a.adminEmail = next();
    else if (k === "--mode") a.mode = next();
    else if (k === "--region") a.region = next();
    else if (k === "--public") a.private = false;
    else if (k === "--dry-run") a.dryRun = true;
  }
  return a;
}

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: "pipe", encoding: "utf8", ...opts });
}

async function api(url, { method = "GET", token, body, tokenScheme = "Bearer" } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `${tokenScheme} ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${url} → ${res.status}\n${JSON.stringify(json, null, 2)}`);
  }
  return json;
}

// ── SITE_CONFIG patcher ──────────────────────────────────────────────────────
// Rewrites the brand-identity fields for the new client. Contact info + coords
// become obvious placeholders the owner fills in later (SITE_CONFIG is the only
// file they edit). Home/FAQ copy stays as-is for them to customize.
function patchSiteConfig(src, { name, slug, features }) {
  const url = `https://${slug}.vercel.app`;
  const first = (key, val) =>
    (src = src.replace(new RegExp(`(\\b${key}:\\s*)"[^"]*"`), `$1${JSON.stringify(val)}`));

  first("name", name);
  first("legalName", name);
  first("trademark", name);
  first("tagline", name);
  first("siteUrl", url);
  first("seoTitle", name);
  first("seoDescription", `${name} — order online.`);
  first("address", "123 Main St, Your City, ST 00000");
  first("street", "123 Main St");
  first("city", "Your City");
  first("state", "ST");
  first("zip", "00000");
  first("phone", "000-000-0000");
  first("email", `hello@${slug}.com`);
  first("cateringEmail", `hello@${slug}.com`);
  src = src.replace(/(\blat:\s*)[-\d.]+/, `$10`);
  src = src.replace(/(\blng:\s*)[-\d.]+/, `$10`);
  src = src.replace(
    /const FEATURES = \{[\s\S]*?\};/,
    `const FEATURES = {\n  catering: ${features.catering},\n  giftCard: ${features.giftCard},\n  rewards: ${features.rewards},\n  blog: ${features.blog},\n};`,
  );
  return src;
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.name) die('Missing --name. Example: npm run new-project -- --name "Joe\'s Diner"');

  const env = parseEnvFile(path.join(REPO_ROOT, "scaffold", ".env"));
  const GITHUB_TOKEN = env.GITHUB_TOKEN;
  const GITHUB_OWNER = env.GITHUB_OWNER;
  const NEON_API_KEY = env.NEON_API_KEY;
  const VERCEL_TOKEN = env.VERCEL_TOKEN;
  const VERCEL_TEAM_ID = env.VERCEL_TEAM_ID || null;
  const region = args.region || NEON_REGION;

  const missing = [];
  if (!GITHUB_TOKEN) missing.push("GITHUB_TOKEN");
  if (!GITHUB_OWNER) missing.push("GITHUB_OWNER");
  if (!NEON_API_KEY) missing.push("NEON_API_KEY");
  if (!VERCEL_TOKEN) missing.push("VERCEL_TOKEN");
  if (missing.length) die(`Missing in scaffold/.env: ${missing.join(", ")}`);

  const name = args.name;
  const slug = args.slug ? slugify(args.slug) : slugify(name);
  const chosen = new Set(args.features.split(",").map((s) => s.trim().toLowerCase()));
  const features = {
    catering: chosen.has("catering"),
    giftCard: chosen.has("giftcard"),
    rewards: chosen.has("rewards"),
    blog: chosen.has("blog"),
  };
  const deliveryMode = args.mode.startsWith("direct") ? "DIRECT_SEND" : "ASK_FIRST";
  const adminEmail = (args.adminEmail || `owner@${slug}.com`).toLowerCase();
  const repoName = slug;
  const vercelUrl = `https://${slug}.vercel.app`;
  const teamQ = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";

  log(`\n${"═".repeat(56)}`);
  log(`  New project: ${name}`);
  log(`  slug:        ${slug}`);
  log(`  repo:        github.com/${GITHUB_OWNER}/${repoName} (${args.private ? "private" : "public"})`);
  log(`  features:    ${Object.entries(features).filter(([, v]) => v).map(([k]) => k).join(", ") || "(base only)"}`);
  log(`  delivery:    ${deliveryMode}`);
  log(`  neon region: ${region}`);
  if (args.dryRun) log(`  MODE:        DRY RUN — nothing will be created`);
  log(`${"═".repeat(56)}`);

  // 1) GitHub repo ------------------------------------------------------------
  step("GitHub — create repository");
  let cloneUrl = `https://github.com/${GITHUB_OWNER}/${repoName}.git`;
  let repoHtmlUrl = `https://github.com/${GITHUB_OWNER}/${repoName}`;
  if (!args.dryRun) {
    const repo = await api("https://api.github.com/user/repos", {
      method: "POST",
      token: GITHUB_TOKEN,
      body: { name: repoName, private: args.private, description: `${name} — built by VegaStar Digital` },
    });
    cloneUrl = repo.clone_url;
    repoHtmlUrl = repo.html_url;
    log(`  created ${repoHtmlUrl}`);
  } else log(`  would POST /user/repos { name: "${repoName}", private: ${args.private} }`);

  // 2) Export template, patch SITE_CONFIG, push -------------------------------
  step("GitHub — push template code with fresh SITE_CONFIG");
  if (!args.dryRun) {
    const workdir = mkdtempSync(path.join(tmpdir(), `nv-${slug}-`));
    try {
      // clone the local template (committed tree only — no node_modules, no scaffold/.env)
      run("git", ["clone", "--depth", "1", REPO_ROOT, workdir]);
      rmSync(path.join(workdir, ".git"), { recursive: true, force: true });
      rmSync(path.join(workdir, "scaffold"), { recursive: true, force: true }); // don't ship the scaffolder
      const cfgPath = path.join(workdir, "src", "lib", "siteConfig.ts");
      writeFileSync(cfgPath, patchSiteConfig(readFileSync(cfgPath, "utf8"), { name, slug, features }));

      const auth = ["-c", `http.extraheader=AUTHORIZATION: bearer ${GITHUB_TOKEN}`];
      run("git", ["init", "-b", "main"], { cwd: workdir });
      run("git", ["add", "-A"], { cwd: workdir });
      run("git", ["-c", "user.email=tool@vegastar.digital", "-c", "user.name=VegaStar Digital", "commit", "-m", `Initial site for ${name}`], { cwd: workdir });
      run("git", [...auth, "push", cloneUrl, "main"], { cwd: workdir });
      log(`  pushed initial commit`);
    } finally {
      rmSync(workdir, { recursive: true, force: true });
    }
  } else log(`  would clone template, patch siteConfig.ts (name/url/features/placeholders), push to ${cloneUrl}`);

  // 3) Neon database ----------------------------------------------------------
  step("Neon — create database");
  let databaseUrl = "postgresql://USER:PASS@HOST/db?sslmode=require";
  if (!args.dryRun) {
    const neon = await api("https://console.neon.tech/api/v2/projects", {
      method: "POST",
      token: NEON_API_KEY,
      body: { project: { name: slug, region_id: region, pg_version: PG_VERSION } },
    });
    databaseUrl =
      neon.connection_uris?.[0]?.connection_uri ||
      die("Neon did not return a connection_uri — check the API response above.");
    log(`  created Neon project "${slug}"`);
  } else log(`  would POST /projects { name: "${slug}", region_id: "${region}" }`);

  // 4) Migrate + seed ---------------------------------------------------------
  step("Prisma — migrate + seed empty defaults");
  let adminPassword = "(shown after real run)";
  if (!args.dryRun) {
    const dbEnv = { ...process.env, DATABASE_URL: databaseUrl };
    run("npx", ["prisma", "migrate", "deploy"], { cwd: REPO_ROOT, env: dbEnv });
    log(`  migrations applied`);
    const seedOut = run("node", ["prisma/seed.defaults.mjs"], {
      cwd: REPO_ROOT,
      env: { ...dbEnv, SEED_ADMIN_EMAIL: adminEmail, SEED_ADMIN_NAME: "Owner" },
    });
    const m = seedOut.match(/Password:\s*(\S+)/);
    adminPassword = m ? m[1] : "(see seed output)";
    log(`  seeded defaults + admin`);
  } else log(`  would: DATABASE_URL=<neon> npx prisma migrate deploy && node prisma/seed.defaults.mjs`);

  // 5) Vercel project + env + deploy ------------------------------------------
  step("Vercel — create project, set env, deploy");
  if (!args.dryRun) {
    const project = await api(`https://api.vercel.com/v10/projects${teamQ}`, {
      method: "POST",
      token: VERCEL_TOKEN,
      body: {
        name: slug,
        framework: "nextjs",
        gitRepository: { type: "github", repo: `${GITHUB_OWNER}/${repoName}` },
      },
    });

    // env vars: DATABASE_URL + URLs + a random admin secret, plus any shared
    // agency defaults present in scaffold/agency.secrets.env (Stripe test keys,
    // HERE, SMTP, Google...). Real per-client secrets are swapped at onboarding.
    const shared = parseEnvFile(path.join(REPO_ROOT, "scaffold", "agency.secrets.env"));
    const envVars = {
      DATABASE_URL: databaseUrl,
      SITE_URL: vercelUrl,
      NEXT_PUBLIC_SERVER_URL: vercelUrl,
      ADMIN_SECRET: run("node", ["-e", "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"]),
      OWNER_ALERT_EMAIL: adminEmail,
      ...shared,
    };
    for (const [key, value] of Object.entries(envVars)) {
      if (value === undefined || value === "") continue;
      await api(`https://api.vercel.com/v10/projects/${project.id}/env${teamQ}`, {
        method: "POST",
        token: VERCEL_TOKEN,
        body: { key, value: String(value), type: "encrypted", target: ["production", "preview", "development"] },
      });
    }
    log(`  project created + ${Object.keys(envVars).length} env vars set`);

    // trigger a production deploy from the pushed main branch
    await api(`https://api.vercel.com/v13/deployments${teamQ}`, {
      method: "POST",
      token: VERCEL_TOKEN,
      body: { name: slug, project: project.id, gitSource: { type: "github", ref: "main", repo: `${GITHUB_OWNER}/${repoName}` }, target: "production" },
    });
    log(`  deploy triggered`);
  } else log(`  would create Vercel project "${slug}", set env vars, trigger deploy`);

  // 6) Register in the agency dashboard (Stage 5) -----------------------------
  step("Agency registry");
  if (!args.dryRun && process.env.AGENCY_REGISTRY_URL && process.env.AGENCY_REGISTRY_SECRET) {
    try {
      await api(process.env.AGENCY_REGISTRY_URL, {
        method: "POST",
        token: process.env.AGENCY_REGISTRY_SECRET,
        body: { name, slug, repoUrl: repoHtmlUrl, liveUrl: vercelUrl, deliveryMode, status: "LIVE" },
      });
      log("  registered in dashboard");
    } catch (e) {
      log(`  (registry not updated: ${e.message.split("\n")[0]})`);
    }
  } else log("  (Stage 5 dashboard not configured yet — skipped)");

  // Summary -------------------------------------------------------------------
  log(`\n${"═".repeat(56)}`);
  log(`  ✓ ${name} scaffolded`);
  log(`  Repo:  ${repoHtmlUrl}`);
  log(`  Live:  ${vercelUrl}`);
  log(`  Admin: ${adminEmail} / ${adminPassword}`);
  log(`  Delivery mode: ${deliveryMode}`);
  log(`${"═".repeat(56)}`);
  log(`\nNext: edit src/lib/siteConfig.ts in the new repo to fill in real address/phone/hours,`);
  log(`then add menu items + images from the admin dashboard.`);
}

main().catch((e) => {
  console.error(`\n✖ ${e.message}`);
  process.exitCode = 1;
});
