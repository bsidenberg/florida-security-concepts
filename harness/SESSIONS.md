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
| S-005 | Production delivery contracts and isolated verification | Builder + test-guard | S-002 accepted; owner dependencies resolved | NOT STARTED | None |
| S-006 | Release QA, analytics and reviewable PR | Builder + test-guard | S-004/S-005 accepted | NOT STARTED | None |

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
