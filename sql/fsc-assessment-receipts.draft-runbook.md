# FSC production receipt draft — owner runbook

Status: proposal and additive draft only, not applied. AM-003/AM-004 acceptance, complete S-005 application implementation/verification and production authorization are separate prerequisites. No root application dependency was added for this draft.

## Application order

1. `fsc-assessment-receipts.draft.sql` — creates `fsc_private` (receipts, effects, AM-004 admission counters), all RPCs, triggers, revokes/grants. Run first; every later file depends on its objects existing.
2. `fsc-cleanup-schedule.draft.sql` — owner-run only, after (1). Enables pg_cron only if absent and schedules the single named minute job that calls both cleanup functions. Refuses instead of overwriting a conflicting same-named job.
3. `fsc-cleanup-health.sql` and `fsc-receipt-reconciliation-report.sql` — read-only, run any time after (1); (health) is most useful after (2) has had time to run. Run `fsc-receipt-reconciliation-report.sql` in the Supabase SQL editor, which stops the whole script on the first error: this is what makes its `FSC_ACCOUNT_IDENTITY_MISMATCH` guard actually block the report rather than silently producing an empty result. A client that instead continues executing later statements after an earlier one errors could show an empty (falsely "nothing to reconcile") result once the guard fails — run it only in a client that stops on error.

## Review before execution

1. Read harness/PRODUCTION-RECEIPT-PROPOSAL.md and harness/ABUSE-AND-PRIVACY-PROPOSAL.md and obtain Brian's architecture/retention acceptance. Company recipient is already approved as info@floridasecurityconcepts.com; sender and customer-copy settings are not changed by SQL.
2. Independently review fsc-assessment-receipts.draft.sql, fsc-cleanup-schedule.draft.sql and their exact SHA-256 in harness/evidence. Reconcile any reviewer findings first. Confirm target project identity in the Supabase dashboard. Schema/domain guards reduce mistakes but cannot distinguish a cloned database with identical metadata.
3. Confirm existing configured account slug `fsc`, active status and FSC domain. The draft normalizes scheme/www/trailing slash. It never guesses an account UUID and verifies configured account/domain for every RPC. Identity is an expected guard based on DEPLOYMENT.md, not a claim that production account rows were inspected.
4. Confirm schema metadata has not drifted from harness/evidence/prime-schema-metadata-20260914.json. Confirm the server role already bypasses RLS and has SELECT/UPDATE on accounts (UPDATE is needed by PostgreSQL row-lock privilege checks), SELECT/INSERT on leads. This draft does not grant new access to either existing table. Stop on missing privileges; do not add a definer workaround or widen existing permissions silently.
5. Confirm private schema is not in exposed Data API schemas. New public RPC entrypoints explicitly revoke PUBLIC/anon/authenticated execution. RLS is enabled on all three private tables (receipts, effects, admission counters) in the same transaction. Existing service_role credentials remain powerful and must never reach the browser. Invoker RPCs mean that trusted service_role also has direct private-table DML; this is not isolation from a compromised server credential.
6. After all gates, Brian alone may run the entire reviewed SQL file in the correct project's SQL editor. Do not execute isolated excerpts. Objects already existing cause a fail-closed refusal rather than being replaced. No business lead rows are inserted by migration application.
7. Enter `FSC_ADMISSION_HMAC_KEY` (a dedicated 64-hex-character / 32-byte cryptographically random secret, never reused from Resend or the Supabase service-role key) into Vercel **Production server environment only** before or alongside applying this SQL. It is never `NEXT_PUBLIC_*`, never set in Preview, and its value is never pasted into chat, evidence or logs — presence/length (64 hex characters) is the only thing anyone other than Brian verifies. This key is NOT required application configuration (D-023a): the application starts and serves the receipt path without it. Its absence or malformed value only makes `trustedSourceDigest()` return null, which SQL treats as `SOURCE_UNAVAILABLE`/503 for **new** request IDs only — an existing/known request ID still reconciles normally without it, per AM-004.
8. `fsc-cleanup-schedule.draft.sql` requires (1) already applied (it preflights that both cleanup functions exist) and the target project's `pg_cron` extension available (Supabase-hosted Postgres ships it; confirm entitlement in the dashboard first). Run it once; re-running is idempotent as long as the job still matches exactly. If it raises `FSC_CLEANUP_JOB_NAME_CONFLICT`, an unrelated job already uses this exact name — resolve that naming collision manually before proceeding; never rename around it silently.

## Runtime integration contract (implemented; see application source for the current state)

- Require validated UUIDv4 requests and normalized fields. Compute the approved canonical SHA-256 in server code and snapshot rendered envelopes/template version before create. SQL validates digest shape and structural envelope constraints; application tests must prove semantic canonicalization and exact Resend envelope reuse.
- Create-or-read returns READY/RECEIVED/CONFLICT/EXPIRED. Claim returns a lease token and immutable provider key. The server must recheck returned lease/cutoff against its current clock before each send, with a bounded request budget. No delayed task may treat an old returned lease as indefinite authorization.
- Email claim cutoff is the earlier receipt expiry and first attempt plus 23h55m, leaving margin before the provider window. Leases last at most 30 seconds and are bounded by cutoff. Claim requires at least 15 seconds remaining; stale workers cannot finish after lease expiry. Reclaim uses the same immutable envelope/key. After cutoff, reconcile manually; never generate a new provider key for the same effect.
- Record primary provider acceptance durably before returning 200. Preserve known primary success on secondary failure. Prime RPC inserts the stable UUID and marks its effect in one transaction; it fails on an unrelated UUID collision and does not overwrite a lead. Existing field mapping is preserved from the current adapter and authoritative metadata.
- Seven-day purge and explicit deletion-request erase clear payload, fingerprint, envelopes, template, provider IDs, error categories, keys and leases. Expired and erased request IDs remain unrecreatable tombstones. Retained fields are account/request/receipt/stable-lead UUIDs, creation/expiry/purge/acceptance timestamps, effect labels/final states and update time. These are private, potentially linkable identifiers.
- Purge/erase can resolve the configured account even if inactive or archived, so disabling admission does not prevent deletion. Ordinary admission/claim/finish remains active-only. Deletion propagation to existing Prime leads and Resend is outside this additive receipt-copy function and must follow approved existing procedures.
- A monitored owner-run purge schedule and reconciliation workflow are release prerequisites. No schedule, hosted job, live email, live database write or retention-policy publication was created here.

## AM-004 admission counters and scheduling granularity

- `fsc_private.admission_counters` is transient operational state, not an append-only ledger: one row per (account, keyed source digest), holding at most 20 rolling admission timestamps and an `expires_at`. It never stores contact data, a raw address, the logical request UUID or the fingerprint. `fsc_receipt_create_draft` now takes a 7th argument, `p_source` (the caller-computed digest); an existing/known request ID is always read without touching this table, even when `p_source` is NULL or the source is already at capacity. A genuinely new ID with a NULL/malformed source is refused (`SOURCE_UNAVAILABLE`) before any row is written.
- `fsc_admission_cleanup_draft('fsc')` deletes only this account's counter rows whose `expires_at <= clock_timestamp()`; it never touches receipts, effects, leads or accounts. Its retention is ten minutes after the last admitted timestamp, then eligible on the next scheduled minute tick — not a hard real-time delete, exactly like the receipt-payload purge's seven-day eligibility.
- `fsc-cleanup-schedule.draft.sql` runs both `fsc_receipt_purge_draft('fsc')` and `fsc_admission_cleanup_draft('fsc')` from the same minute job, so both retention promises share one monitored schedule. `fsc-cleanup-health.sql` reports both backlogs (receipts due for purge, expired counters) separately, plus the job's own existence/active/schedule/command-match/last-success status, and a `healthy` boolean requiring the job to exist, be active, have its schedule AND command match exactly what's expected, a successful run within 5 minutes, and neither backlog more than 5 minutes overdue.
- Not proven locally: pg_cron's actual hosted scheduler behavior, PostgREST ACL enforcement on the new RPCs/tables, and Vercel's `x-vercel-forwarded-for` production ingress provenance are not proven by local/isolated tests — they remain separate hosted-environment verification steps before this is called a working release, per LAUNCH-OPERATIONS-ADDENDUM.md and ABUSE-AND-PRIVACY-PROPOSAL.md.

## Current evidence

The authoritative evidence for this session is the S-005 verification gate log `harness/evidence/S-005-verify-20260914-204740-745-c0c0c1cc3e164327a5f1e7e88e288de8.log` (exit 0: 172 unit, 157 gate tests against real PostgreSQL 17.11, 83 browser), with the independent safety review in `harness/evidence/S-005-safety-review.md`. SHA-256 of the gated SQL: receipts migration db36d14afef74eaf7cb0bcc4ebdc08ae02b2f9f13ab3da098f931354d2e6a228; schedule a6ca1f60e9bbc9a2f74f335b7ed1c9177953df2b2eb648adb884239f6d552bd4; health 73c9be41655d679dbf7686af4c1bb158ac52505f6482d786305417b8f54d5e17; reconciliation report a83df65be5d51c3b14614c9e84d5a95a1136b4244431a21db3106a74ce891eb1. Verify the hashes of the files you paste into the SQL editor match these. That real-PostgreSQL evidence supersedes the historical PGlite note below for concurrency/lock/ACL claims.

### Historical note: early disposable PGlite design check (superseded)

Before real PostgreSQL 17 test infrastructure existed, PGlite 0.5.8 was pinned under ignored .fsc-test/sql-draft-check as an early, disposable design sanity check (harness/evidence/S005-sql-draft-check.mjs). The checker reads the exact draft and instantiates synthetic in-memory accounts/leads; it never connects to Supabase. PGlite uses one exclusive connection, so this could only prove sequential claim/replay behavior — never inter-process lock contention, rollback under lost responses, ACL enforcement or provider delivery. **This PGlite run is not S-005 acceptance evidence** and must not be cited as proof of concurrency safety; it only established that the SQL was syntactically/semantically sane before writing real tests.

Sources reviewed at that stage: [PGlite getting started and exclusive-connection limit](https://pglite.dev/docs/), [Supabase function permissions](https://supabase.com/docs/guides/database/functions), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase changelog](https://supabase.com/changelog.md).

## Manual containment and rollback

**Fastest containment step (owner actions, no SQL):** in Vercel's Production environment variables, unset or change `LEAD_DELIVERY_MODE` away from `resend`/`resend+supabase` (e.g. to an empty/unrecognized value). Vercel environment variable changes take effect only for **new** deployments, not the already-running one — so this requires (1) changing the variable and (2) redeploying the current Production deployment (e.g. "Redeploy" in the Vercel dashboard, or a no-op commit). Confirm the change actually took effect by checking in Vercel that the redeployed Production deployment is live with the changed variable (do not probe with a request: a malformed/rejected probe returns 400 before the dispatcher and proves nothing, while a validly-formed probe could itself deliver a live lead to the real provider). Optionally, watch for the next organic submission's `[lead-delivery]` server log line showing `result: 'unavailable'` as separate confirmation. This stops new admission/effect execution without touching any data, and is reversible by restoring the variable and redeploying again.

Stop new receipt admission and effect execution before reverting application code. Preserve the new tables and all unresolved effect evidence for reconciliation. Reverting to the old application also removes the new duplicate and abuse-admission safeguards; do not describe it as an equivalent-safe rollback. Do not drop the schema, delete existing leads/accounts, reset states or replay uncertain effects automatically. Any future object removal or production data transformation requires separate explicit owner authorization.

To pause the scheduled cleanup job without touching any other project's jobs: `SELECT cron.unschedule('fsc-assessment-private-cleanup');` (owner-run only). Do not disable the `pg_cron` extension itself — other jobs may depend on it. Re-running `fsc-cleanup-schedule.draft.sql` afterward recreates the same named job. Pausing cleanup does not delete the `admission_counters`/receipt data already written; reconcile before re-enabling.

**Warning:** pausing or unscheduling the cleanup job makes the published "seven days before scheduled cleanup" disclosure untrue for as long as it stays paused — receipt payloads and admission counters simply keep accumulating past their eligibility window instead of being deleted on the next tick. Re-enable the job (or otherwise purge the backlog) before that public statement is relied on again, and treat an extended pause as an operational/privacy issue to resolve promptly, not a routine maintenance state.

`fsc-cleanup-health.sql` reads `cron.job`/`cron.job_run_details`, which carry pg_cron's own row-visibility policy restricting rows to the job owner (and superuser/service roles) — this is pg_cron's own access control, not a Supabase-specific RLS policy. Run the health check as the same role that owns the scheduled job (typically the role that executed `fsc-cleanup-schedule.draft.sql`), or it may silently report `job_exists = false` even though the job exists.

## AM-005 `crm_lead` (session S-CRM-001)

Additive, secondary-effect amendment: after the company email is durably accepted, every website assessment also creates exactly one lead in the FSC CRM, best-effort. Nothing in AM-003/AM-004 above is changed; `company_email`, `customer_email` and `prime_lead` behavior is unaffected.

### Application order

0. **Before applying**, confirm the two CHECK constraints on `fsc_private.assessment_effects` have not drifted from the AM-003 file — the migration's strict discovery refuses to run otherwise anyway, but checking first avoids a surprise RAISE:
   ```sql
   SELECT a.attname AS column_name, c.conname, pg_get_constraintdef(c.oid) AS definition
   FROM pg_constraint c
   JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
   WHERE c.conrelid = 'fsc_private.assessment_effects'::regclass AND c.contype = 'c'
     AND cardinality(c.conkey) = 1 AND a.attname IN ('effect', 'error_category')
   ORDER BY 1;
   ```
   This finds the constraints by column, the same way the migration does. Expect **exactly two rows**, one per column. Zero rows, or more than two, means stop and investigate. The definitions must be exactly:
   - `effect`: `CHECK ((effect = ANY (ARRAY['company_email'::text, 'customer_email'::text, 'prime_lead'::text])))`
   - `error_category`: `CHECK ((error_category = ANY (ARRAY['provider_unavailable'::text, 'ambiguous'::text, 'database_unavailable'::text, 'cutoff'::text, 'configuration'::text])))`

   If either differs, **stop** — the migration will refuse anyway (`FSC_CRM_UNEXPECTED_EFFECT_CHECK` / `FSC_CRM_UNEXPECTED_ERROR_CATEGORY_CHECK`), and changes nothing when it does. (The already-widened text, if this migration was already applied and then rolled back via Part A, is also accepted — see "Rollback" below.)
1. Set the shared secret on **both** sides, and the URL, together: generate the secret once (Brian only), set it as the CRM `crm-intake` Edge Function secret, and set Vercel **Production-only** `FSC_CRM_INTAKE_URL` and `FSC_CRM_INTAKE_HMAC_SECRET`. Values never go in chat, Git or evidence — only names/presence/length are verified by anyone but Brian. **The secret must have no leading or trailing whitespace on either side** — `crmDependencies()` treats a value that differs from its own `.trim()` as invalid config (the kill switch engages), it never silently strips it, because the CRM side does not trim either and a padded value would sign bytes the CRM verifies differently.
2. Apply `sql/fsc-crm-lead-effect.draft.sql` in the **Prime** project's SQL editor (the same project `fsc-assessment-receipts.draft.sql` was applied to), **at low traffic**. It preflights that the AM-003 objects exist and that `public.fsc_crm_claim_draft(text,uuid)` does not already exist; otherwise it RAISEs and changes nothing. The `ALTER TABLE ... DROP/ADD CONSTRAINT` statements take an `ACCESS EXCLUSIVE` lock on `fsc_private.assessment_effects` for the duration of the transaction, bounded by `lock_timeout = '5s'` — every concurrent `company_email`/`customer_email`/`prime_lead` claim/finish RPC briefly queues behind it. Applying during a quiet period keeps that queuing imperceptible.
3. Merge the PR (auto-deploys production).

This order (secret+URL, then SQL at low traffic, then merge) is **preferred**, but the code tolerates any order between (1)/(2) and (3): before the SQL is applied, `fsc_crm_claim_draft` doesn't exist yet, so the RPC call 404s and the step logs `crm_pending` — a no-op, with `company_email`/`prime_lead`/`customer_email` unaffected. Before the secret/env vars are set, `crmDependencies()` returns `null` and the step logs `crm_configuration` — also a no-op.

### Verification queries (read-only)

Run in the Prime project's SQL editor after applying the migration:

```sql
-- Confirm the new function exists.
SELECT proname FROM pg_proc WHERE proname = 'fsc_crm_claim_draft' AND pronamespace = 'public'::regnamespace;

-- Confirm ACL: only service_role may execute (anon/authenticated must be denied).
-- has_function_privilege checks the actual, effective grant (including role
-- membership and default-privilege interactions); a routine_privileges query
-- can miss grants that resolve through membership rather than a direct row.
SELECT has_function_privilege('anon', 'public.fsc_crm_claim_draft(text,uuid)', 'EXECUTE') AS anon_can_execute,
       has_function_privilege('authenticated', 'public.fsc_crm_claim_draft(text,uuid)', 'EXECUTE') AS authenticated_can_execute,
       has_function_privilege('service_role', 'public.fsc_crm_claim_draft(text,uuid)', 'EXECUTE') AS service_role_can_execute;
-- Expect: anon_can_execute = false, authenticated_can_execute = false, service_role_can_execute = true.
```

After a live submission (owner-run, per §12 of the session contract), `sql/fsc-crm-lead-reconciliation-report.sql` shows the outcome: a `crm_lead` row with `state` not `succeeded`/`skipped` (e.g. `pending` or `uncertain`) if something needs attention, or no `crm_lead` row at all with `state = 'missing'` if the kill switch was engaged, the budget was skipped, or the RPC failed before the row existed. A `succeeded` `crm_lead` row never appears in the report (same as the other three effects). This is a **separate** report file from `sql/fsc-receipt-reconciliation-report.sql` — kept separate so that existing report's output stays byte-for-byte unchanged for its own pinned gate test, **not** because that report is scoped to only the other three effects: it has no `effect` filter at all, so it lists every non-`succeeded`/`skipped` row for *any* effect, including a `crm_lead` row, once one exists. `sql/fsc-crm-lead-reconciliation-report.sql` additionally lists the "missing" case that the other report cannot express (no `crm_lead` row exists at all). Before the AM-005 migration is applied, the "missing" half of this report is intentionally empty (it only lists a receipt as missing a `crm_lead` row once `public.fsc_crm_claim_draft` exists to actually claim one).

### Rollback

**Part A — `sql/fsc-crm-lead-effect.rollback.draft.sql` (the normal, always-safe rollback):** revokes and drops `public.fsc_crm_claim_draft` only. It always succeeds, including after live `crm_lead` rows already exist — nothing in this codebase ever deletes `fsc_private.assessment_effects` rows (purge/erase only null columns; `service_role` has no `DELETE` grant on that table), so a rollback that first demanded those rows be gone could never run once a single lead had gone through. The widened `effect`/`error_category` CHECK constraints are deliberately left in place by Part A: they are harmless supersets, and once the function is dropped nothing can insert a new `crm_lead` row or `conflict`/`validation` category again. This is sufficient containment on its own.

**Pair Part A with the kill switch.** Dropping the function does not stop the application from calling it: every future submission's CRM step will still call `fsc_crm_claim_draft`, get a 404 (function does not exist), and log `crm_pending` — harmless (no visitor-facing effect, `company_email`/`prime_lead`/`customer_email` all unaffected) but needlessly noisy. Unset `FSC_CRM_INTAKE_URL` in Vercel Production (and redeploy) alongside Part A so `crmDependencies()` returns `null` and the step is a clean, silent-by-design `crm_configuration` no-op instead.

**Re-enabling after Part A: just re-apply `sql/fsc-crm-lead-effect.draft.sql`.** Its strict CHECK discovery accepts either the original AM-003 text or the already-widened text Part A leaves behind (see "Application order" step 0), so re-running the migration after Part A succeeds even with `crm_lead`/`conflict`/`validation` rows already present — it leaves the (already-widened) CHECKs alone and only re-creates the function. There is no separate "re-enable" file or procedure.

**Part B — `sql/fsc-crm-lead-effect.rollback-narrow.destructive.draft.sql` (DESTRUCTIVE, owner-only, NOT RECOMMENDED, does not run by default):** additionally narrows both CHECK constraints back to their exact pre-AM-005 lists. It preflights that Part A has already run (the function must not exist), then RAISEs and changes nothing if any `crm_lead` effect row, or any row with `error_category` `conflict`/`validation`, still exists — this file contains **no `DELETE` statement**. Disposing of those rows is Brian's own separate, explicitly authorized, manual action, performed and reviewed on its own outside this file, before re-running Part B. There is no other path (purge/erase never delete rows, only null columns) — do not describe "wait for them to age out" as a way to unblock this file, because nothing ages them out of existence. Once Part B has narrowed the CHECKs, re-enabling requires the full migration again (which will widen them back from the original text, per step 0).

### Kill switch

Unset `FSC_CRM_INTAKE_URL` (or `FSC_CRM_INTAKE_HMAC_SECRET`) in Vercel Production and redeploy, exactly like the AM-003 containment step above (env var changes only take effect on a new deployment). With either variable missing or invalid, `crmDependencies()` returns `null`, the application makes **zero** RPC calls and **zero** fetches for the CRM step, and logs exactly one line: `[lead-receipt] crm_configuration`. No `crm_lead` row is created. `company_email`, `prime_lead` and `customer_email` are entirely unaffected, in production or already-running deployments.

### Erasure note

`fsc_receipt_erase_draft` (and the scheduled purge) clear the website-side `crm_lead` effect row like the other three effects — but **do not reach the CRM**. A deletion request is only fully honored by also deleting the corresponding lead in the CRM app by hand (F-8). There is no automated propagation from this website's erase/purge path into the CRM.
