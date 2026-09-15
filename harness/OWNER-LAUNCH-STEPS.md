# Owner launch steps — Florida Security Concepts website release

Prepared 2026-09-15 by the Claude Code orchestrator for Brian. Everything below is an owner-only action (production configuration, production SQL, merge/publication, live test communication). Agents have not performed any of these. Do them in order; each step says how to confirm it worked.

Release candidate: branch `codex/website-spec` (PR to `main`). Machine evidence: S-005 gate `harness/evidence/S-005-verify-20260914-204740-745-c0c0c1cc3e164327a5f1e7e88e288de8.log`; S-006 gate `harness/evidence/S-006-verify-20260914-223338-346-eaf7150d9c6149eb8ae8c99a788ebff4.log`; requirements map `harness/evidence/S-006-traceability.md`. Reviews: `harness/evidence/S-005-safety-review.md`, `harness/evidence/S-006-privacy-review.md`.

## 0. Decide before merge (cannot be delegated)

1. **OD-07 — form privacy wording.** The assessment form now shows this text (components/LeadCaptureForm.tsx). Approve it as written, or tell me the changes:

   > We use your contact and property details, along with the page and campaign information that brought you here, to respond to your request, with email delivery through Resend and inquiry records in our private business system. Please do not include gate codes, passwords or other sensitive security information.
   >
   > To prevent duplicate messages and resolve delivery problems, we keep an additional private copy of your request for seven days before scheduled cleanup, and minimal request identifiers and status records afterward. To limit repeated submissions, we temporarily use a protected identifier derived from your network address; this check does not store the address itself. For questions about your information, email info@floridasecurityconcepts.com.

   Reviewers noted, for your decision: it does not mention analytics (optional added sentence: "We use Plausible, a cookie-free analytics service, to count page visits and form steps using general categories only — never your contact details or message."); the minimal identifiers/status records are kept indefinitely; page/campaign details are also used for lead-source measurement in Prime; the seven-day statement is only true while the cleanup job (step 2) is healthy.

2. **Customer confirmation email.** Existing behavior is preserved: it is sent unless `LEAD_CONFIRMATION_ENABLED` is false. For abuse safety it no longer repeats the visitor's name, city, company or message (D-024). No action needed unless you want it off.

## 1. Vercel configuration (before merge)

Project `florida-security-concepts` → Settings → Environment Variables. Never paste secret values into chat.

1. **Create `FSC_ADMISSION_HMAC_KEY`** — Production only (not Preview, not Development), mark Sensitive. Generate 32 random bytes as 64 hex characters in Windows PowerShell:
   ```powershell
   $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); ($b | ForEach-Object { $_.ToString('x2') }) -join ''
   ```
   Paste the output directly into Vercel. Do not reuse the Resend or Supabase keys. Without it the site stays up but refuses every new form submission (503).
2. **Set `LEAD_DELIVERY_MODE` = `resend+supabase`** in Production.
3. **Confirm** Production has `PRIME_ACCOUNT_SLUG` = `fsc`, `PRIME_SUPABASE_URL` (https), `PRIME_SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and `LEAD_NOTIFICATION_FROM` = your verified Resend sender. Company notifications always go to info@floridasecurityconcepts.com (fixed in code and SQL); `LEAD_NOTIFICATION_TO` is no longer used.
4. **Recommended defense in depth:** remove Preview scope from `RESEND_API_KEY`, `PRIME_SUPABASE_SERVICE_ROLE_KEY`, `PRIME_SUPABASE_URL`, `LEAD_NOTIFICATION_FROM`, `LEAD_DELIVERY_MODE` and `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL` (keep Production). The code already refuses delivery, analytics and indexing on previews; this removes the credentials too.

## 2. Supabase SQL (before merge — the new code must not run against a missing schema)

Prime project `olpyqfuphiwdongzmazi`, SQL editor. Run each file whole, in this order. Before pasting, confirm the file hash matches (PowerShell: `Get-FileHash <file> -Algorithm SHA256`).

| Order | File | SHA-256 |
|---|---|---|
| 1 | `sql/fsc-assessment-receipts.draft.sql` | db36d14afef74eaf7cb0bcc4ebdc08ae02b2f9f13ab3da098f931354d2e6a228 |
| 2 | `sql/fsc-cleanup-schedule.draft.sql` | a6ca1f60e9bbc9a2f74f335b7ed1c9177953df2b2eb648adb884239f6d552bd4 |
| 3 (after ~2 minutes) | `sql/fsc-cleanup-health.sql` | 73c9be41655d679dbf7686af4c1bb158ac52505f6482d786305417b8f54d5e17 |

- File 1 is additive (new private schema only) and refuses to run if anything is unexpected (missing roles/privileges, FSC account/domain mismatch, schema already present). It does not change existing leads or accounts. Existing production traffic is unaffected until the new code is deployed.
- File 2 enables pg_cron only if absent and creates one job, `fsc-assessment-private-cleanup`, every minute. It refuses to overwrite a different job with that name and never touches other jobs.
- File 3 is read-only. Expect `healthy = true`. Run it as the same role that ran file 2 (pg_cron only shows a job to its owner).
- Full detail, containment and rollback: `sql/fsc-assessment-receipts.draft-runbook.md`.

## 3. Plausible (any time before relying on reports)

Create goals for the SPEC events: `assessment_cta_click`, `assessment_form_start`, `assessment_submit_attempt`, `assessment_validation_error`, `assessment_delivery_error`, `Lead Submitted`, `emergency_call_click`, `maintenance_interest_click`. Note: `Lead Submitted` properties changed from `service`/`urgency` to `service_category`/`urgency_category`, so older breakdowns won't line up; `assessment_submit_attempt` counts retries.

## 4. Merge (publication)

Review the PR, then merge to `main`. Vercel deploys Production automatically. Keep the previous Production deployment available for rollback.

## 5. Post-deploy verification

Agents may do the read-only part once you say so: homepage/contact/robots/sitemap load, canonical and indexable on www, analytics script present, no console errors.

A controlled live form test sends real email, so it needs your explicit go-ahead: submit one clearly labeled test request using your own email address. Confirm exactly one company email arrives at info@, one Prime lead appears, the customer confirmation arrives (if enabled), a second click of the same retry does not send another email, and `sql/fsc-receipt-reconciliation-report.sql` (SHA-256 a83df65be5d51c3b14614c9e84d5a95a1136b4244431a21db3106a74ce891eb1, SQL editor) shows nothing unresolved. 

**Analytics payload check (required before relying on Plausible reports; read-only, no form submission).** Plausible can change its hosted script at any time. In Chrome, open DevTools → Network, filter `api/event`, then visit `https://www.floridasecurityconcepts.com/contact?utm_campaign=spring&email=test@example.com` by clicking a link from another site (e.g., a search result). Confirm each `/api/event` request body has `u` = `https://www.floridasecurityconcepts.com/contact?utm_campaign=spring` (no email, no other parameters), `r` is only an origin (e.g. `https://www.google.com`) or absent, and `p` contains only category values. An agent can also re-download the public script and compare it with the tested copy (SHA-256 699a37594f53cf5fd1026e3e442d29119c6901cfd3a696dd5cec20d7cc52a8a4); a changed hash means re-running the payload tests.

## 6. Containment and rollback

- Stop new submissions without touching data: change `LEAD_DELIVERY_MODE` in Production to empty, then **redeploy** (Vercel only applies variable changes to new deployments). Confirm in Vercel that the redeployed Production deployment is live.
- Application rollback: Vercel "Instant Rollback" to the previous Production deployment. The old app does not use the new schema and lacks the duplicate/spam safeguards, and it restores the previous analytics setup, which sends full page URLs and referrers to Plausible.
- Never drop the `fsc_private` schema or disable pg_cron as rollback. Pausing the cleanup job makes the published seven-day statement untrue until re-enabled.

## 7. Housekeeping (optional)

- Local synthetic PostgreSQL test data under `.fsc-test/postgres` is several GB; agents do not delete folders recursively. Delete it when convenient.
- Your global Claude Code Stop hook `~/.claude/hooks/auto-verify.js` runs `scripts/verify.ps1` under Windows PowerShell 5.1 without `-SessionId`, so it always fails and drops `adhoc-verify-*.log` files into `harness/evidence`. The real gate needs PowerShell 7 and a session ID (a portable copy is under `.fsc-test/pwsh`).
