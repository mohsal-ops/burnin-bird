# 00 — Recon & foundation

Branch: `feat/platform-foundation` (based on `main`). Nothing here changes runtime behaviour of any client site.

## What was done
- Mapped the current system → `docs/ARCHITECTURE.md` (burnin-bird = template for all client sites; orders are `Cart` rows finalized idempotently in `src/lib/finalizeOrder.ts`; flags live in `SiteSetting`).
- Researched the 7 unknowns against official docs → `docs/research/U1…U7`.
- Recorded decisions → `docs/DECISIONS.md`.
- Foundation code (unused until later phases import it):
  - `src/lib/secretBox.ts` — AES-256-GCM encrypt/decrypt for third-party tokens, per-domain key derived from `ADMIN_SECRET`; `maskSecret` / `maskPhone` for logs.
  - `src/lib/flags.ts` — `isEnabled / getAllFlags / setFlag`; all flags OFF by default; env kill switches `STARVEGA_KILL_<FLAG>` and `STARVEGA_KILL_ALL`.
- Test runner: Vitest (`npm test`), `npm run typecheck`. 4 unit tests for secretBox pass.
- `.env.example` rewritten as a values-free reference of every env var the code reads, now tracked in git (`!.env.example` in `.gitignore`).

## Unknowns — outcome
| # | Question | Answer | Effect on plan |
|---|---|---|---|
| U1/U2 | Can we push paid orders into Square? | Yes: Orders API + EXTERNAL payment + PayOrder. DELIVERY fulfillment looks partner-only. | Send PICKUP + delivery note. |
| U3 | Clover single-merchant without app review? | Sandbox yes; real merchants need private-app approval. | Build it; flag "needs approval". |
| U4 | Toast standard API writes orders? | No (read-only). | Scaffold only. |
| U5 | Apple template apps | Guideline 4.2.6: app must be published under the restaurant's own developer account. | Native app is a per-client service, last phase. |
| U6 | iOS web push | iOS 16.4+, only after "Add to Home Screen", needs user tap. | PWA install prompt must explain this on iPhone. |
| U7 | DoorDash Drive | JWT HS256 (`dd-ver: DD-JWT-V1`), quotes expire after 5 min. | Re-quote at dispatch if stale. |

## Verified
- `npx vitest run` → 4/4 pass.
- `npx tsc --noEmit` → clean (exit 0).

## NEEDS MOHSAL
1. **Your local `burnin-bird/.env.example` contained a real Brevo API key.** It was never committed (gitignored), and I replaced the file with an empty template. Keep the key only in Vercel env / `.env.local`. Rotate it in Brevo if that file was ever shared.
2. Square developer account → sandbox app (Application ID + secret) for the Square sandbox check.
3. Clover developer account → sandbox merchant + app; request private-app approval when the first real Clover client signs.
4. DoorDash Drive developer portal → sandbox developer_id / key_id / signing_secret.
5. Later phases: VAPID keys for web push (I can generate these; nothing to buy).
