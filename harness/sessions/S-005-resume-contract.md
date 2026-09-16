# S-005 resume contract — Claude Code specialists, 2026-09-14

Authority: approved AM-003 (D-017), AM-004 activation (D-021), D-018 portable PostgreSQL test runtime, D-019 owner-run pg_cron draft, D-022 (this resume). Tier 3. This packet refines the approved proposals into exact interfaces so builder and test-guard can work in parallel. It does not change architecture, retention, recipients, cost or owner-only boundaries. Any discovered non-equivalent change is reported to the orchestrator before implementation.

Ground truth at resume (orchestrator inspection): uncommitted partial coordinator `lib/leads/productionReceipt.ts`, `lib/leads/environment.ts`, dispatcher/API/layout/robots edits, Resend envelope snapshot, `tests/helpers/postgres.ts`, `pg`/`@types/pg` dev dependencies installed. PostgreSQL 17.11 portable runtime extracted at `.fsc-test/pgsql/runtime/pgsql/bin` (postgres/initdb/pg_ctl present; archive SHA-256 4b8db093…e4537cf matches record). No pg_cron in the portable runtime. Branch never pushed. Existing unit test `tests/unit/delivery-safety.test.ts` still simulates the retired resend→supabase dispatcher and must be truthfully replaced, not deleted without equivalent-or-stronger coverage.

## Ownership (shared checkout — never edit another role's paths)

| Role | Owns |
|---|---|
| Builder | `sql/**`, `lib/leads/**`, `app/api/leads/route.ts`, `app/layout.tsx`/`app/robots.ts` preview isolation only, `components/LeadCaptureForm.tsx` (disclosure text + new response codes only) |
| Test-guard | `tests/**`, `vitest*.ts`, `playwright.config.ts`, `package.json` scripts/devDependencies + lockfile |
| Orchestrator | `harness/**`, `DEPLOYMENT.md`, evidence, verification gate execution |

Never run production SQL, contact Supabase/Resend/Vercel, read `.env*` files, print environment values, or add paid services. All data synthetic (`@example.invalid`).

## SQL contract (builder; exact SQL is tested by test-guard against real PostgreSQL 17)

Keep `_draft` suffixes and existing AM-003 objects. Additive changes only:

1. `fsc_private.admission_counters(account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT, source_digest text NOT NULL CHECK (~ '^[0-9a-f]{64}$'), admitted_at timestamptz[] NOT NULL CHECK (cardinality <= 20), expires_at timestamptz NOT NULL, PRIMARY KEY(account_id, source_digest))`. RLS enabled in the same migration; PUBLIC/anon/authenticated revoked; service_role SELECT/INSERT/UPDATE/DELETE on this table only (no DELETE on receipts/effects). No contact data, raw address, request UUID or fingerprint in this table.
2. `public.fsc_receipt_create_draft(p_slug text, p_request uuid, p_fingerprint text, p_payload jsonb, p_envelopes jsonb, p_template text, p_source text)` replaces the six-argument form (single migration, never two overloads). Behavior in one transaction:
   - Existing receipt for (account, request): return `EXPIRED` / `CONFLICT` / `READY` / `RECEIVED` exactly as today, **without** touching any counter, even when p_source is NULL or at capacity.
   - New request and p_source NULL or malformed: `{"code":"SOURCE_UNAVAILABLE"}`, no rows written.
   - New request: lock/create the counter row, prune timestamps older than DB-now minus 10 minutes, recheck receipt existence after the lock. If 20 remain: `{"code":"RATE_LIMIT","retry_after":<ceil seconds until earliest retained timestamp + 10 min, min 1>}`, no receipt, counter expiry not extended. Otherwise insert receipt (ON CONFLICT DO NOTHING); only if this call inserted it, append DB-now and set `expires_at = now + 10 minutes`. Then effects/READY as today. Rollback leaves neither.
3. `public.fsc_admission_cleanup_draft(p_slug text) RETURNS integer` deletes only this account's counter rows with `expires_at <= clock_timestamp()`. Never touches receipts, effects, leads or accounts.
4. `sql/fsc-cleanup-schedule.draft.sql` (owner-run, separate file): identity/preflight guards; `CREATE EXTENSION IF NOT EXISTS pg_cron` only when absent; one job named `fsc-assessment-private-cleanup` scheduled `* * * * *` running exactly `SELECT public.fsc_receipt_purge_draft('fsc'); SELECT public.fsc_admission_cleanup_draft('fsc');`; if a job with that name exists with a different command or schedule, RAISE and change nothing. Never unschedule/alter other jobs or disable pg_cron.
5. `sql/fsc-cleanup-health.sql` (read-only): job exists/active/schedule/command match, last successful run time, receipts due for purge (count, oldest overdue seconds), expired counters (count, oldest overdue seconds), unresolved effects by effect/state (counts only), and a `healthy` boolean = job active AND successful run within 5 minutes AND no purge/counter backlog over 5 minutes overdue. Output counts/timestamps/status only.
6. `sql/fsc-receipt-reconciliation-report.sql` (read-only, D-022): receipt_id, request_id, effect, state, error_category, first_attempt_at, retry_cutoff, updated_at for effects not in succeeded/skipped. No payload, envelope, recipient, provider ID or contact field.
7. Update the draft runbook: application order (receipts migration → schedule → health), key/secret entry, rollback, pg_cron granularity (seven-day eligibility plus next minute tick; counter retention ten minutes after last admission plus next tick), and that hosted scheduler/ACL/PostgREST behavior is not proven locally.

## Application contract (builder)

- `lib/leads/admission.ts`: `trustedSourceDigest(headers: Headers, env = process.env): string | null`. Returns non-null only when `VERCEL` is set and `VERCEL_ENV === 'production'` and `isHostedPreview(env)` is false. Reads only `x-vercel-forwarded-for`; requires exactly one value with no comma, valid per `node:net.isIP`, no zone id (`%`); canonicalizes IPv4 to 4 bytes and IPv6 to 16 bytes, mapping `::ffff:a.b.c.d` to the IPv4 4 bytes. Key `FSC_ADMISSION_HMAC_KEY` must be exactly 64 hex characters (32 bytes) else null. Digest = lowercase hex HMAC-SHA-256(key, `fsc-admission-v1\0` + address bytes). Never logs or returns the address. Plain `x-forwarded-for`/`x-real-ip` are ignored.
- Route passes `req.headers` so the dispatcher can compute the digest for the production path; local path keeps the in-memory loopback limiter unchanged.
- Coordinator `deliverProductionReceipt(lead, requestId, deps, source: string | null)`; deps are injectable (`rpc`, `send`, `now`, `snapshot`) so unit tests never touch the network. Budgets: each RPC and each Resend call aborts at min(8 s, remaining server budget); total server budget 15 s; send only if lease/cutoff/budget leave ≥1 s. Status mapping:

| Condition | Result |
|---|---|
| create READY then company email recorded succeeded, or create RECEIVED | 200 `ok`, same receipt ID; then resume eligible Prime/customer effects within remaining budget; their failures never change 200 |
| create CONFLICT | 409 `CONFLICT` |
| create or claim EXPIRED | 409 `EXPIRED` |
| create RATE_LIMIT | 429 `RATE_LIMIT`, `Retry-After` = retry_after |
| create SOURCE_UNAVAILABLE, account refused, missing config | 503 `CONFIGURATION` (no effects) |
| company claim BUSY, or Resend 409 concurrent-idempotent | 409 `PENDING` (lease left to expire; no finish) |
| Resend 2xx with id but finish not SUCCEEDED, network error/timeout/5xx/429, or unknown response | finish `uncertain` (category `ambiguous`) where lease allows → 504 `RECEIPT_UNKNOWN` |
| Resend definitive rejection 400/401/403/422 (not idempotency conflict) | finish `failed` (category `configuration`) → 503 `DELIVERY_FAILED` |
| Resend 409 idempotency payload mismatch | finish `uncertain` (category `configuration`); never a new key → 504 `RECEIPT_UNKNOWN` |
| claim CUTOFF or RPC failure before primary acceptance | 504 `RECEIPT_UNKNOWN` |

- Resend request: `POST https://api.resend.com/emails`, `Idempotency-Key` from the claim (never regenerated), body exactly the stored envelope. Company `to` stays `info@floridasecurityconcepts.com`; sender from `LEAD_NOTIFICATION_FROM`; customer copy follows existing `LEAD_CONFIRMATION_*` settings.
- Required production configuration for the receipt path: `PRIME_SUPABASE_URL` (https), `PRIME_SUPABASE_SERVICE_ROLE_KEY`, `PRIME_ACCOUNT_SLUG === 'fsc'`, `RESEND_API_KEY`, `LEAD_NOTIFICATION_FROM`, `FSC_ADMISSION_HMAC_KEY` (64 hex). Missing → 503 before any RPC/send. Hosted preview → 503 before provider import (existing guard). Logs: enumerated codes only; no contact fields, headers, addresses, provider bodies, keys.
- Form: handle `CONFIGURATION`/`DELIVERY_FAILED` as known failure, `PENDING`/`RECEIPT_UNKNOWN` as unknown with same-ID retry, `RATE_LIMIT` as wait/call, `EXPIRED` as explicit new request (existing behavior). Add the AM-004 disclosure verbatim (two short paragraphs from ABUSE-AND-PRIVACY-PROPOSAL.md) near the submit area in small type, visible without opening "Add details". No other UI or copy changes.

## Test contract (test-guard)

Real PostgreSQL 17 (portable runtime via `tests/helpers/postgres.ts`, loopback, unique synthetic datadir under ignored `.fsc-test/postgres`, owned `pg_ctl` start/stop only; a missing runtime FAILS the suite, never skips). Never invoke any PostgreSQL CLI client; use the Node `pg` driver. Mock only Resend transport. Required cases, asserting actual row/effect/send counts:

- Receipts: new/unchanged replay (same receipt_id), changed-payload 409 with no effects, 24 h expiry boundary via DB-time manipulation in synthetic data, purged/erased IDs unrecreatable, immutable payload/envelope/identity triggers, Prime insert + effect atomic with rollback on collision, account inactive/archived/domain mismatch refusal, anon/authenticated/PUBLIC denied on tables and functions, service_role allowed.
- Leases: two separate OS processes (child `node` processes, not just two clients) racing claim → exactly one CLAIMED; stale token cannot finish; expired lease reclaimed with the identical key and envelope; cutoff refuses claim; server restart (pg_ctl stop/start) mid-flow preserves state and recovers with same key.
- Coordinator against real PG with mocked Resend: success path (1 company send, 1 Prime lead, customer per setting); unchanged retry after success sends nothing new; send timeout → 504 then retry reuses the same key/envelope and records success once; process-death simulation (provider accepted, finish never called) → retry recovers with same key; Prime failure keeps 200 and later retry records one lead; customer failure keeps 200 and never resends company; definitive 422 → 503; BUSY → 409 PENDING; frozen envelope/timestamps across retries with changed attribution.
- Admission (AM-004): 20 accepted / 21st 429 with correct Retry-After; retry of an existing ID at capacity exempt and uncharged; concurrent same-ID from multiple processes charges once; concurrent distinct IDs across processes never exceed 20; rolling-window expiry admits again; NULL source refuses only new IDs; cleanup deletes only expired counters and never receipts/effects/leads; no raw address in any table.
- Source digest unit tests: production-only activation, preview/local/null cases, IPv4, IPv6, IPv4-mapped equivalence, comma lists/multiple/zone/malformed rejected, bad key length rejected, spoofed `x-forwarded-for` ignored, digest stability.
- Isolation: hosted preview refuses before provider import; preview layout/robots noindex and analytics off; production-config-missing 503; logs contain no synthetic contact values or addresses (spy on console).
- Schedule SQL: exercised against a synthetic stub `cron` schema (clearly labeled simulation) for create, idempotent re-run, and refusal on a conflicting same-name job; health SQL runs read-only against real data and reports backlog correctly.
- Preserve the existing floor (96 unit, 11 gate, 83 browser at S-SEC-001). Replacing obsolete dispatcher simulations requires equal-or-stronger assertions; report old/new counts. Long PostgreSQL suites may live in a separate `test:unit` file set with an explicit timeout; they run inside the S-005 gate.

## Completion

Builder and test-guard hand off to the orchestrator with exact files, commands, exit codes and counts. Then independent safety review (no builder/test authorship), repairs, and the orchestrator runs `pwsh -NoProfile -File scripts/verify.ps1 -SessionId S-005`. External hosted schema, scheduler, PostgREST ACL, Vercel ingress provenance and inbox delivery remain unproven release prerequisites.
