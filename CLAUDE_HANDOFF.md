# Claude Code handoff — Florida Security Concepts

## User instruction

Brian asked to move this project to Claude Code to finish the website updates. Continue in the existing checkout at C:\Python\florida-security-concepts. Do not rebuild from scratch, clone over this folder, discard uncommitted changes or wait for Codex agents. This document replaces dependence on the Codex conversation and agent mailboxes. Inspect the actual files first; summaries are navigation aids, not proof.

## Outcome and accepted direction

Finish the accepted website updates, verify the production inquiry flow, and prepare/publish through the owner-controlled release path. The homepage and sitewide navy/light theme have been visually accepted. The audience is HOAs, property managers and CAMs; the business goal is preventive-maintenance contracts. Orlando is primary; Tampa is also served. Explain maintenance, repairs, emergency service, retrofits and new installation clearly. Keep free property assessment and owner-approved24/7 wording. Assessments are requests, not booked appointments or technician dispatches. Communication and technical competence should be clear without fabricated testimonials, guarantees or SOPs. Sentinel monitoring is R&D, not a live service.

All website form submissions must use Resend to info@floridasecurityconcepts.com. Preserve the existing verified sender and customer-confirmation setting; Prime lead recording remains a best-effort secondary effect. Company notification acceptance is the user-facing success criterion.

The accepted launch scope includes38existing canonical pages. Broader S-003/S-004 content expansion was deferred for prompt publication; do not silently add a maintenance page or redesign accepted pages again.

## Read first, in this order

1. harness/SPEC.md
2. harness/HARNESS.md, harness/SESSIONS.md, harness/AGENTS.md
3. harness/DECISIONS.md (latest entries supersede historical pending statements)
4. harness/LAUNCH-HANDOFF.md, especially the credit-interruption section
5. harness/PRODUCTION-RECEIPT-PROPOSAL.md
6. harness/LAUNCH-OPERATIONS-ADDENDUM.md and harness/ABUSE-AND-PRIVACY-PROPOSAL.md
7. harness/ENVIRONMENT.md, harness/verification.json, scripts/verify.ps1
8. sql/fsc-assessment-receipts.draft.sql and its draft-runbook.md
9. harness/evidence/S005-sql-draft-review.md and S005-caller-inventory.md

Some older documents still describe proposals as pending or older framework versions. Resolve by dated decisions and actual source; do not erase historical evidence or claim a pending requirement passed.

## Owner approvals and boundaries

Brian repeatedly approved continuing and publication, and explicitly approved AM-003 after its retention plan was presented: an additional private inquiry/envelope copy for seven days, then minimal private retry IDs/time/status indefinitely. Do not ask for design/publication/AM-003 approval again.

D-021 records Codex's interpretation of Brian's later repeated approval after a no-raw-IP/no-paid-service spam-protection update. The detailed AM-004 document was NOT separately shown to or read-confirmed by Brian. Codex then stated the implementation choice in commentary:20newrequests/network/10minutes, retries exempt, short-lived protected identifier, no raw-IP storage or new paidservice. Preserve this distinction; do not represent every technical or legal sentence as explicitly reviewed by Brian. Work within his approved direction and escalate only actual material owner decisions. The proposal uses a dedicated Production HMAC key and transient private counter; no implementation is yet certified.

Standing project rules:
- Tier3 harness-first work. Inspection before writes; approved contract before material implementation; record reversible clarifications and formal amendments.
- Use separate implementation, test-guard and independent safety/review roles; no self-review acceptance. Follow harness/AGENTS.md. Claude Code should create its own specialists rather than trying to resume Codex agent IDs.
- Only machine-run scripts/verify.ps1 -SessionId <ID> exit0 with raw harness/evidence log proves session acceptance. Retain failures; no skipped/empty suites or weakened tests. Human-visible work also needs screenshot/preview evidence.
- PowerShell only. Feature branch commits only. Never commit/push main/master, force-push or merge PRs. Brian alone merges main. Never bypass git/danger hooks or use --dangerously-skip-permissions.
- Brian alone applies production SQL manually. Draft and test SQL locally; do not execute production SQL via CLI, connector or dashboard. Brian also handles production key entry. Do not reveal credentials or read secret files into logs/chat.
- No new costs, paid accounts, credential rotation, destructive operations, security weakening or live customer communications without applicable explicit authorization. Existing publication approval persists, but does not remove Brian-only SQL/main-merge roles.
- Complete authorized fixes/tests/preparation autonomously. Ask Brian only for concrete owner-only actions after the relevant artifact is reviewable.

## Actual saved state at transfer

Branch codex/website-spec. Latest verified committed checkpoint7d8032d. Earlier main/live source2182d1e3fc101fc81ca220ed5c2c081d5af57e1b. Branch also contains prior SEO work including3d6c3fd/f25a5b3; preserve and describe it in the PR. Read-only GitHub PR listing at transfer returned no open PRs.

UNCOMMITTED, INCOMPLETE, NOT VERIFIED: app/api/leads/route.ts; app/layout.tsx; app/robots.ts; lib/leads/leadDelivery.ts; lib/leads/providers/resend.ts; new lib/leads/environment.ts and productionReceipt.ts; package.json/package-lock.json; tests/helpers; harness/docs. Changes stopped when both implementation and test agents reported workspace credits exhausted. Inspect all of these; do not assume package installation, runtime extraction or tests completed.

UNRELATED UNTRACKED WORK: %SystemDrive%/, tmp/, harness/fsc-crm/. Preserve; do not stage, delete or modify as part of this website release. Do not blanket git add.

The compiled preview previously ran at http://127.0.0.1:3100, launched by scripts/local-server.mjs --compiled from the earlier verified code. The Codex session ID82740 is not a Claude process-control handle. Inspect listener/process ownership and command line before stopping it. Never kill all Node processes. The running compiled preview may not reflect new uncommitted source.

No new production deployment, production SQL, live email or hosting configuration mutation was performed during this release preparation.

## Verified baseline — not proof of new changes

- Next15.5.25, React19.3.0, Resend6.12.3, PostCSS8.5.28; Node24.x local/hosting. Zero known production npm audit findings at the saved security check.
- S-SEC-001 verified190tests:96unit +11gate +83browser, six stages exit0. Raw log: harness/evidence/S-SEC-001-verify-20260914-144817-278-e958975e2c334d90866006dc4921135a.log. Independent review S-SEC-001-review.md.
- Sitewide theme S-UI-001 verified,38routes with representative390/1440screenshots.
- Representative Chromium/Firefox/WebKit smoke9checks; not full cross-browser forms, physical-device or screen-reader proof.
- SQL draft30actual embedded PGlite checks, single connection only. Hash at last review f46a88bf623e3b8ba6ac9b93e78a45937f08d84fd686eaff70e3548441279ba1. Not actual multiprocess contention or hosted ACL proof.

## Next implementation and verification work

1. Finish/review S-005 coordinator and tests. Persist immutable rendered envelopes and timestamp before sending; stable per-effect Resend keys; atomic DB leases; primary acceptance persisted before200. Same-ID retries return original receipt and do not repeat effects. Respect24hreceipt expiry and conservative23h55mprovider cutoff,30slease,8snetwork/15sserver/20sclient budgets. No late automatic resend. Secondary customer/Prime failure must not turn known primary success into failure. Preserve tenant/domain checks and safe logs.
2. Finish actual PostgreSQL persistence tests: concurrency across processes, restart/crash, ambiguous provider outcome, stale leases, cutoff, immutable payload, tenant/RLS/ACL and rollback. Mock Resend transport, not database atomicity. Official EDB PostgreSQL17.11 portable ZIP was downloaded under ignored .fsc-test/pgsql; extraction state unverified. Recorded local download hash4b8db0930c38f6ef845db919551dedda3b6b845aeb0927b3d79a6e8e9e4537cf, vendor fileid1260491; inspect existing helpers/source evidence. Loopback-only synthetic datadir and owned processes; no system service. Runtime dependencies are test-only. Preserve the190existing test floor and add meaningful tests.
3. Finish source admission control under the recorded AM-004 authority; no raw IP in database/logs/analytics. Dedicated secret, atomic quota+receipt insertion and retry exemption, bounded transient counter/cleanup. Verify trusted actual Vercel ingress, not arbitrary forwarded headers. Do not reuse provider service keys as HMAC keys.
4. Draft owner-run pg_cron activation/job and metadata-only health checks. Prime pg_cron1.6.4 is available but not installed. One uniquely named FSCminute purgejob, refuse conflicting existing command, no unrelated job/data changes. Seven-day retention means eligibility and nextscheduledtick; monitor failed runs/backlog. Operator recovery should default dry-run and never resume expired uncertain email. Builder suggested pinned dev-only tsx for using the same coordinator in an operator tool; no final implementation was completed.
5. Independently review SQL/app/tests, repair, run S-005 gate. Do not use prior security gate as acceptance of this work.
6. S-006: finish private analytics with the existing service only, all8SPECevents, sanitized URL/referrer/campaign data and categorical allowlist; no contact fields/IDs/free text. Preserve Lead Submitted once per logical success. Preview/local analytics off is insufficient proof of safe production payloads. Add real nonempty test:release configuration and evidence requirements (currently missing). Run cross-browser form/error/retry checks, accessibility and repeatable Lighthouse targets; be candid about physical-device/field data not available. Independent review and S-006 gate required. Coordinate build/server operations to avoid output races.
7. Refresh truthful launch/PR documentation against completed source. Complete safe preview boundaries before feature push. Open PR with exact raw exit-zero log paths and preview, explaining accepted theme, earlier SEO work, delivery safeguard changes and limitations. Brian executes reviewed SQL/configuration and merges after prerequisites. Do not publish against absent schema.
8. Hosted schema/scheduler/controlled inbox verification is distinct from local tests. Obtain any still-required concrete live-test authorization; do not send to real customers as a test. Observe production deployment/read-only smoke after owner merge, and report actual result rather than claiming success from attempted deployment.

## Hosting and provider coordinates (no secrets)

Vercel project prj_cpbGOvkXONhMVXGwzkkA4iUVtuj4; dashboard https://vercel.com/bsidenbergs-projects/florida-security-concepts. Production https://www.floridasecurityconcepts.com/. GitHub https://github.com/bsidenberg/florida-security-concepts.git. main triggers Production and automatic custom-domain assignment. No Vercel deployment checks configured. Authenticated Chrome dashboard worked in Codex; Vercel connector returned no teams, which was not proof access was absent. Claude must establish its own authorized tool/browser access.

Existing Prime project olpyqfuphiwdongzmazi, PostgreSQL17.6. Existing public.accounts/leads metadata in harness/evidence/prime-schema-metadata-20260914.json; no customer records were read. New receipt tables belong in fsc_private, server-only RPCs with tenant/domain validation and revoked public access. SQL RPCs currently have _draft suffix; change consistently only if needed and retest exact SQL.

Nine existing Vercel variables were observed in both Production and Preview: LEAD_DELIVERY_MODE, PRIME_ACCOUNT_SLUG, PRIME_SUPABASE_SERVICE_ROLE_KEY, PRIME_SUPABASE_URL, NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL, NEXT_PUBLIC_SITE_URL, LEAD_NOTIFICATION_FROM, LEAD_NOTIFICATION_TO, RESEND_API_KEY. Values not exposed. LEAD_DELIVERY_MODE is write-only in UI; presence is not proof of correct configuration. System environment variables enabled; app must refuse hosted nonproduction before real providers despite shared secrets, with noindex/noanalytics. Preserve verified sender; configure approved company recipient. No credentials in this handoff.

## Begin now

Report a brief actual-state assessment, then continue the next dependency-valid work with Claude specialists. Do not restart the spec interview or ask Brian to restate business goals. Treat the saved code as incomplete, repair it and produce the raw verification evidence before presenting the final owner-only launch steps.
