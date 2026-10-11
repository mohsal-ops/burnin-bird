import { PosError } from "./types";

// Small fetch wrapper shared by adapters: JSON in/out, timeout, and a PosError
// that says whether a retry makes sense. Never put tokens in error messages.

export async function posFetch<T>(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: unknown; timeoutMs?: number } = {},
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 15_000);
  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers },
      body: init.body === undefined ? undefined : typeof init.body === "string" ? init.body : JSON.stringify(init.body),
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new PosError(`network error: ${(e as Error).name === "AbortError" ? "timeout" : (e as Error).message}`, true);
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const retryable = res.status === 429 || res.status >= 500;
    throw new PosError(`HTTP ${res.status}: ${describeError(json) || text.slice(0, 200)}`, retryable, res.status);
  }
  return json as T;
}

function describeError(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const j = json as Record<string, unknown>;
  // Square: { errors: [{ code, detail }] }
  if (Array.isArray(j.errors)) {
    return (j.errors as { code?: string; detail?: string; message?: string }[])
      .map((e) => [e.code, e.detail ?? e.message].filter(Boolean).join(": "))
      .join("; ");
  }
  // Clover / generic: { message } / { error }
  if (typeof j.message === "string") return j.message;
  if (typeof j.error === "string") return j.error;
  return "";
}
