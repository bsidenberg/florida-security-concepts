# Florida Security Concepts — Decisions, amendments and risks

Tier 3 · 2026-09-11. Each entry states actual authority.

Approval recorded: Brian explicitly instructed “build the website as planned” and requested the local development version for review in response to the consolidated approval question. HARNESS v1.0, AM-000/AM-001, D-005/D-012 and OD-01 separate Codex specialists are approved. Earlier proposed/pending entries below are historical and superseded. S-001/S-002 proceed through local preview; remaining production and broad-build gates persist.

## Decisions

AM-002 / 2026-09-14 — APPROVED by Brian's explicit request to apply the homepage theme to all pages. Homepage design direction accepted; S-UI-001 performs sitewide visual continuity before the broader content rewrite. Existing copy, metadata, routes, pricing and lead behavior remain. No further design-plan approval required for this requested work.

| ID | Class | Decision | Authority/status | Affected work |
|---|---|---|---|---|
| D-001 | OWNER DECISION | Written website SPEC approved; maintenance-led HOA/CAM offer, Orlando/Tampa, free assessment, retain 24/7, no fabricated proof/Sentinel claims | Brian explicitly approved 2026-09-11; SPEC metadata updated | Harness planning authorized |
| D-002 / AM-000 | AMENDMENT — sequencing | Insert verification foundation as S-001 and move first slice to S-002, following build-harness workflow; preserve substantive preview-before-broad-build requirement | Proposed for harness approval; approved SPEC's implementation stage IDs remain historical until approval | Session numbering/dependencies |
| D-003 / AM-001 | AMENDMENT — acceptance dependency | First slice proves durable local receipt/retry and simulated adapter cases; production mechanism/global AC-06 remains S-005 release blocker | Proposed for explicit harness approval; affects SPEC §2 duplicate priority, §6 duplicate contract, §10 AC-06, §11 O-10 | S-002/S-005 |
| D-004 | OWNER DECISION — model routing | Requested Opus/Fable/Sonnet not callable here; propose current Codex model with separate independent specialists | OD-01 pending; no claim that unavailable models were used | Implementation and safety routing |
| D-005 | AMENDMENT — local test infrastructure | New local-only durable synthetic receipt adapter, no HTTP receipt listing, fixed ignored storage, exclusive record creation and no external-provider fallthrough | Proposed in HARNESS C-03; no production datastore | S-002 |
| D-006 | CLARIFICATION | Existing repo/stack retained; no golden-path replacement for established application | Derived from approved SPEC; no code changed | All |
| D-007 | CLARIFICATION | Maintenance nav temporarily targets homepage anchor before its page exists; final route appears S-003 | Reversible link staging within approved information architecture | S-002/S-003 |
| D-008 | CLARIFICATION | Preserve existing primary email / secondary database / best-effort customer-copy semantics until production contract amendment | Existing source and approved preservation scope | S-002/S-005 |
| D-009 | CLARIFICATION | Read-only discovery checks are not accepted implementation evidence | Rule 5; no verify pass claimed | All reporting |
| D-010 | OWNER DEPENDENCY | No feature push until actual Vercel production/preview triggers are verified | Approved SPEC O-08; no push attempted | PR/external preview |
| D-011 | CLARIFICATION | SOP details, proof assets and Sentinel implementation do not block a truthful local website preview | Brian explicitly requested simplification; omit unsupported claims | Content |
| D-012 | AMENDMENT — test tooling | Proposed Vitest/Playwright/axe, strict PowerShell gate, exact compatible dev dependencies pinned at installation | Part of proposed harness; no installs yet, no framework upgrade | S-001 |

AM-000/AM-001 and D-005/D-012 become approved only when Brian accepts the written harness. Record approval date and update SPEC with a linked amendment note then; do not silently rewrite the approved acceptance baseline now.

## Risks and controls

| ID | Risk | Consequence | Control | Status |
|---|---|---|---|---|
| R-001 | Claude-derived hooks may not intercept Codex PowerShell | Approval boundaries might lack expected runtime hook enforcement | Treat Rule 7 as binding; no global hook edits, dangerous probes or denied-action workaround | Open, documented |
| R-002 | Next reloads env files after inherited variables are removed | Local tests could use live delivery/analytics | Explicit local dispatcher with zero external fallthrough; mode/flag mismatch fails before providers; synthetic env-file/stale-build tests | Contract defined, not implemented |
| R-003 | Current API has no durable production dedupe | Retries can duplicate notifications/records | Local durable preview only; production AC-06 blocked until approved persistent mechanism | Open S-005 |
| R-004 | Partial email/database/confirmation failures | Accepted leads lost to operations or duplicated on retry | Per-effect identity/recovery design; preserve primary success and test secondary failures | Open S-005 |
| R-005 | Console and provider errors log personal content | Data leakage into logs/evidence | Safe result codes and categories, synthetic fixtures, privacy tests | Planned S-002/S-005 |
| R-006 | Test wrapper skips missing suites or zero tests | False confidence / false passing claim | Strict manifest, self-tests, actual counts and independent verifier | Planned S-001 |
| R-007 | Vercel auto-deploys on unverified branch push | Unauthorized production deployment | Local-only work until trigger inspection | Open OD-03 |
| R-008 | Cost, service-response and monitoring claims lack proof | Misleading public offer | Approved omission rules and owner evidence gate | Ongoing content review |
| R-009 | Build/runtime flags differ or stale output reused | Analytics leakage / wrong provider / inconsistent preview | Isolated output and matching safe flags; stale-build test | Planned S-002 |
| R-010 | Local file created but incomplete/corrupt | False receipt or duplicate after crash | Complete flush/read validation; pending/unknown, no overwrite/takeover | Contract defined, tests pending |
| R-011 | Existing SEO branch ancestor/untracked work mixed into release | Lost work or unauthorized scope | Feature branch, selective staging, compare PR base and included commits before push | Ongoing |
| R-012 | Testing Node differs from production | Deployment regression | Record current production runtime before S-005/S-006; no silent runtime change | Open OD-03 |

## Limitations and acceptance scope

No application implementation, gate execution, release screenshot acceptance or safety certification has occurred during H-000. Local mocked/synthetic delivery does not certify external deliverability, production account mapping, privacy compliance or serverless duplicate control. Draft harness review is a planning review, not a substitute for required independent code/safety review after implementation. Model fallback is proposed, not silently accepted. Production release remains gated by SPEC and HARNESS open decisions.

D-013 — Implementation clarification: S-001 next dev compiles pages on demand. Exact Google font hosts already used by next/font may be read by that compiler, as during next build. Other external server hosts and all external browser traffic remain blocked. This does not authorize delivery or analytics. S-002 compiled preview disables font network after its build.

D-014 — Implementation clarification: local receipt publication uses an exclusive retained claim file, flushes/closes its completed contents, then publishes a hard link as the readable JSON receipt. Readers never accept the unflushed claim. An unpublished claim remains pending, without takeover. This implements C-03's exclusive durable receipt contract within the existing ignored local filesystem; no production persistence change.

## Publication approval and release preflight — 2026-09-14

Brian accepted the sitewide preview and explicitly requested publication ("this looks better. lets publish this"). This authorizes publishing the approved website once applicable release checks pass; it does not waive unresolved AC-06, authorize production SQL, or transfer the owner-only main-branch merge boundary.

Read-only Vercel browser inspection confirmed bsidenbergs-projects/florida-security-concepts, production branch main, current deployment G2o4WYrQCdPMR6cCq6gtVNKg7VGT, source 2182d1e3fc101fc81ca220ed5c2c081d5af57e1b, and www.floridasecurityconcepts.com. GitHub deployment metadata independently agrees. The connector still returns no teams, but authenticated browser access is available; missing hosting access is not the blocker.

Names-only Vercel inventory confirms all nine existing project variables are scoped to both Production and Preview: LEAD_DELIVERY_MODE, PRIME_ACCOUNT_SLUG, PRIME_SUPABASE_SERVICE_ROLE_KEY, PRIME_SUPABASE_URL, NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL, NEXT_PUBLIC_SITE_URL, LEAD_NOTIFICATION_FROM, LEAD_NOTIFICATION_TO, RESEND_API_KEY. No values were revealed. Configuration presence does not prove delivery or validity. A branch preview would inherit these live credentials; no push or external test submission performed.

Current local release candidate remains 4d481d2, machine-verified for S-UI-001 and accepted visually. Independent release safety review found current branch includes the new retry-enabled form/API and the still-open production duplicate-prevention requirement, not merely presentation. S-005/S-006 are not complete. Publication has not occurred. See evidence/release-readiness-20260914.md for the independent findings. Production persistence architecture and associated owner-only schema execution must be resolved under the approved harness before claiming full release readiness; deferred content improvements alone do not block a narrower visual release.

## AM-003 preparation — launch safeguards authorized, 2026-09-14

Brian selected finishing the new form's production safeguards before publishing, and requested the shortest path to launch. Current accepted visual/content scope is the launch candidate; S-003/S-004 broader content work is deferred and is not to be built unsolicited. Production permission persists subject to verification and owner-only boundaries. The production persistence mechanism is being specified from authoritative metadata before application changes. Any additive SQL will be a draft for Brian, never applied by an agent. No waiver of AC-06 or release QA is inferred.

Read-only Supabase list_tables metadata confirms public.leads has UUID primary key id, account_id foreign key, raw_payload JSONB and nonunique dedup_key; public.accounts has unique slug, status and website_domain. No FSC receipt/effect table appears in public. No customer records or credential values read. Reusing the general leads table as an in-flight email lock would alter its reporting meaning; a narrowly scoped separate coordination record is being proposed for review.

2026-09-14 owner routing instruction: all website form submissions must use Resend and email directly to info@floridasecurityconcepts.com. This explicitly authorizes that company notification destination; preserve existing verified sender identity. Do not infer authorization for a real test send, removal of Prime measurement, or a new customer-copy/privacy policy from the routing instruction alone.

2026-09-14 release dependency audit: npm audit --omit=dev reports five production dependency findings (one critical package, one high, three moderate). Raw report: evidence/S006-dependency-audit-20260914.json. Next.js 14.2.35 is affected by reported advisories; applicability and smallest supported patched version are being checked against primary sources before changes. No automatic npm audit fix or major-version jump executed. This is a real release-readiness finding, separate from receipt storage; ordinary security repair remains within Brian's request, with architecture changes recorded before implementation.

D-015 / 2026-09-14 — Security repair within existing architecture: execute S-SEC-001 to patch the current Next/React/PostCSS/Resend dependency graph based on independent primary-source findings. Preserve App Router, content routes, providers, data contracts and approved visual behavior. Necessary async parameter/React typing adaptations are compatibility repairs, not new product features or a framework replacement. Package changes are explicitly scoped in the session before code; no production change is authorized until the overall release gate clears. Pending AM-003 storage/privacy choice remains independent.

D-016 / 2026-09-14 — S-SEC-001 first gate preserved: 96 unit, 11 gate and 83 browser tests passed but the gate correctly exited 1 on a forbidden server network marker. Builder traced Next 15 development hot-reloader's unconditional npm registry version check. Browser global setup will launch the already-approved compiled local preview instead of development mode. This uses the actual release build and retains all network guards/provider isolation; no host allowlist expansion, ignored marker or private test-mode bypass. The extra isolated compile is part of browser startup. Test assertions/floor unchanged. Independent review and full gate rerun required.
