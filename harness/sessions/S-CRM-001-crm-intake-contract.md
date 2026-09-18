# S-CRM-001 session contract — website lead → FSC CRM intake (`crm_lead` effect), 2026-09-18

**Status: CLOSED — ACCEPTED AND RELEASED 2026-09-18** (PR #4, merge 3cac25e; live test verified; DECISIONS D-033). Originally approved 2026-09-18 with OD-CRM-1..6 as recorded in §13a and AM-005/D-029.

Tier 3 (customer-facing production, lead data, new outbound integration holding a secret). Full standard applies: machine gate, independent safety review, owner-applied SQL, owner merge.

## 1. Authority

- Owner decision recorded in the CRM repo: `C:/Python/fsc-crm/harness/NEEDS-BRIAN.md` #7 and `DECISIONS.md` — **DECIDED 2026-09-16: website amendment approved; Prime delivery continues.** CRM delivery is an additional AM-003 secondary effect; nothing existing is removed.
- Source spec: `C:/Python/fsc-crm/harness/WEBSITE-CRM-AMENDMENT.md` (D-025 architecture, response table, field mapping). The CRM side (`crm-intake` Edge Function, `fsc_crm_intake`) is built and live per Brian, 2026-09-18.
- Brian's instruction, 2026-09-18: the visitor-facing flow and the existing company-email/Prime path must not change.
- This session is a Rule 8 **harness amendment** to AM-003 / C-04 (new secondary effect, new outbound integration, new SQL). It becomes AM-005 on approval.

## 2. Objective

After the company email is durably accepted, every website assessment also creates exactly one lead in the FSC CRM, best-effort. A CRM outcome never changes the visitor's HTTP response, never repeats a company email, and never delays or suppresses Prime recording. Retries never create a second CRM lead.

## 3. Wire contract (fixed; from the CRM side)

- `POST ${FSC_CRM_INTAKE_URL}` (expected `https://izhandnebyywemsjisye.supabase.co/functions/v1/crm-intake`).
- Headers: `Content-Type: application/json`, `X-FSC-CRM-Timestamp: <unix seconds>`, `X-FSC-CRM-Signature: v1=<lowercase hex HMAC-SHA256(secret, `${timestamp}.${rawBody}`)>`.
- Signer: re-implemented in this repo with Web Crypto, algorithm copied from `fsc-crm/supabase/functions/_shared/hmac.mjs` `signRequest` (≥32-char secret, safe-integer timestamp, string body). Never imported from the CRM repo.
- Body: `{"requestId": <AM-003 request id>, "lead": <stored AM-003 payload>}`. `rawBody` is serialized once per attempt from the **database-returned stored payload** and is the exact string signed and sent.
- `lead` keys are this site's own `ValidatedLead` keys. `honeypot` is never present, because the stored payload is post-validation.

## 4. Findings that change the amendment's stated scope (need your approval)

The CRM-side amendment §5 describes the website SQL as "add `crm_lead` to allowed values". Reading the applied AM-003 SQL shows that is not enough:

| # | Finding in `sql/fsc-assessment-receipts.draft.sql` (applied in production) | Consequence |
|---|---|---|
| F-1 | `assessment_effects.effect` CHECK allows only `company_email`, `customer_email`, `prime_lead`. | Must widen. Additive. |
| F-2 | `error_category` CHECK allows only `provider_unavailable`, `ambiguous`, `database_unavailable`, `cutoff`, `configuration`. There is no `conflict` or `validation`. | Widen with `conflict` and `validation`, or map both to `configuration`. **Recommended: widen.** Keeps 409 and 422 distinguishable in the reconciliation report. |
| F-3 | `fsc_receipt_create_draft` seeds effect rows from a hard-coded three-effect array. `fsc_effect_claim_draft` uses `SELECT … INTO STRICT`, so a missing row raises an error. | A new `crm_lead` row has to exist before it can be claimed. **Recommended:** don't replace the create function. A new function inserts the row if it is absent, which also covers receipts created before the migration. |
| F-4 | By design (N-2), `fsc_effect_claim_draft` never returns the stored payload. Only `fsc_prime_record_draft` reads it, inside SQL. | The website cannot sign the stored snapshot unless SQL hands it back. **Recommended:** a new function, `fsc_crm_claim_draft`, returns the payload only for a successful `crm_lead` claim, to service_role only. This is a narrow, recorded exception to N-2. All other effects are unchanged. |
| F-5 | JSONB does not keep key order. | The body must be built from the DB-returned payload on **every** attempt, including the first. Building it from the in-memory lead would give different bytes. The DB copy is byte-stable across attempts. |
| F-6 | `failed` effects can be claimed again, because the claim only short-circuits `succeeded`/`skipped`. A `failed` finish that follows an `uncertain` attempt is downgraded to `uncertain`/`configuration` by the SQL backstop. | A same-ID retry of a 409/422/401 would POST once more. That is harmless because the CRM is idempotent on `request_id` and gives the same answer. The application never retries these on its own. Recorded, not changed. |
| F-7 | The operator "resume" command promised in PRODUCTION-RECEIPT-PROPOSAL.md does not exist in `scripts/`. Only the read-only `fsc-receipt-reconciliation-report.sql` exists. No scheduler or queue is allowed (C-04). | "Retry within 24 h" currently has only one trigger: a same-ID client retry, which rarely happens after a 200. See OD-CRM-2. |
| F-8 | `fsc_receipt_erase_draft` (deletion requests) only nulls website-side data. | Honoring a deletion request now also means deleting the lead in the CRM app by hand. The runbook must say so. |

## 5. SQL deliverable (DRAFT only; Brian applies it in the Supabase SQL editor on the Prime project)

New file `sql/fsc-crm-lead-effect.draft.sql`, one transaction, additive only, with preflight guards in the same style as AM-003:

1. Preflight: `fsc_private` exists, the AM-003 functions exist, the account identity guard passes, and `crm_lead` is not already present. Otherwise RAISE and change nothing.
2. Drop and re-add the `effect` CHECK with `crm_lead` added. Drop and re-add the `error_category` CHECK with `conflict` and `validation` added. Existing rows still satisfy both.
3. `public.fsc_crm_claim_draft(p_slug text, p_request uuid) RETURNS jsonb`, SECURITY INVOKER, `search_path=pg_catalog`:
   - lock the receipt row
   - `INSERT … ('crm_lead', state 'pending', idempotency_key NULL) ON CONFLICT DO NOTHING`
   - delegate to `fsc_effect_claim_draft(p_slug, p_request, 'crm_lead')`
   - when the code is `CLAIMED`, add `payload` = stored payload; otherwise return the delegate's result unchanged.
4. REVOKE from PUBLIC/anon/authenticated; GRANT EXECUTE to service_role only.
5. Finish reuses the existing `fsc_effect_finish_draft`, which already accepts any effect except `prime_lead`. **No existing function body is replaced.**

Also: a rollback draft (drop the function, restore the CHECKs only after deleting `crm_lead` rows, as a documented owner decision) and a runbook section covering order, verification queries and erasure.

## 6. Application deliverable

- **New `lib/leads/crmIntake.ts`:**
  - `signCrmRequest` (Web Crypto)
  - pure `classifyCrmResponse(status, body)` → `succeeded` | `conflict` | `validation` | `configuration` | `ambiguous`
  - `crmDependencies()`: reads and validates `FSC_CRM_INTAKE_URL` (https, `*.supabase.co`, path exactly `/functions/v1/crm-intake`) and `FSC_CRM_INTAKE_HMAC_SECRET` (≥32 chars). Returns `null` when either is missing or invalid.
  - `post(rawBody, signal)`: fetch with `redirect: 'error'`, `cache: 'no-store'` and an abort signal. Only `status` and `body.code`/`body.receiptId` are read, and nothing is logged.
- **`lib/leads/productionReceipt.ts`:**
  - optional `crm?` dependency
  - a new `resolveCrmLead()` step placed between `resolvePrimeLead()` and `claimAndSend('customer_email')`, wrapped so nothing it does can throw into the coordinator or change the returned `DeliveryResult`
  - `productionDependencies()` attaches `crm` only when `crmDependencies()` is non-null.
  - Nothing else in the file changes.

| crm-intake response | Finish state / category | Automatic retry |
|---|---|---|
| 200 `RECEIVED` / `REPLAYED` | `succeeded` (provider id = CRM receiptId, ≤200 chars) | — |
| 409 | `failed` / `conflict` | no |
| 422 | `failed` / `validation` | no |
| 401, 405, 413 | `failed` / `configuration` | no |
| 503, 429, other 5xx, timeout, network error, unparseable or unknown 2xx | `uncertain` / `ambiguous` (claimable again) | only via a same-ID retry within 24 h (see OD-CRM-2) |

**Missing or invalid CRM config:** no RPC and no fetch. Exactly one log line, `[lead-receipt] crm_configuration`. No row is created. This keeps the path fully inert until you set the variables, and it doubles as the kill switch.

Log lines use categories only: `crm_pending` and `crm_configuration`. They never include lead fields, the body, the signature, the secret, the URL or the response body.

**Not touched:** `validateLead.ts`, `app/api/leads/route.ts`, `leadDelivery.ts`, `environment.ts`, `admission.ts`, `providers/**`, `components/**` (unless OD-CRM-4 approves new wording), the applied AM-003 SQL file, and the CRM repo.

## 7. Invariants (each proven by a test)

1. **Visitor flow unchanged.** For every CRM outcome in the §6 table, plus a thrown error, a hang past budget and missing config, the route's status, body and headers are byte-identical to a no-CRM run.
2. **Existing path unchanged.** Every existing test in `tests/unit`, `tests/gate`, `tests/e2e` and `tests/release` passes **without modification**. When `crm` is absent, the coordinator's RPC call sequence is identical to today.
3. **Ordering.** `company_email` → `prime_lead` → `crm_lead` → `customer_email`. `crm_lead` is never claimed before `accepted_at`; SQL `PRIMARY_PENDING` enforces this independently.
4. **Stored snapshot.** A retry with a freshly validated lead (new `submittedAt`) sends a body byte-identical to the first attempt, built from the DB payload. Only the timestamp and signature differ.
5. **Keys.** The sent `lead` keys are a subset of the `ValidatedLead` key set. `honeypot` is never present.
6. **Signer.** Output matches a vector generated from the CRM's `signRequest` (pinned literal) and an independent `node:crypto` HMAC. Short secrets and non-integer timestamps are rejected.
7. **Budget (corrected by D-031 after safety review M-1).** The CRM step runs only when at least 6 s remain. The whole step (claim + POST + finish) is bounded by min(7 s, remaining − 3 s). The claim and finish RPCs are capped at 1.5 s each, and the POST at 4 s. `customer_email` therefore always keeps at least 3 s. (The earlier wording, "keeps at least the time it had before", was incorrect.)
8. **Secrets.** `FSC_CRM_*` names and values never appear in `.next/static`, logs or evidence. The PII/secret log scan covers the new paths.
9. **Preview isolation.** Hosted previews still refuse all delivery (`isHostedPreview`), so the CRM is never called from a preview, whatever the env scope.

## 8. Tests (test-guard owns)

- **Unit:** signer vectors; every classifier branch; config validation (bad scheme, host, path, short secret); coordinator table-driven over every outcome × first attempt/retry; ordering; budget skip; thrown `crm.post`; log-content scan.
- **Gate (real PostgreSQL 17, existing `tests/gate` harness):**
  - apply AM-003, then the new migration
  - preflight refuses a second run
  - `fsc_crm_claim_draft` behavior: `PRIMARY_PENDING` before acceptance; insert-if-absent on a pre-migration receipt; `CLAIMED` returns the payload and no other claim does; `BUSY` under a live lease; `EXPIRED` after 24 h/purge; `SUCCEEDED` short-circuit
  - finish with `conflict`/`validation` categories
  - concurrency: two claimers → one lease
  - ACL: anon/authenticated cannot execute
  - purge and erase null the `crm_lead` row like the others
  - reconciliation report lists `crm_lead` with no payload
- **No test calls the live CRM.** The network guard stays in force.

## 9. Permitted files

`sql/fsc-crm-lead-effect.draft.sql`, `sql/fsc-crm-lead-effect.rollback.draft.sql`, `sql/fsc-assessment-receipts.draft-runbook.md` (a new section only), `lib/leads/crmIntake.ts`, `lib/leads/productionReceipt.ts`, `tests/unit/crm-*.test.ts`, `tests/gate/crm-*.test.ts`, `tests/helpers/**` (additive), `harness/verification.json` (register S-CRM-001), `harness/**` docs and evidence, `DEPLOYMENT.md` (the CRM section). Also, only if OD-CRM-4 approves new wording: `components/LeadCaptureForm.tsx` (the disclosure sentence) and `tests/e2e/privacy-disclosure.spec.ts`.

## 10. Roles

Scout (ground truth, read-only) → builder (SQL draft + lib) → test-guard (tests, independent of the builder) → **independent safety reviewer** (secret handling, data exposure, SQL ACL, no weakening of AM-003/AM-004) → verifier. No agent reviews its own work.

## 11. Definition of done

1. `pwsh -NoProfile -File scripts/verify.ps1 -SessionId S-CRM-001` exits 0, and the raw log is in `harness/evidence/`.
2. The safety review is recorded, with no open blocking findings.
3. Handoff and DECISIONS (AM-005) are updated, and deviations are listed.
4. The feature branch is pushed, and a PR is opened with a summary, the evidence log path, and the preview URL. The preview shows no visible change, and delivery is refused on previews by design.
5. **Not claimed by this session:** real CRM receipt in production. That is the post-merge owner step in §12.

## 12. Owner-only steps (Brian), in order

1. Generate the HMAC secret once. Set it as the CRM Edge Function secret and as Vercel `FSC_CRM_INTAKE_HMAC_SECRET`, and set `FSC_CRM_INTAKE_URL`. The value never goes in chat, Git or evidence. I verify names only.
2. Apply `sql/fsc-crm-lead-effect.draft.sql` in the **Prime** project's SQL editor. The code tolerates any order: before the SQL is applied, the claim RPC 404s → `crm_pending`, and the primary is unaffected. SQL first is still preferred.
3. Review and merge the PR (this auto-deploys production).
4. Run a controlled live test like D-028: one synthetic TEST submission. Expect: company email received, the lead in CRM "New Lead" with source Website, and one row. An identical repeat returns 200 with no second email and no second CRM lead (`REPLAYED`). Then delete the test lead in the CRM app.

## 13. Open owner decisions (answer before implementation)

| ID | Decision | Recommendation |
|---|---|---|
| OD-CRM-1 | **Env scope.** You plan Production + Preview. The CRM amendment §5.7 and AM-003 ("no preview shares live sends") say Production only. Previews refuse delivery anyway, so a Preview-scoped secret is never used by this code. But any branch's preview build could read it, and the secret authorizes writes into the live CRM. | **Production only.** Nothing is lost functionally, and the live-CRM write credential stays out of every preview build. |
| OD-CRM-2 | **How ambiguous failures (503/429/5xx/timeout) get retried within 24 h.** No sweeper exists, and C-04 forbids queues and background work. | **(a) This session:** record `uncertain` and surface it in the existing reconciliation report. The lead is never lost, because the company email and Prime always have it; staff enter it by hand if the report shows one. **(b) Later amendment:** a Vercel Cron (free) → a new authenticated internal route that resumes pending `crm_lead` effects under 24 h old. This needs a C-02 amendment ("no new admin endpoint"), so it is not bundled here. |
| OD-CRM-3 | **Budget vs. customer confirmation.** Placing `crm_lead` before `customer_email`, as you specified, could starve the confirmation if the CRM is slow. | A 4 s CRM cap, with the CRM skipped when under 6 s remains (invariant 7). The alternative is to put `crm_lead` after `customer_email`, which changes your stated ordering. |
| OD-CRM-4 | **Privacy wording** (AM-003 requires your approval). The current approved text (D-027) says submissions are "emailed to us via Resend and stored in our private business system." | Minimal edit: "stored in our private business systems" (plural). Or keep the text as is, since the CRM is a private business system. Tell me which. Any change updates the pinned e2e test. |
| OD-CRM-5 | **Scope of the SQL (§4–§5).** It goes beyond "add to allowed values": two CHECK widenings plus one new function that returns the payload for `crm_lead` claims only (a narrow N-2 exception). | Approve as written. No existing function is replaced. |
| OD-CRM-6 | **Pre-migration receipts.** | No backfill. Receipts from before the SQL reach the CRM only on a same-ID retry (insert-if-absent). Live history is not replayed into the CRM. |

## 13a. Owner decisions — CLOSED 2026-09-18 (Brian)

| ID | Decision |
|---|---|
| OD-CRM-1 | Production only. Vercel `FSC_CRM_INTAKE_URL` / `FSC_CRM_INTAKE_HMAC_SECRET` scoped to Production. |
| OD-CRM-2 | Ambiguous outcomes recorded pending/uncertain and surfaced in the reconciliation report. No queue, no cron. |
| OD-CRM-3 | CRM request capped at 4 s; skipped (pending) when under 6 s of server budget remain. |
| OD-CRM-4 | Disclosure wording: "stored in our private business systems" (plural); pinned e2e text updated. |
| OD-CRM-5 | SQL approved as written: widen the two CHECKs, add the one create-claim-return function, replace nothing. |
| OD-CRM-6 | No backfill. |

Brian's additional conditions: existing email/Prime tests pass **unmodified**; missing CRM env vars keep the step a no-op (kill switch).

## 14. Exact interfaces (parallel builder / test-guard packet)

### 14.1 SQL — `sql/fsc-crm-lead-effect.draft.sql`
- Applied after the AM-003 draft. One transaction. Preflight RAISEs (and changes nothing) if `fsc_private.assessment_effects` or `public.fsc_effect_claim_draft(text,uuid,text)` is missing, if `fsc_private.account_for_fsc('fsc')` fails, or if `public.fsc_crm_claim_draft(text,uuid)` already exists. The existing CHECK constraints are located via `pg_constraint` by their column, not by an assumed name.
- `assessment_effects.effect` allows `company_email, customer_email, prime_lead, crm_lead`. `error_category` additionally allows `conflict, validation`.
- `public.fsc_crm_claim_draft(p_slug text, p_request uuid) RETURNS jsonb`, SECURITY INVOKER, `SET search_path=pg_catalog`:
  1. `account := fsc_private.account_for_fsc(p_slug)`. Lock the receipt row `FOR UPDATE`. If absent, `{"code":"NOT_FOUND"}`.
  2. If `purged_at IS NOT NULL` or `clock_timestamp() >= expires_at` → `{"code":"EXPIRED"}` (no insert).
  3. If `accepted_at IS NULL` → `{"code":"PRIMARY_PENDING"}` (no insert).
  4. `INSERT INTO fsc_private.assessment_effects(account_id,request_id,effect,idempotency_key,state) VALUES(account,p_request,'crm_lead',NULL,'pending') ON CONFLICT DO NOTHING`.
  5. `result := public.fsc_effect_claim_draft(p_slug,p_request,'crm_lead')`. If `result->>'code'='CLAIMED'`, return `result || jsonb_build_object('payload', r.payload)`; else return `result` unchanged.
- EXECUTE revoked from PUBLIC/anon/authenticated; granted to service_role.
- Finish uses the existing `public.fsc_effect_finish_draft(p_slug,p_request,'crm_lead',token,state,provider_id,category)`.
- `sql/fsc-crm-lead-effect.rollback.draft.sql`: drops the function. Restoring the CHECKs requires the owner to first dispose of `crm_lead` rows and `conflict`/`validation` categories; the rollback RAISEs if any exist rather than deleting them.
- `sql/fsc-receipt-reconciliation-report.sql` (read-only, D-030) additionally lists accepted receipts within their 7-day payload window that have **no** `crm_lead` row (effect shown as `crm_lead`, state `missing`). This covers the kill switch, the budget skip and RPC failures before the row existed. Pre-migration receipts appear for at most 7 days (OD-CRM-6, documented).

### 14.2 `lib/leads/crmIntake.ts`
```ts
export const CRM_MIN_SECRET_LENGTH = 32;
export const CRM_TIMEOUT_CAP_MS = 4000;
export const CRM_MIN_REMAINING_MS = 6000;
export async function signCrmRequest(secret: string, timestamp: number, body: string): Promise<string>;
//   'v1=' + 64 lowercase hex; throws Error('MISSING_SECRET'|'BAD_TIMESTAMP'|'BAD_BODY') exactly like hmac.mjs signRequest
export function buildCrmBody(requestId: string, payload: Record<string, unknown>): string; // JSON.stringify({ requestId, lead: payload })
export type CrmOutcome =
  | { kind: 'succeeded'; receiptId: string | null }
  | { kind: 'conflict' } | { kind: 'validation' } | { kind: 'configuration' } | { kind: 'ambiguous' };
export function classifyCrmResponse(status: number, body: unknown): CrmOutcome;
//   200 + body.code 'RECEIVED'|'REPLAYED' -> succeeded (receiptId = body.receiptId if a string of <=200 chars, else null);
//   any other 2xx -> ambiguous; 409 conflict; 422 validation; 401/405/413 configuration; everything else ambiguous.
export type CrmDependencies = { post(rawBody: string, signal: AbortSignal): Promise<CrmOutcome> };
export function crmDependencies(env?: NodeJS.ProcessEnv, fetchImpl?: typeof fetch, nowSeconds?: () => number): CrmDependencies | null;
//   null unless FSC_CRM_INTAKE_URL (trimmed) parses as https:, hostname ends with '.supabase.co', has no username/password/query/hash,
//   pathname exactly '/functions/v1/crm-intake', and FSC_CRM_INTAKE_HMAC_SECRET (trimmed) has length >= 32.
//   post(): fresh unix-seconds timestamp per call; signs rawBody unchanged;
//   fetchImpl(url, { method:'POST', headers:{'Content-Type':'application/json','X-FSC-CRM-Timestamp':String(ts),'X-FSC-CRM-Signature':sig},
//   body: rawBody, signal, redirect:'error', cache:'no-store' }); network error/abort -> ambiguous;
//   unparseable JSON -> classifyCrmResponse(status, null). Never logs anything.
```

### 14.3 `lib/leads/productionReceipt.ts` (as amended by D-031 and D-032)
- `ReceiptDependencies` gains `crm?: CrmDependencies`. `productionDependencies()` attaches it only when `crmDependencies()` returns non-null, inside try/catch. The existing required-config checks, the shared `rpc()`/`signal()`/`finish()`, and the company_email, prime and customer_email logic are unchanged.
- `await resolveCrmLead()` runs between `resolvePrimeLead()` and the customer_email step. It is wrapped so it never throws, and the returned `DeliveryResult` is unchanged.
  - No `deps.crm` → log `crm_configuration`, zero RPC calls (the kill switch).
  - R = remaining budget. If R < 6000 → log `crm_pending`, zero RPC calls.
  - Window W = min(7000, R − 3000), measured on the monotonic elapsed clock. The whole step stays inside W, so customer_email keeps at least 3000 ms.
  - Claim: `deps.rpc('fsc_crm_claim_draft', {p_slug, p_request}, timeout min(1500, left))`, called directly.
    - `SUCCEEDED` → return quietly.
    - Any other code, a malformed claim, a non-object payload, or a throw → `crm_pending`.
  - POST budget = min(4000, left − 1000, lease − 1000, cutoff − 1000).
    - Under 1000 → finish `uncertain`/`cutoff` (bounded), then `crm_pending`.
    - Otherwise POST `buildCrmBody(requestId, claim.payload)`.
  - Finish: `deps.rpc('fsc_effect_finish_draft', …, timeout min(1500, max(1, left)))`.
    - succeeded → (`succeeded`, receiptId).
    - conflict/validation/configuration → (`failed`, category).
    - ambiguous → (`uncertain`, `ambiguous`).
  - Logging follows the RECORDED result:
    - `crm_failed` only when the finish returns `FAILED`.
    - Silence when it returns `SUCCEEDED`.
    - Otherwise `crm_pending`.
