# S-CRM-001 — Independent safety review, round 1

Author: safety-reviewer (independent; did not write the code). The reviewer has no file-write tool, so the orchestrator saved this verbatim from its hand-back on 2026-09-18. Scope: branch docs/s-crm-001-contract working tree, covering lib/leads/crmIntake.ts, lib/leads/productionReceipt.ts, sql/fsc-crm-lead-effect(.rollback).draft.sql, sql/fsc-crm-lead-reconciliation-report.sql, the runbook, and components/LeadCaptureForm.tsx.

**Verdict: BLOCKED** until B-1 is fixed. M-1 must be fixed, or explicitly re-accepted by Brian with corrected invariant wording.

## BLOCKER

**B-1: The rollback stops working after the first live CRM lead, and the runbook's way to unblock it never works.**
- Where: `sql/fsc-crm-lead-effect.rollback.draft.sql:16-27`, `sql/fsc-assessment-receipts.draft-runbook.md:93`.
- What goes wrong:
  - Once the SQL and env vars are live, every accepted receipt gets a crm_lead row.
  - Nothing ever deletes effect rows. purge and erase only null columns (AM-003 lines 334 and 359), and service_role has no DELETE on assessment_effects (AM-003 lines 104-110).
  - The rollback guard therefore RAISEs forever. It aborts the whole transaction, including the harmless DROP FUNCTION.
  - The runbook's "dispose via purge/erase once aged out" never happens.
  - After the first live lead, the documented undo path is dead. The only way through is an improvised DELETE on production ledger rows.
- Fix:
  - Split the rollback.
  - Part A always works: REVOKE and DROP FUNCTION IF EXISTS. The widened CHECKs stay; they are harmless supersets.
  - Part B is optional: narrowing the CHECKs requires an explicitly owner-authorized, clearly destructive DELETE, and is not recommended.
  - Correct the runbook.
  - Add a gate test showing Part A succeeds while crm_lead rows exist.

## MAJOR

**M-1: The CRM step can use up the customer-confirmation budget beyond what D-029(3) allowed. Invariant 7 is false as written.**
- Where: `lib/leads/productionReceipt.ts:91-92` (the shared signal(), min(8 s, remaining)), `:222-232`, `:272-283`; contract §7 item 7.
- The 4 s cap applies only to the POST. The claim and finish RPCs use the shared 8 s signal.
- **Scenario (a), RPC stall:**
  - 7 s remain at entry.
  - The claim RPC stalls: on the receipt-row lock held by a concurrent same-ID retry, behind the migration's ACCESS EXCLUSIVE lock (up to 5 s), or through PostgREST slowness.
  - The whole budget is used. The customer_email claim throws DEADLINE and the confirmation is never sent. Before this change it had 7 s.
- **Scenario (b), no stall:**
  - Between 6.0 and about 7.2 s remain at entry, and the POST times out at 4 s.
  - After finish, about 1.9 s remain. The customer_email claim succeeds.
  - serverBudget is then under 1000 ms, so the send is skipped and the lease is left inflight. The later reclaim is treated as uncertain, and no email is sent without a same-ID retry.
- Fix:
  - Use a CRM-specific RPC cap (e.g. 1500 ms) for claim and finish.
  - Set a single CRM deadline so the whole step is bounded.
  - Raise the entry threshold to that bound plus the minimum budget customer_email needs, or correct invariant 7 and have Brian re-accept OD-CRM-3.

## MINOR

**m-1: Constraint discovery is not strict and does not check the existing definition** (`sql/fsc-crm-lead-effect.draft.sql:59-65, 75-81`; the rollback has the same pattern).
- SELECT INTO without STRICT takes the first match and never compares pg_get_constraintdef.
- If production has drifted from the AM-003 file, the migration may drop the wrong constraint. Every crm_lead INSERT then fails with 23514 and silently ends up as crm_pending. Or it may drop a hand-added value.
- Fix: assert exactly one match and that its definition equals the expected AM-003 text. RAISE otherwise.

**m-2: The URL allowlist accepts any `*.supabase.co` project and any port** (`lib/leads/crmIntake.ts:100-110`).
- Node tests: userinfo, trailing dot, encoded path, `%2e` host, IP address, trailing slash and non-empty query/hash are rejected. Uppercase and `/./` are harmlessly normalized.
- Accepted: `:8443`, any other project ref, and `https://.supabase.co/...`.
- A wrong-project value would send lead PII plus a valid signature elsewhere.
- Fix: pin the hostname to the expected project ref and require `url.port === ''`. This is MINOR only because the URL is owner-set config.

**m-3: The website trims the secret; the CRM does not** (`crmIntake.ts:91` vs `fsc-crm/supabase/functions/crm-intake/index.ts:92`).
- Surrounding whitespace on either side causes 401 → failed/configuration on the first attempt, with no automatic retry.
- A value of 32 or more characters that falls under 32 after trimming silently engages the kill switch.
- Fix: don't trim. Treat leading or trailing whitespace as invalid config (null, crm_configuration), or document "no surrounding whitespace".

**m-4: The deletion procedure is not updated where the deletion obligation is defined.**
- `harness/PRODUCTION-RECEIPT-PROPOSAL.md:60` defines what deletion requests must clear and does not mention the CRM.
- Fix: add the CRM there, and in DEPLOYMENT.md if applicable.

**m-5: Untracked, non-ignored directories risk being committed.**
- `tmp/` (8.4 MB, copies of the CRM repo including node_modules/dist), `%SystemDrive%/`, and `harness/fsc-crm/`.
- Fix: stage explicit paths only.

## NOTES (verified or advisory)

- **N-1, secrets:**
  - A scratch-copy `npx next build` with canary env values: `.next/static` contains none of FSC_CRM, crm-intake, X-FSC-CRM, fsc_crm_claim_draft, importKey or the canaries.
  - The canaries appear nowhere in `.next`. The env names appear only in `server/chunks/735.js`.
  - Import chain: route.ts → leadDelivery.ts (dynamic) → productionReceipt.ts → crmIntake.ts. No client component imports it. Not NEXT_PUBLIC.
  - Suggestion: `import 'server-only'`.
- **N-2, signer parity:** signCrmRequest and the CRM's signRequest were run on 9 vectors (Unicode, lone surrogates, whitespace-padded secret, short/non-string secret, 1.5/0/unsafe timestamps, null body). Outputs, throw codes, validation order and hex case were identical.
- **N-3, snapshot:**
  - The body comes from the DB payload, and the round trip is deterministic.
  - Keys are a subset of the CRM's WEBSITE_FIELD_LIMITS. honeypot is excluded (validateLead.ts:46), and lead.requestId equals the envelope requestId (route.ts:33). No 422 risk.
- **N-4, SQL:**
  - SECURITY INVOKER with search_path=pg_catalog, and every name is fully qualified.
  - REVOKE PUBLIC/anon/authenticated runs in the same transaction and covers Supabase default grants. anon lacks USAGE on fsc_private.
  - The insert-if-absent comes only after the expired/purged/accepted checks.
  - The immutable_effect trigger and the D-026 backstop are unaffected.
  - The payload is returned only on CLAIMED, from the locked row.
  - Lock order (receipt → effect) matches AM-003, so there is no new deadlock cycle.
  - The ADD CONSTRAINT scan is trivial, and lock_timeout is 5 s.
  - Operational advice: apply at low traffic. Effect RPCs queue behind ACCESS EXCLUSIVE for up to 5 s, and the preflight holds FOR SHARE on the fsc account row until COMMIT.
- **N-5, reconciliation:** the existing report is byte-identical to main. The new report is read-only (the DO guard only RAISEs; it uses to_regprocedure and SELECTs) and shows no payload, contact or provider-ID columns.
- **N-6, privacy:** "private business systems" matches D-029(4). CRM retention beyond the 7-day purge is equivalent to the existing Prime public.leads retention.
- **N-7, logs:** only the fixed strings crm_configuration, crm_pending and crm_failed. crmIntake.ts never logs, and RPC errors are swallowed.
- **N-8, runbook:**
  - Line 67 lists env first, while line 71 says SQL-then-env is preferred. These contradict each other.
  - Line 85's routine_privileges query can miss grants. Use has_function_privilege('anon'|'authenticated', 'public.fsc_crm_claim_draft(text,uuid)', 'EXECUTE').
- **N-9:** crmDependencies() runs inside the try that maps a throw to a CONFIGURATION 503 for the primary (leadDelivery.ts:34). It cannot throw today; wrap it anyway.
- **N-10:** the visitor status and body are unaffected by every CRM path. Latency grows by up to about 4 s plus RPC time within the 15 s budget (OD-CRM-3). AM-003/AM-004 controls are not weakened beyond the approved N-2 exception.

---

# Round 2 — safety-reviewer, 2026-09-18 (saved verbatim-in-substance by orchestrator)

**Verdict: APPROVED WITH NOTES.** All round-1 findings are closed. The reviewer checked each fix against the code and SQL, not against the builder's claims.

- **B-1 closed.**
  - Part A (`rollback.draft.sql`) guards only on the function existing, then REVOKEs and runs `DROP FUNCTION IF EXISTS`.
  - Part B (`rollback-narrow.destructive.draft.sql`) contains no DELETE, refuses to run until Part A is done, keeps the row guard, and uses the strict constraint check.
  - Run on isolated PG 17.11: the migration refused a second application; Part B refused before Part A; Part A succeeded twice; Part B then restored the exact AM-003 definitions.
  - `tests/gate/crm-lead-effect.test.ts:530` covers Part A with live crm_lead rows, including an inflight one.
- **M-1 closed.**
  - The step runs only when R ≥ 6000. Its window is W = min(7000, R − 3000), measured on the monotonic clock.
  - Timeouts:
    - claim: min(1500, left)
    - POST: min(4000, left − 1000, lease, cutoff)
    - finish: min(1500, max(1, left))
  - The step cannot exceed W, so customer_email keeps at least 3000 ms, less timer slop. No residual path goes below that.
  - `tests/unit/crm-coordinator.test.ts:354-386` proves the arithmetic for R from 6000 to 15000.
- **m-1 closed.** On PG 17.11 the AM-003 constraint definitions match the expected strings byte-for-byte. The names `assessment_effects_effect_check` and `assessment_effects_error_category_check` are preserved.
- **m-2, m-3, m-4, N-8 and N-9 closed.** ACL: anon, authenticated and PUBLIC are false; service_role is true.
- **m-5** is a process item: the verifier confirms the PR file list.
- **N-1** was declined in D-031; the reviewer finds that acceptable.

New notes (none blocking):
- **R2-N1:** the `budget < 1000` branch leaves a claimed lease inflight. This is harmless: the CRM is idempotent, and the lease is reclaimed as uncertain. Optional: finish it as uncertain/cutoff when time allows.
- **R2-N2:** the constraint strings were verified on PG 17.11 only. Brian should run the `pg_get_constraintdef` query BEFORE applying, not only after.
- **R2-N3:** contract §14.3 is stale against the D-031 budget design.
- **R2-N4:** the runbook wrongly says the existing report lists company_email/customer_email/prime_lead only. It lists every non-succeeded effect.
- **R2-N5:** Part A alone leaves the app calling a dropped function (404 → crm_pending, harmless). Pair it with the env kill switch and a redeploy.

Owner-side preconditions:
- Brian re-accepts OD-CRM-3 on the corrected guarantee (at least 3 s).
- The PR file list is checked for m-5.

---

# Round 3 — safety-reviewer, scoped to the D-032 diff, 2026-09-18

**Verdict: APPROVED WITH NOTES.** No BLOCKER, MAJOR or MINOR findings.

- **(a) The no-op widen branch can't be abused.**
  - Handling is exact per column: count = 1, then a byte-exact match on either the AM-003 text or the widened text, otherwise RAISE.
  - Verified on PG 17.11: apply → Part A → re-apply succeeds.
  - Each of these RAISEs: NOT VALID, a reordered list, a superset, a second CHECK.
  - A mixed state (reachable only by a manual edit) converges correctly.
- **(b) The cutoff finish stays inside W.** customer_email keeps at least 3000 ms, less a few ms (the 1 ms floor).
- **(c) The log mapping leaks nothing.** Only fixed strings are logged, and crm_failed appears only on a recorded FAILED.
- **(d) The runbook is accurate and consistent.** Contract §14.3 matches the code.

Notes:
- **R3-N1:** the step-0 query filtered by constraint name. Orchestrator fixed it: it now filters by column like the migration and expects exactly two rows.
- **R3-N2:** mixed-state acceptance is benign.
- **R3-N3:** the ~1 ms overrun from the 1 ms floor is immaterial.

Standing preconditions:
- Brian re-accepts OD-CRM-3 on the at-least-3 s guarantee.
- The PR is staged by explicit paths only.
