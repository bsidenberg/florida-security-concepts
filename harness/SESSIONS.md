# Florida Security Concepts — Session ledger

Tier 3. Harness approved by Brian 2026-09-11, with AM-002 visual-continuity request approved 2026-09-14. The status board and latest handoffs are authoritative; earlier planning entries are historical.

## Status board

2026-09-14: Brian accepted the homepage direction and requested continuity across all pages. S-002 preview direction accepted. S-UI-001 is now MACHINE VERIFIED / READY FOR PREVIEW; remaining content sessions retain their own scope.

| ID | Objective | Owner role | Depends on | Status | Evidence |
|---|---|---|---|---|---|
| H-000 | Approved spec to reviewed harness | Orchestrator | SPEC approved 2026-09-11 | APPROVED | website-discovery.md; harness-review.md |
| S-UI-001 | Sitewide visual continuity | Builder + test-guard | S-002 verified; homepage direction accepted | MACHINE VERIFIED / READY FOR PREVIEW | S-UI-001 verification log; independent review; 21 screenshots |
| S-001 | Verification foundation | Builder + test-guard | H-000 approved | ACCEPTED | S-001-verify-20260911-123401-568-6fad0a97fde74a989eff9cb2809bbf57.log; independent/package reviews |
| S-002 | Safe local vertical slice | Builder + test-guard | S-001 accepted | MACHINE VERIFIED / AWAITING PREVIEW | S-002-verify-20260911-124844-318-5681ab0b47f14246b25ca54c1cdc167a.log; screenshots; independent review |
| S-003 | Priority maintenance/service/audience content | Builder + test-guard | S-002 preview accepted | NOT STARTED | None |
| S-004 | Remaining content and SEO preservation | Builder + test-guard | S-003 accepted | NOT STARTED | None |
| S-005 | Production delivery contracts and isolated verification | Builder + test-guard | S-002 accepted; AM-003 approved (D-017); AM-004 activated (D-021) | **ACCEPTED** — machine verified, safety review CLEAR WITH MINOR (rounds 1-3); hosted prerequisites closed by the 2026-09-15 live receipt test (AC-06 observed in production) | S-005-verify-20260914-204740-745-c0c0c1cc3e164327a5f1e7e88e288de8.log; S-005-safety-review.md |
| S-006 | Release QA, analytics and reviewable PR | Builder + test-guard | S-005 machine verified; S-003/S-004 deferred by owner launch scope | **ACCEPTED — RELEASED to production 2026-09-15** (merge 0498794); gate exit 0; OD-07 closed (D-027); post-deploy and live receipt test verified | S-006-verify-20260915-074700-671-8242639fba904fdcb8995e7e4672cf4d.log (supersedes S-006-verify-20260914-223338-346-eaf7150d9c6149eb8ae8c99a788ebff4.log); S-006-privacy-review.md; S-006-traceability.md |
| S-CI-001 | Real PostgreSQL 17 runtime in GitHub Actions so the CI gate is honest | Builder + test-guard + safety reviewer | S-006 pushed; Brian's go-ahead | DRAFT CONTRACT — NOT AUTHORIZED TO RUN | sessions/S-CI-001-postgres-ci-contract.md |
| S-DELIV-001 | Customer confirmation deliverability and DMARC alignment | Scout + staff architect + safety reviewer | S-006 released; Brian's go-ahead | DRAFT CONTRACT — NOT AUTHORIZED TO RUN; **LOW PRIORITY** (external recipient delivers normally; same-tenant only) | sessions/S-DELIV-001-dmarc-alignment-contract.md; evidence/S-006-post-deploy-20260915.md §5 |
| S-CRM-001 | Website lead → FSC CRM intake as AM-003 `crm_lead` secondary effect | Scout + builder + test-guard + safety reviewer + verifier | S-006 released; CRM NEEDS-BRIAN #7 decided 2026-09-16; Brian's contract approval | DRAFT CONTRACT — AWAITING BRIAN'S APPROVAL (OD-CRM-1..6 open) | sessions/S-CRM-001-crm-intake-contract.md |

Status lifecycle: NOT STARTED → IN PROGRESS → IN REVIEW → ACCEPTED, or BLOCKED with exact reason. S-002 may be MACHINE VERIFIED / AWAITING PREVIEW after its gate, but cannot unlock S-003 until Brian approves. No session is ACCEPTED on agent claims alone.

## Common completion contract

## S-UI-001 — Sitewide visual continuity

- Objective: apply the approved homepage visual system to every existing page, including services, industries, service areas, resource listings/articles and not-found presentation.
- Authority/dependencies: AM-002 explicit user request 2026-09-14; verified S-002 and accepted homepage direction.
- Owners: scout reconnaissance, builder implementation, independent test-guard, independent code/visual reviewer, independent verifier. Parent may adopt review/verifier roles because it writes no application or tests.
- Permitted: app route presentation/templates and globals/layout; shared presentation components; tailwind theme configuration; tests and test configuration; harness session registration/docs/evidence. No lead API/provider, data copy/pricing, or production changes.
- Acceptance: matching navy heroes, light reading surfaces, coherent typography/spacing/borders/cards/CTAs; readable contrast; no remaining unintended old dark-body islands; existing homepage/contact direction preserved; all 38 routes, links, headings, metadata and forms retained; mobile widths 390 and desktop 1440 checked across all route families.
- Validation: `pwsh -NoProfile -File scripts/verify.ps1 -SessionId S-UI-001`; common six-stage gate unchanged. Extend browser checks for route-family styles, responsive overflow, representative axe coverage and screenshots of services, industry, location and resource pages. No snapshot-only substitute for functional regression.
- Evidence/done: exit-zero raw log and reports, representative desktop/mobile screenshots, independent review, updated ledger, compiled local preview rebuilt and opened for Brian. Stop only the previously owned preview process before building/testing; no unrelated process cleanup. No production deployment or push until existing deployment gate resolved.
- Status: MACHINE VERIFIED / READY FOR PREVIEW.

Each packet inherits HARNESS boundaries and SPEC acceptance criteria. Evidence uses unique run names under harness/evidence; test-only receipts/builds stay in ignored per-run directories. Run unit, integration and browser tests against isolated local data, never production. The verifier runs the single gate and records raw output. Builder must fix failures and verifier must rerun after repairs. Independent reviewer cannot review its own implementation; safety review is required where listed. Review defects are repaired before acceptance.

Exact acceptance command: pwsh -NoProfile -File scripts/verify.ps1 -SessionId <registered session>. The manifest created in S-001 maps IDs to required checks; unknown IDs and missing/zero-test suites fail. Every session needs lint, typecheck, test:unit, test:gate, build and test:e2e. S-006 additionally needs test:release. Supporting reports and screenshots must exist and correspond to the same source revision/dirty state. Run only once after unchanged passing verification unless new changes/failures justify another run.

Required unit of handoff, appended below each packet: assigned objective; actual files changed; contract changes; tests and exact command/exit; raw log/report paths; preview/screenshots; assumptions; remaining risks/deviations; independent reviews; approval status; next role. No secrets, customer details or false passing assertions.

## H-000 — Spec to harness

- Objective: record Brian's spec approval and define safe, executable Tier 3 sessions.
- Dependencies: approved SPEC; reconnaissance of existing code and templates.
- Owner: orchestrator adopting product/staff-architecture role; separate read-only scout review.
- Permitted files: harness/SPEC.md approval metadata only; HARNESS.md, SESSIONS.md, AGENTS.md, ENVIRONMENT.md, DECISIONS.md and evidence/harness-review.md/evidence/README.md.
- Acceptance: filled documents, explicit open decisions, current-vs-future capability distinction, independent adversarial findings resolved or explicitly gated; no implementation.
- Validation: documentation consistency/links, placeholder scan, git diff --check. No application gate claimed before it is built.
- Approval: Brian approves harness plus OD-01 model alternative. This planning unit is not an accepted implementation session under Rule 5.
- Handoff: pending final review/approval.

## S-001 — Verification foundation on existing site

- Objective: make the machine gate honest, reproducible and safe before redesign.
- Dependencies: H-000 approved; OD-01 resolved.
- Owner: builder for gate/config, test-guard for tests; verifier, independent code reviewer and independent safety reviewer accept. Safety review covers launcher, network and credential isolation.
- Permitted files: scripts/**, tests/**, package.json/package-lock.json, vitest.config.*, playwright.config.*, tsconfig test configuration, .github/workflows/verify.yml, .gitignore; harness verification manifest and ledger/evidence. Application behavior and page copy excluded.
- Inputs: current route inventory and existing validator/provider contract; Node 24; approved tooling plan.
- Outputs: PowerShell-native runner, required check manifest, pinned test dependencies, isolated local server helper, non-empty tests, CI calling same runner and always retaining logs.
- Meaningful tests: existing valid/invalid lead validation, honeypot blocks delivery, malformed endpoint input, 38-route inventory, homepage/contact navigation and a synthetic console-only baseline receipt. Use stable intended behaviors; do not assert known defects are correct or add tests only to hit a count.
- Gate self-tests: unknown ID; missing script; zero tests; failing child; raw stdout/stderr preservation; unique log paths; cleanup only own processes; success case. Temporary fixture projects do not substitute for real-site tests.
- Isolation: clear child live credentials, block browser/external delivery, analytics disabled; test server binds loopback. Baseline browser tests may use next dev with explicit console-only synthetic data because local receipt adapter is not implemented yet. Build is separate and serialized; no public deployment.
- Acceptance: all required suites actually run, nonzero meaningful test counts, no --if-present/cmd/Bash path, exit-zero S-001 log exists, independent code and isolation safety reviews complete. Explain baseline console-only test scope; it is not production-safe delivery certification.
- Validation: common gate with -SessionId S-001. CI dry configuration review plus gate self-tests; external CI run waits for safe push authorization.
- Evidence: S-001 raw gate log, unit/e2e reports, baseline route fixture, independent code and isolation safety reviews, safe config checks and handoff.
- Out of scope: redesign, production fixes, data/schema changes, global hook changes, deployment.
- Done: machine gate, independent code review and isolation safety review accepted; foundation is ready for S-002. No Brian preview required for test infrastructure alone.

## S-002 — First real local vertical slice

- Objective: implement homepage → assessment → durable synthetic local receipt → confirmation, with mobile and failure behavior.
- Dependencies: S-001 ACCEPTED; local receipt/contract proposals approved as part of harness.
- Owner: builder for app; test-guard for tests; independent reviewer, safety reviewer and verifier.
- Permitted application paths: app/page.tsx, app/contact/page.tsx, app/api/leads/route.ts, app/layout.tsx, app/globals.css, app/robots.ts, components/Header.tsx, Footer.tsx, Hero.tsx, LeadCaptureForm.tsx, CTASection.tsx and new small presentation components; data/site.ts; lib/leads/**; next.config.mjs; isolated local helper scripts/tests/config. Existing provider adapters may only receive contract-compatible safety plumbing, redaction and test seams, not tenant/schema/routing changes. No broad service/industry/resource rewrite.
- Inputs: HARNESS C-01–C-06; SPEC opening copy/visual direction; public existing contact phone; synthetic test fixtures.
- Outputs: manager-focused homepage, six-field assessment, updated branding/navigation, query synchronization, safe timeouts/error states, explicit local delivery isolation, durable local receipts, privacy-safe result logs.
- First-preview nav: maintenance anchors to homepage section until S-003 page exists. Existing service URLs remain available. New styles must not break existing page navigation.
- Tests: required/optional/legacy values; overlength rejection and 32 KiB streamed boundary including multibyte text; unsafe payload types; phone digits/extensions; HTML escaping; no delivery for invalid input; all response states; no analytics-induced false error; direct/contact-to-emergency/back-forward defaults; no loss of entered contact fields.
- Duplicate tests: unchanged replay, changed-payload conflict, double-click, ambiguous timeout retry, two processes, process restart, partial/corrupt record and 24-hour expiry using clock control. Prove one local receipt. Simulated primary/secondary failures prove orchestration only; global production AC-06 remains open.
- Safety tests: inherited and test environment-file provider values, unsafe mode, hosted flags, stale production build, local flag mismatch, forbidden external network attempt, no PII in logs, no public receipt endpoint/path traversal. Synthetic artifacts only.
- UI tests: homepage and contact at 320/390/768/1024/1440 widths; urgent call visible without menu on phone; no overflow; visible company name/accessibly named home link; keyboard menu/Escape/focus, validation and success announcements; automated axe on homepage/contact; reduced motion; 200% zoom spot check. Broader screen-reader/device/performance matrix remains S-006.
- Validation: common gate with -SessionId S-002; tests fail if receipts/UI are only mocked client-side. Build/start safe flags must match.
- Evidence: raw gate; browser screenshots at minimum 390/1440; synthetic receipt with matching logical ID; a11y/keyboard results; review/safety-review reports; limitation that production integrations remain unverified.
- Preview instructions: open isolated loopback homepage, identify services/audience, request free assessment with supplied fake values, inspect local receipt, confirm request is not booking, try empty input and simulated delivery failure, inspect emergency link without calling.
- Approval: **STOP after verified preview; Brian must accept direction before S-003/S-004.**
- Done: verifier exit zero + independent reviews + screenshots + Brian preview acceptance recorded. No claim of global release completion.

## S-003 — Maintenance, services and priority audiences

- Objective: build the maintenance-led information architecture after Brian accepts the slice.
- Dependencies: S-002 accepted including preview.
- Owner: builder/test-guard; independent reviewer/verifier. Safety reviewer if form or data contract changes, otherwise refer unchanged approved boundary.
- Permitted: data/services.ts, data/industries.ts (HOA and property-manager entries), app/services/**, app/industries/page.tsx and shared industry rendering only as needed, homepage/nav links to maintenance; related tests and evidence. No unrelated industry rewrite.
- Acceptance: new /services/preventive-maintenance; all six old service routes preserved; priority pages explicitly speak to CAMs; repair/retrofit/installation choices clear; only substantiated scope; no prices/packages/SOPs/monitoring invented; emergency service call-first; forms retain contract.
- Tests: real route status/unique headings, maintenance discoverability within two navigation actions, legacy prefills, no dead anchors, required page questions answered, prohibited claims absent with manual copy review beyond keyword scans, representative mobile/a11y regression.
- Validation: common gate -SessionId S-003.
- Evidence: raw log, updated inventory (39 routes), screenshots for maintenance/services/audience/emergency, independent content/code review and handoff.
- Done: gate and independent review; no additional owner question unless actual business content decision emerges.

## S-004 — Remaining content, resources and SEO

- Objective: improve remaining industry/location/resource utility without losing search routes.
- Dependencies: S-003 accepted; OD-04 closed for any numerical claims changed.
- Owner: builder/test-guard; independent reviewer/verifier.
- Permitted: remaining data/industries.ts, data/locations.ts, data/resources.ts; app/industries/**, app/service-areas/**, app/resources/**, app/sitemap.ts, app/robots.ts, lib/seo/**, components/Schema.tsx and navigation/footer links; related tests/evidence.
- Acceptance: all 39 routes return intended content, priority territory preserved, no invented office/coverage/response guarantees, useful unique page content; cost-driver education and guide URL retained; current numerical price claims either substantiated or specifically reviewed with Brian. Real modification dates, www canonicals, query canonicalization and no fake schema proof.
- Tests: full independent route inventory diff, status/soft-404 checks, unique metadata/H1s, canonical and sitemap agreement, schema parsing and unknown-field omission, existing internal links/query prefills, representative phone/keyboard cases.
- Validation: common gate -SessionId S-004.
- Evidence: raw log, route comparison, metadata/schema reports, resource/content review, representative screenshots and owner decisions if needed.
- Done: gate/review pass with no undocumented SEO/content loss.

## S-005 — Production delivery design and isolated tests

- Objective: close the gap between working local UI and reliable production receipt without unauthorized live effects.
- Dependencies: S-002 accepted; production contract/privacy decisions required by the implementation under OD-02/03/05/06 resolved before code. Read-only research can start earlier; implementation is blocked until production retry/storage design is formally amended/approved. Policy publication approval and real receipt checks remain release gates.
- Owner: staff architect/builder/test-guard, independent safety reviewer, verifier.
- Permitted after amendment: lib/leads/**, app/api/leads/route.ts, shared form only for approved contract changes, scripts/test helpers, schema DRAFT files under sql/ if explicitly authorized by amendment, ENVIRONMENT/DECISIONS/evidence. External Prime schema remains owner-controlled.
- Required inputs: active delivery mode, safe names-only configuration validation, authoritative schema/interface metadata, recipient owner and backup, recovery responsibilities, retention and approved privacy language. No customer row dumps.
- Acceptance: approved persistent production claim/replay contract; stable IDs per effect; duplicate/concurrency/timeout recovery; no repeated primary notification on secondary/customer-copy failure; safe error logs; production local/console rejection; HTTPS webhook; explicit production abuse policy; existing tenant and recipient boundaries retained.
- Tests: mocked provider contracts plus sandbox/local equivalents of the actual approved persistence mechanism, cross-process/concurrency/restart and ambiguous outcomes, recovery replay, failed confirmation, wrong-account/config refusal and PII log scan. Mocks alone cannot certify external deliverability or real tenant isolation.
- Validation: common gate -SessionId S-005; include contract suite backed by isolated actual persistence technology once chosen.
- Evidence: approved design amendment, SQL drafts only if required, raw log, privacy/security review, configuration statuses, unresolved external receipt checks clearly labeled.
- Approval: real email sends, production database operations, configuration changes and policy publication require separate explicit Brian approval. If no safe equivalent can prove the required semantics, leave session blocked; never waive global AC-06.
- Done: technical contract and isolated implementation pass; external credential/receipt tests remain named release prerequisites and cannot be called verified until explicitly authorized and observed.

## S-006 — Release QA, analytics and PR readiness

- Objective: complete global SPEC acceptance evidence and prepare a reviewable release without deploying.
- Dependencies: S-004/S-005 accepted; all applicable owner release dependencies closed.
- Owner: builder/test-guard; independent reviewer/safety reviewer as needed; verifier; orchestrator prepares PR.
- Permitted: analytics module/layout/shared form event hooks, metadata/asset performance fixes within approved design, tests/scripts/CI, docs/evidence; any material change goes through amendment. No new tracking service.
- Acceptance: SPEC event allowlist and no PII in pageviews/events; unchanged production provider ownership; all routes and form failures; current Chromium/Firefox/WebKit plus real-phone observation where available; keyboard/screen reader, 200% zoom/400% reflow, contrast and reduced motion; three-run median Lighthouse targets and field metrics if enough data, never invented.
- Validation: common gate -SessionId S-006 adds test:release; save tool versions, environment, URL/build, metrics and screenshots. Required evidence manifest fails on missing reports. Any target exception is explicit, reviewed and owner-approved.
- Evidence: raw logs, a11y/screen-reader/device matrix, performance reports, analytics request capture, route checks, reviews, limitations, requirements-to-evidence traceability, safe deployment/rollback plan.
- Git/PR: after actual deployment-trigger inspection, push feature branch only if it cannot trigger unauthorized production; determine base preserving existing SEO work. PR body includes summary, exit-zero log path and local/isolated preview instructions. Brian alone merges. If safe push cannot be established, prepare local PR description and report blocker rather than push.
- Done: complete technical release package and reviewable PR where authorized. Production deployment remains a separate owner action; no conversion uplift claimed without live measurement.

## Handoff log

### S-UI-001 — machine verified theme continuity, 2026-09-14

Authority: Brian accepted the homepage direction and requested sitewide continuity (AM-002). Builder changed shared semantic colors, hero/CTA presentation, card surfaces and resource article color inheritance; no copy, route, metadata or lead contract changes. Independent reviewer foundation_gate found a homepage emergency focus-outline contrast issue; builder repaired it and review cleared. Review: evidence/S-UI-001-review.md.

Parent adopted independent verifier, authored no application or tests, and ran scripts/verify.ps1 -SessionId S-UI-001. Exit 0: all six stages, 96 unit tests, 11 gate tests, 83 browser tests (190 total). Raw machine log: evidence/S-UI-001-verify-20260914-140814-085-89f86aaf5c0b4900b112049a5f0f86b8.log; matching JSON reports preserve counts. All 38 routes checked; 21 screenshots cover ten page families at 390/1440 pixels plus mobile not-found. These are browser emulations, not physical-device observations. Compiled local preview is rebuilt separately at http://127.0.0.1:3100/services for Brian's visual review. No production changes or live communications. No push/PR because deployment triggers remain unverified under OD-03. Remaining content sessions retain their separate scope.


### S-002 — machine verified, awaiting Brian preview, 2026-09-11

Compiled preview started on 127.0.0.1:3100 in owned terminal session 56829. Separate Chromium compiled smoke exited 0; evidence/S-002-compiled-smoke.json proves noindex, no analytics, no external browser request, and actual local assessment receipt. Compiled homepage and confirmation screenshots saved. Server remains running for Brian's review. No push/PR created because deployment triggers remain unverified under OD-03; all work checkpointed locally.

Parent independent verifier ran `pwsh -NoProfile -File scripts/verify.ps1 -SessionId S-002`: exit 0, all six required stages, 96 unit tests, 11 gate tests and 62 browser tests. Raw log: evidence/S-002-verify-20260911-124844-318-5681ab0b47f14246b25ca54c1cdc167a.log, matching JSON reports and four home/contact screenshots. Parent independently reviewed app/test/isolation changes; evidence/S-002-independent-review.md records findings and fixes. Files cover the scoped homepage/contact/shared presentation, lead contract/local receipt, safe local helpers and tests. Next automatically added local generated type output to tsconfig without removing source coverage. No live provider calls or production changes. Browser/zoom evidence is emulation; global release requirements remain open. Local compiled preview smoke evidence is collected separately. Brian must accept the working preview before S-003/S-004. See LOCAL_REVIEW.md for the concrete click path and synthetic fixture.

### S-001 — accepted foundation, 2026-09-11

Parent adopted independent verifier role (authored no application, tests or runner) and ran `pwsh -NoProfile -File scripts/verify.ps1 -SessionId S-001`. Exit 0, all six required stages: lint, typecheck, 29 unit tests, 11 gate tests, build, 40 browser tests. Raw log: evidence/S-001-verify-20260911-123401-568-6fad0a97fde74a989eff9cb2809bbf57.log with three matching JSON reports. Independent code/isolation review and separate package review recorded. Source revision 953e50f plus dirty file inventory in raw log. All 38 existing routes and synthetic console receipt verified; no production delivery claim. Next: S-002 frontend/backend/test specialists; stop for Brian's working-preview acceptance. Fresh S-002 reconnaissance confirms application files remain unchanged from discovery, with S-001 tooling now available.

### H-000 — planning handoff (pending harness review)

Objective: translate approved spec into safe sessions. Files: SPEC approval metadata, HARNESS, SESSIONS, AGENTS, ENVIRONMENT, DECISIONS, review evidence. Application changes: none. Tests: none claimed; documentation checks only. Findings: missing test floor, no current durable production idempotency, unsafe legacy console fallback, unverified deployment triggers, named model unavailability. Next role: Brian approves concrete harness and routing choice; then builder/test-guard S-001 with independent verifier.

S-UI-001 compiled preview follow-up: launcher session 16846 is running. Independent Chromium smoke exited 0: /services HTTP 200, light body rgb(246,247,247), navy hero rgb(18,35,55), noindex/nofollow. Evidence: S-UI-001-compiled-smoke.json and S-UI-001-compiled-services.png. Codex browser open was queued; direct review URL remains http://127.0.0.1:3100/services.

### S-005-DRAFT — authorized disposable schema verification

- Authority: standing Rule 7 explicitly permits migration drafting; Brian requested completion of production safeguards before publishing. This packet authorizes only a reviewable draft and an isolated disposable experiment, not adoption or production application of the proposed architecture.
- Scope: staff architect drafts PRODUCTION-RECEIPT-PROPOSAL.md; builder drafts additive SQL/runbook under sql/; independent safety reviewer reviews it. Isolated synthetic PostgreSQL/PGlite experiment under ignored .fsc-test/sql-draft-check may install a pinned test-only dependency there and save raw output under evidence/S005-sql-draft*. No root dependency changes or application code.
- Preconditions: read-only metadata inspection complete; public accounts/leads structure known. No production data or secrets needed.
- Validation: exact draft SQL executes against synthetic local schema; constraints, grants/RLS, claim/conflict/expiry behavior checked where implemented. Report embedded runtime/concurrency limits. This experiment is not a passing S-005 gate or release certification.
- Owner gate: review and approve concrete persistence/privacy architecture before app implementation; Brian alone applies any production SQL. Never deploy against absent schema.

## S-SEC-001 — Existing-stack dependency security repair

- Authority: Brian requested completion of launch safeguards and publication; routine security defect repair is autonomous under Rule 6. This session updates maintained versions within the existing Next.js App Router/React/Resend architecture, without replacing the framework, changing product behavior or adopting the pending receipt-storage proposal.
- Dependency: accepted S-UI-001; independent advisory/registry reconnaissance in evidence/S006-dependency-remediation-plan.md. Can proceed independently of AM-003 storage approval.
- Owner: builder application/package changes; independent test-guard verification support; independent safety reviewer; parent independent verifier (no app/test authorship).
- Permitted: package.json/package-lock.json, necessary route params/searchParams and React typing compatibility edits in existing app/components, next-env/tsconfig generated compatibility as needed, existing test fixtures solely to preserve truthful assertions, related documentation/evidence. Preserve 38 routes, approved theme/copy and all lead behaviors; no new receipt implementation or production change.
- Planned target: maintained Next 15.5.25 with matching eslint-config-next; supported React 19 pair/types after registry confirmation; patched Resend 6.12.3; patched PostCSS 8.5.28 direct/Next-scoped override if needed. Confirm resolved dependency audit after install, never npm audit fix --force.
- Acceptance: lint/typecheck/build, existing 190-test floor preserved with meaningful fixes for compatibility only; fresh production dependency audit reviewed; local compiled preview retains approved behavior. No silent suppression of audit warnings or test skips.
- Validation: scripts/verify.ps1 -SessionId S-SEC-001 (same six-stage gate), raw unique evidence; independent code/security review. This is security repair acceptance, not full S-005/S-006 or production release approval.
- Status: MACHINE VERIFIED; production release remains gated.

### S-005-DRAFT handoff — reviewed proposal, 2026-09-14

Builder foundation_gate authored additive sql/fsc-assessment-receipts.draft.sql and draft-runbook.md. Independent safety reviewer release_safety cleared identified SQL draft findings after repairs; review evidence/S005-sql-draft-review.md. Exact final draft SHA256 f46a88bf623e3b8ba6ac9b93e78a45937f08d84fd686eaff70e3548441279ba1. Raw evidence/S005-sql-draft-local.log records 30 isolated PGlite checks, reproducible source evidence/S005-sql-draft-check.mjs. This is real embedded PostgreSQL execution but single-connection only; not multi-process contention, deployed Supabase ACL or live email proof. No production SQL applied and no S-005 acceptance claimed. AM-003 architecture/retention approval requested asynchronously and remains pending; application implementation dependent on that decision has not begun.

Supporting release reconnaissance: evidence/S006-readonly-route-sweep-20260914.json records 38 routes, 107 internal targets, 140 parseable JSON-LD blocks, matching sitemap and query canonicals, zero issues/external browser attempts. This supports the release package but is not full S-006 acceptance. Firefox1543 and WebKit2359 installed from pinned Playwright CDN for later browser verification; installation alone is not test evidence.

### S-SEC-001 — machine verified security repair, 2026-09-14

Parent independent verifier (no application/test authorship) ran scripts/verify.ps1 -SessionId S-SEC-001. Final run 20260914-144817-278-e958975e2c334d90866006dc4921135a exited 0: lint/typecheck/build plus 96 unit, 11 gate and 83 compiled-browser tests (190 total), no forbidden network marker. Raw evidence/S-SEC-001-verify-20260914-144817-278-e958975e2c334d90866006dc4921135a.log and matching reports. Earlier failed run c8d6fc35002e4e9eb4bc5b2548f273bd retained; D-016 explains the compiled-test fix with unchanged network guard. Independent source review evidence/S-SEC-001-review.md cleared both dependency/route changes and the test-launch change.

Next15.5.25/React19.3.0/Resend6.12.3/PostCSS8.5.28 resolved; production audit reports zero known vulnerabilities (evidence/S-SEC-001-production-audit.json). Five route parameter interfaces adapted and tracing root explicitly bounded to this repository. No form/provider/validation/theme behavior change or production release. Existing theme screenshots were regenerated by the full suite; representative copies use S-SEC-001 names. Builder's compiled synthetic receipt smoke succeeded; parent restores local preview separately. S-005 storage approval, application integration and production/release gates remain open.

S-SEC-001 preview handoff: compiled local preview restored in owned terminal session 82740 at http://127.0.0.1:3100. Parent read-only smoke exited 0 across Chromium, Firefox and WebKit at 390px: home, contact with service query and access-control detail all HTTP200, no horizontal overflow, noindex, zero external browser attempts (nine checks). Evidence/S-SEC-001-restored-preview-smoke.json. This is a representative smoke, not full cross-browser form or physical-device release certification. No live form submission; previous local synthetic receipt is separately evidenced. User's storage approval remains pending; no production release or production SQL was performed.

### S-005 activation — AM-003 approved, 2026-09-14

- Authority: Brian approved the concrete AM-003 receipt-storage plan and renewed publication approval. Earlier pending-approval text is historical and superseded by this entry.
- Builder foundation_gate owns lib/leads/**, app/api/leads/route.ts, required hosted-preview layout/robots isolation, operational helpers under scripts/, SQL draft/runbook corrections. Preserve accepted UI, all 38 routes and others' edits. No production SQL or live sends.
- Test-guard foundation_tests owns tests/**, test configuration and necessary test dependencies/scripts; coordinate package.json ownership. Add meaningful approved persistence and provider failure/retry tests without weakening the existing 190-test floor.
- Independent release_safety reviews resulting app/SQL/access/privacy contracts and operational readiness; no builder self-review. Parent maintains harness and independently runs the machine gate.
- Hosted preview must refuse real provider delivery and disable analytics/indexing before feature push. Configuration values remain private. Any non-equivalent architecture discovery is recorded before implementation.
- Completion remains S-005 raw exit-zero gate plus independent review; external production schema, delivery and S-006 release evidence are distinct and cannot be inferred from isolated tests.

### S-005 interrupted — workspace credits exhausted, 2026-09-14

Builder foundation_gate and testguard foundation_tests failed with workspace-out-of-credits messages during implementation. Partial app/test changes remain saved in the working tree; no S005 gate or acceptance claim. See LAUNCH-HANDOFF.md interruption section for exact resume responsibilities and D021 approval context. Production remains unchanged. Do not publish partial work or reuse SSEC evidence as S005 acceptance.

### S-005 resumed — Claude Code specialists, 2026-09-14

Orchestrator inspected the saved tree (see sessions/S-005-resume-contract.md ground truth): partial coordinator/environment guard, dispatcher/API/layout/robots edits, Resend envelope snapshot, unfinished PostgreSQL helper; PostgreSQL 17.11 portable runtime extracted and archive hash matches D-018; branch never pushed; compiled preview (launcher PID 37460, scripts/local-server.mjs --compiled) still serves the earlier verified checkpoint on 127.0.0.1:3100. Exact RPC/status/test interfaces recorded in the resume contract (D-022). Builder and test-guard dispatched in parallel with disjoint path ownership; independent safety review and the orchestrator-run S-005 gate follow. No production, SQL, email or hosting action taken.

S-005 test-guard attempt 1 REJECTED by orchestrator review (2026-09-14): the test-guard agent definition routes to a small model; its rewritten tests/unit/delivery-safety.test.ts contained assertion-free cases and assertions on values the test itself stubbed, and several new PostgreSQL tests contradicted the resume contract (new receipts created with a NULL source). Its reported "39 passing coordinator tests" is not evidence. Role re-dispatched on Opus with explicit honesty rules and instructions to rebuild from the committed delivery-safety tests. Attempt-1 files are treated as untrusted drafts to be overwritten.

### S-005 gate run 1 — exit 0 on round-3-reviewed source, 2026-09-14

Orchestrator (independent verifier role; authored no application code or tests) ran `scripts/verify.ps1 -SessionId S-005` with portable PowerShell 7.6.6 (D-025). Exit 0, 6/6 stages: lint, typecheck, test:unit 172 passed, test:gate 153 passed (real PostgreSQL 17.11, multi-process races, restart, admission, ACL, schedule simulation, coordinator with fake Resend/PostgREST transport), build, test:e2e 83 passed; no network-violation marker. Raw log: evidence/S-005-verify-20260914-204159-905-3f30c852db5f469290917e4cd8128e41.log with matching JSON reports. Prior floor 190 → 408. Safety review rounds 1–3: evidence/S-005-safety-review.md (round 3 CLEAR WITH MINOR). Minor R3-1/R3-2 repairs follow, so this run is superseded by a final rerun on the repaired source; it is retained, not hidden. The earlier compiled preview process (PID 37460) had already exited before this run; nothing was stopped.

### S-005 — machine verified on final source, 2026-09-14

Orchestrator (independent verifier; no application/test authorship) reran `scripts/verify.ps1 -SessionId S-005` after round-3 repairs (R3-1 reclaim records uncertain; R3-2/N-R3 runbook). Exit 0, 6/6: lint, typecheck, test:unit 172, test:gate 157 (adds four R3-1 reclaim/trigger cases; test-guard confirmed they fail against the pre-R3-1 claim in a scratch mutant), build, test:e2e 83. Raw log: evidence/S-005-verify-20260914-204740-745-c0c0c1cc3e164327a5f1e7e88e288de8.log plus matching unit/gate/e2e JSON. Earlier exit-0 run 204159-905 retained.

Final SQL SHA-256: fsc-assessment-receipts.draft.sql db36d14afef74eaf7cb0bcc4ebdc08ae02b2f9f13ab3da098f931354d2e6a228 (round-3 reviewed c28416d0… plus the reviewer-specified one-line R3-1 claim change); fsc-cleanup-schedule.draft.sql a6ca1f60e9bbc9a2f74f335b7ed1c9177953df2b2eb648adb884239f6d552bd4; fsc-cleanup-health.sql 73c9be41655d679dbf7686af4c1bb158ac52505f6482d786305417b8f54d5e17; fsc-receipt-reconciliation-report.sql a83df65be5d51c3b14614c9e84d5a95a1136b4244431a21db3106a74ce891eb1.

Handoff: builder (Sonnet) implemented SQL/app per resume contract and D-023/AM-004a/D-024/D-026; test-guard attempt 1 (small model) rejected for dishonest tests; attempt 2 (Opus) rebuilt suites against real PostgreSQL 17.11 with multi-process races, restart, admission, ACL, schedule simulation and coordinator through real productionDependencies() with fake Resend/PostgREST network. Independent safety review (Opus) rounds 1 BLOCKED → 2 CLEAR WITH MINOR → 3 CLEAR WITH MINOR; all findings repaired or dispositioned (N-3/N-4/N-6/N-8/N-10/N-11 accepted; N-R3b trusted-service_role hardening not pursued). Remaining owner/hosted prerequisites: OD-07 disclosure approval; Brian applies the three SQL files in order and enters FSC_ADMISSION_HMAC_KEY (Production only); hosted checks listed in the review (x-vercel-forwarded-for provenance/IPv6, VERCEL_ENV at build/runtime, PostgREST ACL and schema reload, pg_cron real run as job owner, Resend replay/409 names, function duration, controlled inbox receipt). S-006 next.

Correction (2026-09-14): the `harness/evidence/adhoc-verify-*.log` files are produced by Brian's global Claude Code Stop hook (~/.claude/hooks/auto-verify.js), which runs scripts/verify.ps1 under Windows PowerShell 5.1 without -SessionId and therefore always fails with a missing-parameter error. They are not gate evidence, are not committed, and were not produced by test-guard. Global hook configuration is outside project scope; reported to Brian.

### S-006 — machine verified release QA, 2026-09-15

Contract: sessions/S-006-release-contract.md (+ execution addendum). Builder (Opus): lib/analytics (8 SPEC events, enumerated allowlists, sanitized manual pageviews, origin-only referrer via tracker transformRequest, custom loader replacing next-plausible), data-fsc-* event hooks without copy/visual change, launcher `--measure`/`--analytics-fixture` production-equivalent loopback builds in separate dist dirs, verify.ps1 test:release Playwright report rule, next.config.mjs `htmlLimitedBots` repair so dynamic /contact metadata and canonical render in head. Test-guard (Opus): release suite (Chromium/Firefox/WebKit flows, layout/a11y/reflow/reduced motion, analytics payload capture against the exact published pa- script and the npm core, Lighthouse 3×6 routes), 218 new unit tests, gate self-tests for the new rule; removed unused next-plausible. Independent privacy review (Opus) rounds 1–2 CLEAR WITH MINOR; orchestrator statically verified the published site script loader (M-1). Orchestrator registered test:release in verification.json and portable PowerShell 7 (D-025).

Orchestrator (independent verifier) ran `scripts/verify.ps1 -SessionId S-006 -CheckTimeoutSeconds 1800`: exit 0, 7/7 — lint, typecheck, test:unit 390, test:gate 166, build, test:e2e 83, test:release 155; no network-violation marker. Raw log evidence/S-006-verify-20260914-223338-346-eaf7150d9c6149eb8ae8c99a788ebff4.log; release evidence folder evidence/S-006-release-20260914-223338-346-eaf7150d9c6149eb8ae8c99a788ebff4 (Lighthouse summary and 18 raw reports, analytics payload capture with zero contact canaries, zero sinkhole connections, 12 cross-browser screenshots). Lighthouse medians: Performance 96–98; Accessibility, Best Practices and SEO 100 on /, /contact, /services, HOA industry, Orlando area and the gate-cost article. Traceability: evidence/S-006-traceability.md. Not performed: physical device, real screen reader, field Core Web Vitals, real hosted preview and live-site checks. The e2e suite again regenerated historical S-002/S-UI-001 screenshots; those were restored from git.

Open owner/hosted items: OD-07 disclosure approval (including the optional analytics sentence), Vercel key and delivery mode, owner SQL application and cleanup health, Plausible goals, merge, post-launch read-only smoke, the required analytics payload check on www, and authorization for a controlled live form test. See harness/OWNER-LAUNCH-STEPS.md.

### S-006 amendment — OD-07 disclosure wording, machine verified, 2026-09-15

Authority: Brian closed OD-07 (D-027). He approved tightened disclosure wording with an analytics sentence, then amended that sentence to "page visits and form steps" and kept everything else. Change class: owner-approved public copy only. No behavior, data flow, analytics payload or visual structure changed.

Handoff:
- **Builder (Sonnet):** replaced the two disclosure paragraphs in components/LeadCaptureForm.tsx with the three approved paragraphs, then applied the one-phrase amendment. Lint and typecheck exit 0 after each edit.
- **Test-guard (Opus):** added tests/e2e/privacy-disclosure.spec.ts, one test for each form-bearing route family: /contact, /services/access-control, /industries/hoa-gated-communities, /service-areas/orlando. The homepage does not render the form. Each test asserts the exact ordered paragraph text from the real compiled page, that superseded phrases are absent (including the intermediate "to measure form steps"), that the disclosure is visible outside the closed optional details section, and that no external request or Plausible script occurs. Fail-proof: four scratch mutants (old wording, hyphen instead of em dash, curly apostrophe, live superseded check) each failed against the real app, then were deleted.
- **Orchestrator (independent verifier; authored no application or test code):** reviewed both diffs against the approved text and updated DECISIONS D-027 and OWNER-LAUNCH-STEPS.

Gate runs:
- **Intermediate wording** ("to measure form steps"): run 20260915-073409-084-3e9a2ba85b034ba186e82f430628c14d exited 0, 7/7 (unit 390, gate 166, e2e 87, release 155). Superseded by the amendment and retained.
- **Final wording:** `scripts/verify.ps1 -SessionId S-006 -CheckTimeoutSeconds 1800` (portable PowerShell 7.6.6, D-025), run 20260915-074700-671-8242639fba904fdcb8995e7e4672cf4d. Exit 0, 7/7: lint, typecheck, test:unit 390, test:gate 166, build, test:e2e 87 (floor 83 → 87), test:release 155. No network-violation file. Raw log evidence/S-006-verify-20260915-074700-671-8242639fba904fdcb8995e7e4672cf4d.log; release folder evidence/S-006-release-20260915-074700-671-8242639fba904fdcb8995e7e4672cf4d. The log records revision 3bbc79e plus this amendment dirty set.

The e2e suite again regenerated historical S-002/S-UI-001 screenshots; they were restored from git. Separately, Brian confirmed OWNER-LAUNCH-STEPS 1.4 (Preview credential scoping) done. Draft PR #1 was updated. Not merged; merge remains Brian's.

### S-006 — released and verified in production, 2026-09-15

Brian merged PR #1 as `0498794`; Vercel Production deployed at 2026-09-16T00:40:23Z. Full evidence: `evidence/S-006-post-deploy-20260915.md`.

Read-only production checks passed: 38-route sitemap, `index, follow` with www canonicals (the `htmlLimitedBots` fix confirmed live), robots.txt allowing the site while disallowing /api/, apex 308 to www, `GET /api/leads` 405, the owner-approved OD-07 disclosure rendering, zero console messages, and the pinned Plausible script hash unchanged. Live `/api/event` bodies dropped `email` and `gclid`, normalized a non-conforming `utm_source` to `other`, kept `utm_campaign`, forced the canonical www origin, reduced the referrer to its origin, and carried only categorical properties.

Controlled live receipt test (owner-authorized, request ID ending `5362eecc`): one submission then a byte-identical same-ID replay. Both returned 200 with the same receipt, the replay in 287 ms. Result: 1 receipt, 3 effects, 1 admission counter, `public.leads` 580 → 581. Brian confirmed exactly one company notification at info@ (8:48 PM, correct details), Resend Delivered once each for both messages with no second copy from the replay, and a reconciliation report returning no rows — nothing unresolved.

This closes the hosted prerequisites that isolated tests could not prove: PostgREST exposure of the `fsc_private` RPCs with a reloaded schema cache, and a working production `FSC_ADMISSION_HMAC_KEY` and `LEAD_DELIVERY_MODE`. AC-06 is now observed on real infrastructure. S-005 and S-006 are ACCEPTED.

One open finding, not a release defect: the customer confirmation was sent and Delivered per Resend, then held tenant-side by recipient anti-spoof filtering, with the sending domain fully Verified (DKIM, SPF, sending enabled). Drafted as S-DELIV-001, not run. Limitations remain as recorded in the evidence file: metadata row counts rather than `count(*)`, effect states inferred from an empty reconciliation report, one success-path scenario only, and no physical device, screen reader or field Core Web Vitals.
