# Florida Security Concepts — Project Harness

**Tier 3 — customer-facing production website**

Status: **APPROVED BY BRIAN — 2026-09-11** · Version 1.0 · Prepared 2026-09-11

Approval authority: Brian explicitly instructed “build the website as planned” and requested the local development version for review, in response to the consolidated harness approval question. AM-000/AM-001, local/test infrastructure and OD-01 separate Codex specialists are approved. Earlier proposal/pending language below is superseded by this record. S-001 and S-002 proceed through the local preview gate; production and later owner gates remain.

Authority: [approved SPEC](SPEC.md) and Brian's explicit build instruction. Existing application; replacing it with a golden-path template is not appropriate. Approval does not waive preview, production, security or spending gates.

## 1. Business intent

2026-09-14 approved amendment AM-002: Brian accepted the homepage direction and explicitly requested its colors/theme across all pages. Insert S-UI-001 before the remaining content sessions: carry the established navy heroes, light reading surfaces, typography, cards, buttons and spacing across every existing route. This is a presentation-only extension; preserve content, URLs, SEO and lead/provider contracts. No new service page or production change is part of this session. Its completed local preview is presented for review.

Make gate/access-control maintenance, repairs, 24/7 emergency service, retrofits and installations immediately clear to HOAs, property managers and CAMs. Orlando leads; Tampa remains supported. Qualified conversations and preventive-maintenance contracts are the business outcomes. Form submissions are not bookings or qualified leads.

Journey: understand offer → request free assessment → receive one confirmed server receipt → understand next step. Urgent service has a separate call action. No invented proof, SOPs, response times, free emergency visit, Sentinel availability, compatibility guarantees, maintenance inclusions or savings. SPEC AC-01–AC-13 controls release acceptance.

## 2. Architecture

### Existing system retained

- Next.js 14 App Router, React 18, TypeScript and Tailwind; content in data/; shared header/footer and server-rendered detail routes. No CMS or framework replacement.
- Existing Node-runtime POST /api/leads, shared validation, dispatcher and Resend/Prime Supabase/webhook adapters. No visitor login, customer portal or new administration endpoint.
- Prime owns the existing production schema outside this repo. No production SQL or schema invention. Any required schema change is drafted after authoritative inspection and separately approved.
- Provider/account identity is server-configured. Secrets never enter client bundles. Collect only contact/scoping details, never resident lists, access codes, camera footage or documents.
- Use source illustrations, typography and existing brand identity. No fabricated project photos, credentials or ratings. No AI runtime, payments, monitoring system, new paid service or background queue is introduced.
- Vercel remains hosting target. Exact Git triggers, deployed runtime and environment scoping remain unverified. Local loopback preview first; no push until OD-03 closes.
- Current local Node is 24.x. Proposed verification tooling uses Node 24.x locally and in CI without changing the production runtime. Pin compatible test dependencies after registry verification; do not upgrade Next.js as part of tooling setup.

### C-01 — input and legacy compatibility

Six required fields: fullName, phone, email, propertyType, service, city. Optional: company, urgency, message, contactMethod and allowlisted page context. Keeping both contact channels preserves existing email delivery compatibility. No automatic HOA classification or booking.

Names: trimmed Unicode, 2–200 characters. Email: trimmed/lowercased, max 200, structural validation only. Phone: 7–15 digits before an optional 1–6 digit extension, allowing ordinary formatting. Reject invalid types, arrays, overlong fields and letter-only phones. Short fields max 200; message max 2,000; body max 32 KiB UTF-8 bytes while streaming. Preserve ordinary punctuation and line breaks; escape HTML output. No silent truncation of meaningful content.

One shared option/validation contract must serve client, API and query mapping. Existing property labels remain. Service UI maps as follows:

| UI label | Wire value |
|---|---|
| Preventive maintenance | Maintenance / service |
| Repair / service | Repair / service (new) |
| New installation | New gate system |
| Retrofit / upgrade | Retrofit / upgrade (new) |
| Access control | Access control |
| Video surveillance | Video surveillance |
| System integration | Full security system integration |
| Not sure yet | Not sure yet |

Continue accepting legacy Gate automation and Emergency repair values. Timing retains Emergency, This week, This month, Planning / budgeting and adds Not specified when omitted. City accepts a named unlisted area; literal Other must prompt for the area. Unknown towns are not automatically rejected.

Existing first-party links retain their service/industry/location prefills. Missing-city legacy payloads receive a field error; before release confirm that no external caller depends on the old optional-city contract. Do not change tenant or recipient routing.

### C-02 — API and client state

Retain JSON POST /api/leads and backward-readable ok/message/error/fields envelope; add requestId and optional safe error code. New UI supplies a UUIDv4 logical request ID. Missing IDs from old callers may be server-assigned but cannot guarantee deduplication across attempts; all first-party forms must send IDs before release.

| Result | HTTP | Side effects |
|---|---|---|
| Confirmed primary receipt or unchanged accepted retry | 200 | Same receipt ID, no repeated delivery |
| Parse/validation/honeypot error | 400 | None |
| Body >32 KiB / unsupported content / method | 413 / 415 / 405 | None |
| Same ID with different payload, or still pending | 409 | Never overwrite or start second delivery |
| Rate limit | 429 + Retry-After | None |
| Unsafe config/known delivery failure | 503 | No false success |
| Ambiguous timeout | 504 | Receipt unknown; preserve ID for explicit retry |

Server delivery budget 15 seconds; client deadline 20 seconds. Adapters fit inside server budget. A noncritical customer copy must not convert known primary success into failure. Uncertain external outcomes are never described as safe-to-resend failures. Tests use fake clocks.

Client states: idle → validating → submitting → received, or invalid/failed/unknown. Disable concurrent submits. Keep input only in component memory on errors; no PII in URLs/storage. Unchanged retry keeps ID; changed input starts a new logical request. No automatic resends. Success states request received, not booked/dispatched/guaranteed emailed. Link and focus field errors; announce status and confirmation.

Emergency heading, urgency, button and payload agree through direct entry, client query changes, back/forward and explicit return to routine request. Preserve typed contact fields. Invalid slugs do not fabricate context. Analytics exceptions cannot change delivery UI.

### C-03 — proposed safe local receipt adapter

Use explicit local delivery mode only through a loopback launch script with FSC_LOCAL_PREVIEW=1. Persist synthetic receipts under ignored .fsc-local/receipts/, outside public/, source content, tracked evidence and .next/. No HTTP receipt listing or GET endpoint; use the local file viewer/read-only receipt helper. No production datastore is added.

The launcher binds 127.0.0.1, rejects hosting/deployment environment markers, removes live provider variables from its child without printing values, forces analytics off at build and runtime and uses isolated build output to avoid stale production config. It must not modify global/user environment. NODE_ENV=production alone is insufficient to distinguish a local compiled preview from a hosted production deployment; use the explicit local launch contract, non-hosted environment and loopback binding together, never Host headers alone. Local/console mode must fail on Vercel. Unsupported hosting remains outside this approved local contract.

Next.js can load environment files after the launcher sanitizes inherited variables. Therefore the local dispatcher must exclusively select the local adapter and must never fall through to external adapters regardless of credentials loaded later. Any mismatch between the explicit local flag and selected local mode fails before provider construction or delivery. Tests use synthetic inherited settings and synthetic environment-file fixtures, not actual secret files. Hosted markers checked before local delivery: VERCEL, VERCEL_ENV, VERCEL_TARGET_ENV, NETLIFY, RENDER and AWS_LAMBDA_FUNCTION_NAME. This is a loopback-only launch contract, not a generic hosted-preview mode. Browser and server-side test network guards additionally fail attempted live provider calls.

Preview is visibly labeled for synthetic data. Automated helpers accept fixture domains only, never real people. No PII in general logs. Synthetic receipt content is visible only locally and not blanket-committed.

Durable local duplicate protection: UUID → canonical normalized payload digest (excluding generated timestamp) → one exclusively created file. Validate UUID before path use. Return acceptance only after complete record flush and validation. Same digest replays original receipt; changed digest returns 409. Concurrent processes cannot create two receipts. Corrupt/partial record returns unknown/unavailable, never success; retries never overwrite it. Test process restart and cross-process concurrency. Receipt IDs remain tombstoned for the test dataset lifetime. Supported retry window is 24 hours; expired IDs are rejected with an explicit start-new-request action, never silently resent.

Canonical details: normalize UUIDv4 to lowercase after validation. SHA-256 fingerprint uses JSON with this fixed field order after C-01 normalization: fullName, phone, email, propertyType, service, city, company, urgency, contactMethod, message. Missing optional text serializes as an empty string; urgency defaults to Not specified and contactMethod to Email. Exclude requestId, server timestamps, route attribution, referrer and UTM values. A change to a user field changes the fingerprint; changing attribution alone does not. Store receipt ID, digest, normalized synthetic payload and server acceptedAt in the receipt. The persisted acceptedAt is the 24-hour clock origin; tests inject a clock only through test code, never a public request field. Readers of incomplete files return pending/unknown, never take over or overwrite; incomplete records require deliberate local test-dataset reset, not hidden delivery replay.

The local adapter's sole effect is the synthetic receipt. Tests may simulate company-send/database-write counts, but must label them simulations. This is real local server receipt, not proof of external inbox delivery or production serverless deduplication.

**AM-001 — proposed acceptance-sequencing amendment:** SPEC sections 2 (duplicate-protection priority), 6 (duplicate/delivery contract), 10 AC-06 and 11 O-10 originally place durable duplicate definition before first-slice acceptance. S-002 instead proves the durable local mechanism defined here and adapter contract simulations; production mechanism selection and global AC-06 move to S-005 and still block release. Harness approval must explicitly include this narrow sequencing amendment. Until then it is proposed, not an approved change to SPEC. Never mark the global requirement complete on mock evidence.

### C-04 — production retry and recovery gate

Current Resend calls have no idempotency keys; Prime inserts have no established uniqueness guarantee. Existing facilities must be inspected before choosing production storage. Required: stable per-effect IDs, durable concurrency claim, original receipt replay, 24-hour retry protection and recovery after ambiguous timeout or partial success. Email-success/Prime-failure cannot produce a second company email on retry. Customer-copy failure must not cause duplicate primary delivery.

Before S-005 code, inspect active provider mode and authoritative schema without fetching customer rows. Evaluate provider-supported idempotency and existing storage. If insufficient, present a formal amendment with schema, cost, retention, access and recovery effects. No implicit Redis, queue, new database or production schema authorization. S-001 and isolated S-002 may proceed after harness approval; S-005 and release cannot bypass this gate.

S-002 may implement shared C-01 validation, request-ID parsing/envelope additions, query synchronization, safe logging and fail-closed hosted console/local mode. Durable replay, 409 pending/conflict, 429 rate state and 504 receipt-unknown semantics are implemented for local mode there; production adapter semantics stay unchanged until S-005, apart from those explicit safety fixes. Existing primary-email success and best-effort secondary/customer-copy behavior is preserved. No shared timeout wrapper may turn a possibly accepted real send into a retryable failure before the production contract is resolved. S-002 is not releaseable by itself. ID-less legacy traffic is explicitly outside retry guarantees; S-005 must inventory callers and require IDs for all covered production requests or document an owner-approved compatibility amendment before claiming global AC-06.

### C-05 — security and abuse

Production console/local fallback and unknown configuration fail closed. No raw config values, external response bodies or personal details in errors/logs. External production webhooks require HTTPS; HTTP only for explicitly isolated loopback tests. Server logs use enumerated result codes and allowlisted categories, not city free text, raw referrers/query strings or provider errors.

Honeypot and size/field limits apply everywhere. Local/test rate policy: 20 new logical requests per source per ten minutes; existing-ID retries do not consume new-request quota. Source IP is held only in memory in local tests. Distributed production abuse identity/rate state and any retention are OD-06 decisions; do not invent an IP-retention policy or call an in-process limiter sufficient for serverless production. Shared HOA networks must be considered. Never weaken provider auth or existing security controls.

### C-06 — content, analytics and SEO

SPEC controls language, event names, categorical property allowlist and all 38 existing canonical routes. Preserve Lead Submitted, counting once on known primary acceptance. Local preview blocks analytics entirely. No request identifiers, full URLs, arbitrary UTMs, free text or contact fields in analytics. S-006 intercepts requests and verifies sanitized payloads before any live configuration.

S-003 adds the maintenance route. Until then Maintenance links to the homepage maintenance section, not a dead future URL. First-slice shared header/footer/style changes may reflow other pages but do not authorize broad content edits. Noindex local/preview output without changing production canonical/indexability. Costs remain flagged for substantiation; preserve route and cost-driver education. Retain real revision dates. No fake schema ratings/credentials/addresses.

## 3. Repository authority and ownership

Repository bsidenberg/florida-security-concepts; root C:\Python\florida-security-concepts. Active branch codex/website-spec retains pre-existing SEO work. Main and PR merge belong to Brian. Determine PR base after branch comparison; never silently bundle prior changes.

Authoritative requirements: SPEC; contracts and scope: HARNESS/SESSIONS; environment names: ENVIRONMENT; decisions/handoffs: DECISIONS/ledger. Builder owns application code, test-guard tests, orchestrator docs. Per-session paths are explicit. Agents share the checkout and must preserve others' work.

Generated dependencies, build caches, coverage, local receipts and PDF scratch renders are not source; ignore and selectively collect synthetic evidence. Never blanket-stage pre-existing templates or unrelated files. Protected boundaries: provider/account/data contracts, verification gate, deployment rules, security/privacy require recorded amendment for material changes. Global Codex/Claude config and external database schemas are outside implementation scope.

## 4. Approval and security boundaries

Rule 7 applies regardless of Claude-hook execution in Codex. No dangerous enforcement probes or global hook/permission changes. Respect sandbox escalation and any denial; no workaround. No secrets in prompts/files/logs/evidence. Private validation reports only names and presence through an approved method; do not open secret files.

No production data changes, paid services, account creation, live communications, production deploys, security weakening, history rewrite or merges. Read-only deployment metadata is allowed. Independent review is required for every Tier 3 session and safety review for lead data/logging/isolation/production delivery. Builder is never its own verifier.

Requested Opus/Fable/Sonnet names are not callable here. Brian approved OD-01: current Codex specialists with separate independent roles for implementation and safety review. They are not represented as the unavailable models.

## 5. Verification contract

S-001 first establishes an honest gate on the existing site. D-002 records this foundation inserted before the SPEC's first slice, rather than silently renumbering the approved plan.

Command: pwsh -NoProfile -File scripts/verify.ps1 -SessionId S-001 (or registered later ID). Only the verifier supplies an acceptance gate verdict from raw output. Fail on unknown session, absent required scripts, zero tests, skipped required suites, failed commands, missing build output or absent evidence.

Proposed tooling: Vitest unit/contract tests; Playwright and axe-core browser/a11y tests. Resolve compatible versions against the registry during S-001, pin dev dependencies and lockfile, record versions; no framework upgrade or paid account. Use Node 24.x for local/CI tests without silently changing production Node.

PowerShell-native runner invokes Node CLIs with argument arrays; no cmd /c, Bash, shell-string eval or --if-present. Use npm's JS entry or package CLIs where command wrappers would invoke another shell; configure lifecycle execution consistently. Capture stdout/stderr, each exit code, revision/dirty-file list and exact commands in a unique millisecond-plus-run-ID raw log. Preserve failed logs. No agent summary substituted for machine output.

Required script contract: lint, typecheck, test:unit, build, test:e2e, test:gate; S-006 adds test:release. SESSIONS assigns meaningful tests. Gate itself is tested against temporary fixture projects: missing suite, unknown session, zero tests, failing child and successful raw log. Expected failing fixtures must not mask real session failures.

Serialize build/start/test to avoid output-directory races. Isolate loopback servers, dataset/build directories and browser external traffic. Stop only processes started by the gate. Use matching safe build/runtime flags; do not inherit live provider credentials. CI eventually runs the same PowerShell gate on feature pushes/PRs with always-uploaded evidence. A passing CI does not imply Vercel deployment was blocked or authorized.

Each accepted session requires raw log, test counts/reports, independent code review, safety review where applicable, handoff and deviations. Human-visible slices require screenshots at 390 and 1440, keyboard evidence and responsive checks. Global SPEC cross-browser/a11y/performance matrix remains S-006; do not claim local slice acceptance means full release acceptance.

## 6. Sessions and Brian's remaining involvement

| Session | Outcome | Dependency | Brian's gate |
|---|---|---|---|
| H-000 | Harness and adversarial review | Approved spec | Harness approval and model alternative |
| S-001 | PowerShell verification foundation | H-000 approved | None |
| S-002 | Homepage → assessment → local durable receipt → confirmation | S-001 accepted | Preview acceptance; stop before broad build-out |
| S-003 | Maintenance/services/priority audience content | S-002 preview accepted | None for in-scope work |
| S-004 | Remaining industry/area/resource content and SEO | S-003 accepted | Unsupported numerical claims only |
| S-005 | Production delivery design, contracts and isolated tests | S-002 accepted; required production contract/privacy decisions under OD-02/03/05/06 resolved before code | Material architecture/schema/routing/privacy decisions; publication approval and real receipt checks remain release gates |
| S-006 | Analytics, complete QA/performance and PR readiness | S-004/S-005 accepted | Final acceptance; separate deploy/merge approval |

S-005 read-only research may proceed while content sessions run after preview, but cannot silently introduce production storage. No credentials or hardware needed for S-001/S-002. ENVIRONMENT groups later inputs into one batch.

## 7. Open owner decisions

| ID | Decision | Recommended default | Blocks |
|---|---|---|---|
| OD-01 | Named Opus/Fable/Sonnet models unavailable | Current Codex model, separate builder/test-guard/verifier/independent safety roles; alternatively provide requested environment | Implementation and safety-role routing |
| OD-02 | Active production mode, owner/backup/recipients, recovery and retention | Verify existing private configuration, preserve architecture, amend only where required | S-005 and live tests/release |
| OD-03 | Vercel visibility, exact branch triggers and safe previews | Continue locally; no push until verified | First push/external preview/release |
| OD-04 | Cost ranges and specific territory/SOP claims unsubstantiated | Preserve educational drivers/URLs; omit new specific promises; review changes to existing numerical guidance | Affected S-004 content/release |
| OD-05 | Privacy disclosure and retention | Draft from verified data flow; Brian approves before publication | S-005/S-006 release |
| OD-06 | Durable production duplicate and abuse state | Existing provider/storage first; formal amendment if insufficient, including privacy/access/cost | S-005 implementation/global AC-06 |

24/7 wording, free assessment and absence of fabricated proof are already approved; do not re-ask. No new SOP interrogation is required for local preview.

## 8. Amendment and approval record

| Date | Version | Change | Approval |
|---|---|---|---|
| 2026-09-11 | 1.0 approved | SPEC mapped to sessions; verification foundation inserted; isolated durable local receipt approved; production retry remains gated | Brian explicitly requested build as planned and local review version |

Harness approval: **APPROVED — 2026-09-11**. OD-01 resolved. Execute S-001 and S-002 autonomously, repair routine failures and present the preview. No repeated approvals for in-scope tests, dependencies or reversible fixes.
