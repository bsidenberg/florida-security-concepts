# S-005 independent safety review — 2026-09-14 (round 1)

Reviewer: independent safety-reviewer subagent (Opus), no authorship of code/tests. Report returned in-message (reviewer tool configuration cannot write files); saved by the orchestrator. Disposition: **BLOCKED**.

SQL SHA-256 at review: fsc-assessment-receipts.draft.sql b8f68e6e266970dfe36a4e76f4c6f03eace9cf3df6d44e5e65a99b33c4191e24; fsc-cleanup-schedule.draft.sql e4452b0f70516d75a5df3faa0f0f05c631e6abb53b0af260dd6f726b58b0804f; fsc-cleanup-health.sql 71cfc0dd80a464080f9100ca3b735de829aa430b422fe78f5f7aa40af4ac6eea; fsc-receipt-reconciliation-report.sql 22e9d752b7349f161b3c37a358e410298625b78576e19a79cce41505c26f176d.

Method: static review against resume contract/AM-003/AM-004/addendum/HARNESS/D-017..D-022; READ COMMITTED lock-order reasoning; 200,000-case differential fuzz of the admission.ts IPv6/IPv4-mapped parser against a reference canonicalizer (0 mismatches); Date.parse microsecond timestamp check.

## Findings

- **M-1 MAJOR** productionReceipt.ts:121-123,187-188; draft.sql:223-229,242-243; LeadCaptureForm.tsx:75 — a retry of an `uncertain` company email that meets a definitive 401/403/422 (e.g., key rotated) is recorded `failed` and shown "could not be delivered" although Resend may already have delivered it. Violates AM-003/C-02 "uncertain never described as failure". Fix: `failed`→503 only for a first-ever attempt; later definitive rejection → `uncertain`/configuration → 504; consider forbidding uncertain→failed in trigger; test.
- **M-2 MAJOR** (a) leadDelivery.ts:43 / route.ts:36-37 map any thrown error to 503 DELIVERY_FAILED; productionReceipt.ts:110 calls deps.send without try/catch — unknown outcomes can surface as known failures. (b) productionReceipt.ts:208-219 (missing HMAC key) and :161 (account refused) return 503 CONFIGURATION to same-ID retries of possibly-sent emails; conflicts with AM-004 "existing retries may still reconcile"; runbook line 19 inaccurate. Fix: unexpected throws after a possible claim → 504 RECEIPT_UNKNOWN; wrap company claimAndSend; form CONFIGURATION wording must not assert non-delivery; missing key → source null (new IDs blocked, existing reconcile).
- **M-3 MAJOR (conditional)** admission.ts:57-63 — IPv6 keyed per /128; a client controlling a /64 bypasses the limit (company notification + customer-confirmation relay flood). Key IPv6 by /64 via harness amendment, or hosted evidence of IPv4-only ingress, or explicit owner acceptance.
- **M-4 MAJOR (owner release gate)** LeadCaptureForm.tsx:94-97 — public privacy/retention disclosure has not been explicitly approved by Brian (AM-003 requires separate approval; D-021 notes AM-004 text not read). Accuracy: seven-day/identifier/no-address statements match code; "scheduled cleanup" true only once the pg_cron job is applied and healthy; stated purpose imprecise (dedupe window is 24 h; seven-day copy is troubleshooting/reconciliation); attribution collection not mentioned (omission). Obtain Brian's explicit approval of exact text before merge.
- **M-5 MINOR** draft.sql:174-176 — INSERT…ON CONFLICT DO NOTHING does not lock an existing expired counter; a concurrent cleanup delete makes the STRICT select raise → 504 for a new request. Fix: ON CONFLICT DO UPDATE SET expires_at=… RETURNING.
- **M-6 MINOR** productionReceipt.ts:105-110 — send ceiling uses `deadline` without a 1 s finish reserve; late acceptance leaves no time to record success (504, recoverable). Fix: min(deadline-1000, lease-1000, cutoff-1000); consider a monotonic clock.
- **M-7 MINOR** reconciliation-report.sql:128 via account_for_fsc FOR SHARE — "read-only" report takes row locks/needs UPDATE; fails in a read-only transaction. Resolve account with plain SELECT; include/filter purged tombstones.
- **M-8 MINOR** fsc-cleanup-schedule.draft.sql:21-27 — preflight lacks the account/database identity checks required by the addendum. Add account_for_fsc('fsc',false) and to_regclass checks of the three private tables.
- **M-9 MINOR** runbook — stale hash reference (line 14), PGlite evidence description (39-43), "still to implement" heading (22), inaccurate line 19, missing concrete containment step (unset LEAD_DELIVERY_MODE → 503), warning that pausing the job falsifies the published seven-day statement, and that health SQL must run as the job owner (cron.job RLS).
- **M-10 MINOR (pre-existing)** resend.ts:184-188 — customer confirmation to an arbitrary address echoes attacker-controlled name/city: spam/phishing relay through the verified sender, amplified by M-3. Strip free text or keep confirmation disabled until abuse controls are hosted-verified.
- **N-1** productionReceipt.ts:180-181 company `skipped` → 200; treat as unknown. **N-2** draft.sql:230 claim returns the full payload for prime_lead unnecessarily. **N-3** draft.sql:191-192 stamp not refreshed after insert wait (few-second skew, no safety impact). **N-4** budget check after CLAIMED holds a 30 s lease (safe). **N-5** health SQL: job_exists NULL not false; healthy ignores schedule/command match; unresolved counts include purged tombstones. **N-6** single-transaction pg_cron job couples purge and counter-cleanup failures. **N-7** URL with a path → 504 not configuration. **N-8** providers/supabase.ts and webhook.ts now dead code. **N-9** stray untracked %SystemDrive%/ and tmp/fsc-crm/.git must stay out of commits. **N-10** tombstone prime_lead_id is linkable (documented). **N-11** erase during a live lease can lead a new request to duplicate a sent email (owner-run erase only; by design).

## Controls verified correct

Duplicate safety (immutable SQL-generated key, envelope always from DB, lease/cutoff/expiry, token-matched finish, 200 only after durable acceptance, secondary failures never flip 200, concurrent 409 → PENDING, mismatch → uncertain, finish failure after acceptance recoverable by same-key reclaim); SQL lock order accounts→receipt/counter→effects with no cycles; admission charge-once and ≤20 under concurrency; retry_after and non-extension on rejection; cleanup scope; purge/erase vs CHECK/trigger; SECURITY INVOKER + pg_catalog search_path with qualified names; RLS on all three tables; PUBLIC/anon/authenticated revoked including Supabase default EXECUTE; service_role DELETE only on counters; single 7-arg create; one additive fail-closed transaction. pg_cron script: IF NOT EXISTS, single named job, conflicting job refused with rollback, no other jobs touched. Health/report output no payload/contact/provider IDs. Digest: production-only, x-vercel-forwarded-for only, comma/zone/malformed rejected, exact key validation, raw address never logged/stored/returned or attached to payload/Resend/lead; parser correct (fuzzed). Preview isolation, noindex/analytics off, production indexability unchanged, local path unchanged. Enumerated logs only; PostgREST message used only for account-refused detection. Config checks incl. https; company recipient hardcoded and SQL-enforced. Budgets: no path exceeds the 20 s client deadline; no send after lease expiry.

## Residual risks only hosted verification can close (round 1)

Vercel x-vercel-forwarded-for overwrite on the custom domain and IPv6 reachability; VERCEL_ENV present at production build/runtime (else fail-closed/noindex); PostgREST ACL on new RPCs, service-role header, schema cache reload; pg_cron entitlement/database name/actual successful run as job owner; Resend idempotent replay and 409 error names; Vercel function max duration ≥ ~20 s; actual inbox delivery.

---

# Round 2 re-review — 2026-09-14

Disposition: **CLEAR WITH MINOR** (code/SQL). Release still requires OD-07 owner approval of disclosure wording, the S-005 real-PostgreSQL gate log, hosted verification, and the minors below (R2-1, R2-3 before owner handoff).

SQL SHA-256 at round 2: fsc-assessment-receipts.draft.sql 4baab05eb4b63d375178c2904d8c13b24ff40a52f44a22893bda83df9db68b18; fsc-cleanup-schedule.draft.sql dc62c50d0162a3d434305bbc9a5da24e4f59730b431c671b844115f4c69d7726; fsc-cleanup-health.sql 73c9be41655d679dbf7686af4c1bb158ac52505f6482d786305417b8f54d5e17; fsc-receipt-reconciliation-report.sql 77a15c0bd1d93696c08057cb612f592998d70ab0246ed9f9a9c8a3e153a2d0c0.

Method: static adversarial re-review of repairs; two-clock lease/deadline reasoning; claim ordering, trigger vs purge/erase, counter upsert vs cleanup under READ COMMITTED; verbatim parser execution on representative /64, IPv4-mapped, ::ffff:0:, NAT64, 6to4 and case/compression variants (round-1 fuzz still applies to the unchanged parser core).

## Round-1 dispositions

M-1 RESOLVED (claim captures prior_attempt before UPDATE; app treats missing as true; failed only on first attempt) — with R2-4/R2-5. M-2a RESOLVED except R2-2. M-2b RESOLVED (key no longer required; null source blocks only new IDs; CONFIGURATION wording no longer asserts non-delivery). M-3 RESOLVED (IPv4-mapped detected before /64 truncation; same /64 spellings collide; 4- vs 8-byte inputs cannot collide; residual: ::ffff:0:a.b.c.d/::a.b.c.d/::1 share an all-zero bucket and 64:ff9b::/96 shares one; /56–/48 holders still get 256–65,536 buckets). M-4 OPEN owner gate OD-07. M-5 RESOLVED (single INSERT…ON CONFLICT DO UPDATE…RETURNING; cleanup interleavings safe; qualified column reference to be proven by the real-PG gate). M-6 RESOLVED (monotonic server budget; wall-clock lease/cutoff; 1 s finish reserve; no send can outlive its lease regardless of app/DB clock offset; 20 s client deadline respected modulo route overhead/cold start). M-7 RESOLVED except R2-3. M-8 RESOLVED. M-9 PARTIAL (see R2-1). M-10 RESOLVED (generic greeting, allowlisted categorical values only; template v3; company email unchanged). N-1, N-2, N-5 RESOLVED. Left as acceptable: N-3, N-4, N-6 (health surfaces failures), N-8 (dead providers; remove later), N-10, N-11. Still open notes: N-7 (URL with path → 504), N-9 (stray untracked folders must not be committed).

## New findings

- **R2-1 MINOR** runbook:51 — containment says changing LEAD_DELIVERY_MODE returns 503 "immediately"; Vercel env changes apply only to new deployments → add "redeploy current Production and confirm with a non-delivering probe". Also runbook:36 `healthy` description lacks schedule/command match; runbook:59 attributes cron.job RLS to Supabase (it is pg_cron's policy); ENVIRONMENT.md:83 stale key semantics (orchestrator corrected).
- **R2-2 MINOR** leadDelivery.ts:151 — outer catch still returns DELIVERY_FAILED without status (route → 503); reachable before any RPC (e.g., dynamic import failure) on a same-ID retry of an uncertain email. Map to RECEIPT_UNKNOWN/504 (or CONFIGURATION).
- **R2-3 MINOR** reconciliation-report.sql:151-155 — zero matching accounts yields zero rows, indistinguishable from "nothing to reconcile". Surface matched-account count or raise unless exactly 1.
- **R2-4 MINOR** draft.sql:143 — new uncertain→failed trigger prohibition is unreachable (finish only from inflight); real path uncertain→inflight→failed still allowed at SQL level; M-1 enforced only in app. Enforce in fsc_effect_finish_draft (e.g., downgrade failed to uncertain when a prior attempt existed).
- **R2-5 MINOR (UX, conservative)** draft.sql:230 / productionReceipt.ts:149-156 — prior_attempt = "ever claimed", so after a genuine first-attempt 422 every same-ID retry with 422 becomes uncertain/504, inviting indefinite retries. Safe but misleading; consider prior_uncertain = had_attempt AND state_before <> 'failed'.
- **R2-6 NOTE (feeds OD-07)** LeadCaptureForm.tsx:95-96 — attribution also used for source measurement in Prime (not only to respond); seven-day cleanup statement true only while pg_cron job healthy; indefinite retention of identifiers/status not stated explicitly — Brian should see this when approving wording.

## Controls re-verified after repairs

Duplicate controls unchanged and correct; no path now reports a possibly-sent company email as 503 except R2-2's pre-RPC import failure; purge/erase compatible with trigger/CHECKs; counter lock order unchanged, no new cycle; customer confirmation allowlisted/escaped fixed layout; health/schedule/report output limited to counts/timestamps/status/IDs; schedule touches one named job only; preview isolation, noindex/analytics and production-only digest activation unchanged.

## Residual hosted-only risks (round 2)

x-vercel-forwarded-for provenance and native IPv6 arrival (confirm no transition/all-zero-prefix sources; accept or amend /56–/48 bypass); VERCEL_ENV exposure at production build/runtime; PostgREST ACL/service-role header/schema cache reload; ON CONFLICT DO UPDATE qualified reference, prior_attempt field and trigger behavior must appear in the real-PG gate log; pg_cron entitlement/database name/real run as job owner; Resend replay/409 names/rejection-before-replay after key rotation; function max duration ≥ ~20 s; containment via env change requires redeploy; actual inbox delivery.

---

# Round 3 targeted re-review — 2026-09-14

Disposition: **CLEAR WITH MINOR**. No BLOCKER/MAJOR. Release still gated by OD-07, the S-005 real-PostgreSQL gate log and round-2 hosted checks.

SQL SHA-256 at round 3: fsc-assessment-receipts.draft.sql c28416d0e5f2fc5ccec658c458f866daaf2f7784c3018b71a8e50378cda4e5d9; fsc-cleanup-schedule.draft.sql a6ca1f60e9bbc9a2f74f335b7ed1c9177953df2b2eb648adb884239f6d552bd4; fsc-cleanup-health.sql 73c9be41655d679dbf7686af4c1bb158ac52505f6482d786305417b8f54d5e17 (unchanged); fsc-receipt-reconciliation-report.sql a83df65be5d51c3b14614c9e84d5a95a1136b4244431a21db3106a74ce891eb1.

Method: re-read changed effect table/trigger/claim/finish/prime/purge/erase, report, schedule preflight, productionReceipt.ts, leadDelivery.ts, runbook, D-025/D-026; enumerated every effect UPDATE path against CHECK (state='inflight')=(claimed_from_state IS NOT NULL), the enum and the trigger (chains: pending→inflight→failed; failed→inflight→crash→reclaim; uncertain→inflight→finish failed→downgraded; inflight→purge→uncertain; prime pending→inflight→succeeded). No legitimate path trips the new trigger rule.

Dispositions: R2-1 RESOLVED (residual R3-2). R2-2 RESOLVED (leadDelivery.ts:47-52 → 504). R2-3 RESOLVED (DO-block guard legal in READ ONLY; stops only if client stops on error — N-R3). R2-4 PARTIAL (see R3-1). R2-5 RESOLVED (prior_uncertain = had_attempt AND state<>'failed'). R2-6 tracked under OD-07.

New findings:
- **R3-1 MINOR** draft.sql:266 (with :288, :160) — reclaim of an expired inflight row preserves the original claimed_from_state (pending/failed) instead of recording uncertain; after a crash post-acceptance, a later definitive rejection would pass the SQL finish backstop and trigger as failed. App already maps this to uncertain (prior_uncertain=true), so only the defence-in-depth layer is weakened; comments at :247-251 and :262-265 contradict. Fix: claimed_from_state = CASE WHEN e.state='inflight' THEN 'uncertain' ELSE e.state END.
- **R3-2 MINOR** runbook containment — a malformed/honeypot probe returns 400 at validation and never reaches the dispatcher, so it cannot confirm containment; a valid probe could deliver a live lead. Confirm via Vercel that the redeployed Production deployment is live with the changed variable (optionally observe `[lead-delivery] result: unavailable` logs from the next organic submission).
- **N-R3 NOTE** report must be run in the Supabase SQL editor (stops on error) or with an on-error-stop client setting, otherwise the guard exception may be followed by an empty result.
- **N-R3b NOTE** trigger does not protect claimed_from_state itself against direct trusted service_role rewrites (out of scope; optional hardening: allow change only with transitions to/from inflight).

Verified correct: schedule preflight to_regprocedure syntax; app reads prior_uncertain (missing → uncertain) and treats non-FAILED finish as 504 incl. RPC failure; migration remains additive; purge/erase/prime clear claimed_from_state; grants and lock order unchanged.
