# SPEC — Florida Security Concepts website improvement

Tier: **3 — customer-facing production website**

Status: **APPROVED BY BRIAN — 2026-09-11**

Prepared: 2026-09-11

Authority: Brian's website request, subsequent business answers, and explicit approval on 2026-09-11. This authorizes harness planning for the redesign; implementation additionally requires the completed harness approval. Production deployment, vendor spending, and live communications remain separately gated.

## 1. Objective and confirmed business direction

Make it immediately clear that FSC provides gate and access-control maintenance, service, emergency repairs, retrofits, and new installations for HOAs, property managers, and community association managers (CAMs). Generate more qualified conversations that can become preventive-maintenance contracts.

Brian confirmed:

- HOAs, property managers, and CAMs are the primary audience.
- Preventive-maintenance contracts already exist and are the principal growth objective. Detailed inclusions, SOPs, reporting practices, and case handling are still being developed. Do not invent them.
- Orlando is the preferred market. Tampa is also served. Existing location URLs should survive; detailed territory boundaries are not newly guaranteed by the redesign.
- Property assessments are free. A form requests an assessment; it does not book an appointment.
- Keep the existing 24/7 emergency-service message. This is owner-directed content, not independently verified staffing or an arrival-time guarantee.
- Communication and technical competence should be apparent throughout the website. No fixed update cadence, dedicated-manager promise, or response SLA has been confirmed.
- No publishable project photos, reviews, case studies, credentials, or customer logos are available for this release. Omit proof sections that depend on those assets.
- Sentinel monitoring remains R&D. The monitoring-kit PDF is planning background, not evidence of an operating service, approved pricing, universal compatibility, predictive accuracy, or permission to procure/build hardware.
- Keep this project focused on a clear, useful website; do not turn discovery into the design of FSC's operating procedures.

### Business hypotheses and measurement

“10x better” is a design ambition, not a claim or numerical forecast.

1. Naming the audience and four main service needs above the fold will improve service recognition and qualified assessment requests.
2. Making maintenance easier to find will increase the share of qualified inquiries about recurring service.
3. Separating urgent calls from assessment requests will reduce misrouted inquiries.
4. A shorter initial form and explicit next step will reduce abandonment without sacrificing territory and service qualification.

Primary business measures: qualified inquiries, assessments actually scheduled, maintenance proposals, and signed maintenance contracts. Secondary measures: assessment CTA clicks, form starts, accepted requests, and emergency call clicks. A click is not a completed call; an accepted form is not a qualified lead or a booked assessment.

Establish a 28-day baseline where historical data exists, or start a prospective baseline before launch. Compare equivalent 28-day periods, recording traffic source, campaign changes, seasonality, sample size, qualified rate, and raw counts. Do not promise a percentage uplift without sufficient live evidence. No new CRM or reporting dashboard is included. Business outcome counts may initially be supplied manually by the lead owner without exporting personal information to analytics.

## 2. Ground truth and prioritized problems

See [discovery record](evidence/website-discovery.md) for source references, tool results, and limitations. This is an inspection, not acceptance evidence.

| Priority | Finding | Required response |
|---|---|---|
| P0 | HARNESS and session ledger are blank templates | Approve this spec, then fill the Tier 3 harness before implementation |
| P0 | Delivery modes exist, but production configuration and recipient receipt are unverified | Isolate development delivery; verify production readiness before any launch |
| P0 | Client-navigation from Contact to emergency intake changed the heading but left urgency unselected | Test and repair URL-to-form synchronization without losing user-entered contact details |
| P0 | Console mode accepts production leads while logging personal fields; webhook failures can log remote response content | Fail closed for unsafe production configuration; redact logs and provider errors |
| P0 | No server-enforced request idempotency was found; busy-button prevention is insufficient | Define and verify retry/duplicate semantics before accepting the vertical slice |
| P1 | Homepage foregrounds a broad technical catalogue and gives audiences similar prominence | Lead with HOA/CAM service needs and maintenance |
| P1 | No dedicated maintenance service page exists | Add one page describing the existing offer without invented packages |
| P1 | Mobile brand name is hidden and its icon-only home link has no accessible name in the observed tree | Keep recognizable branding and an accessible home-link name |
| P1 | Mobile contact information cards precede the long form; urgent help is buried behind content | Put the urgent call action at the top and the assessment form immediately after its brief introduction |
| P1 | Same-day response, rapid investigation, and operational claims exceed the confirmed facts | Remove unsubstantiated time/performance promises; retain owner-directed 24/7 availability only |
| P1 | Plausible loads live, but the implemented event measures only successful submission | Add a privacy-safe funnel; distinguish lead acceptance from downstream qualification |
| P1 | Existing URLs, cost education, metadata, schema, and resources carry useful search value | Preserve route inventory, improve content, and document any approved redirects |
| P2 | Strong dark visual treatment exists, but long copy and repeated cards obscure hierarchy | Simplify type, spacing, section order, and service navigation |

### Capabilities: implemented vs configured vs verified

| Capability | Implemented | Configuration evidence | Verification status |
|---|---|---|---|
| Next.js App Router website | Yes; Next.js 14, React, TypeScript, Tailwind | Local dependencies installed | Live pages inspected; lint/typecheck completed; local server starts |
| Lead validation | Server-side validation, honeypot, field limits, JSON checks | In source | Empty local request returned 400; synthetic valid request reached console receipt and confirmation; full matrix pending |
| Email notifications | Resend company notification plus best-effort customer copy | Required variable names documented | Production configuration and inbox receipt unknown |
| Prime lead recording | Optional Supabase adapter and email-plus-database mode | Source maps leads to FSC account | Production tenant, access controls, and writes not tested |
| Webhook delivery | Optional adapter, eight-second timeout | No destination inspected | Unknown; no calls made |
| Analytics | Plausible provider and Lead Submitted event | Script observed in live DOM | Dashboard receipt, history, and outcome reporting unknown |
| Search metadata | Canonicals, sitemap, robots, JSON-LD, social metadata | Live homepage canonical and one H1 observed | Full route and structured-data validation pending |
| Verification | PowerShell wrapper and untracked CI workflow | No test or end-to-end scripts in package.json | No session gate pass claimed |

Preserve the existing architecture. Do not introduce a new framework, CMS, monitoring system, CRM, database provider, paid analytics service, or customer account system.

## 3. Positioning, language, and conversion strategy

Proposed homepage opening:

> **Gate and access-control service for HOAs and property managers.**
>
> Preventive maintenance, repairs, 24/7 emergency service, and new installations in Orlando and Tampa. Tell us what your community needs, and request a free property assessment.

Primary CTA: **Request a Free Property Assessment**. Supporting note: **Send a request. We'll contact you to discuss your property and arrange the next step.** This is proposed customer-facing language for Brian's review, not an invented timed process.

Separate urgent CTA: **24/7 Emergency Service — Call FSC**. On mobile, show the phone action without opening the menu. Never make a form submission appear to dispatch a technician automatically.

Use concrete service descriptions and common situations to demonstrate competence: a gate that stops working, unreliable entry access, aging equipment, recurring faults, and a community planning replacement. Explain gates, operators, credentials, entry equipment, and supporting systems in plain language. Do not claim that every issue is preventable or every brand can be supported.

Communication positioning: clear explanations of service options and next steps, approachable contact paths, and concise copy. Do not publish a communication SLA, routine photo-report promise, dedicated contact, training package, warranty, or guarantee until separately confirmed.

Maintenance leads the commercial journey; urgent repair remains prominent. Installations and retrofits remain credible stand-alone services. Cameras and integration remain supported secondary topics, without Sentinel or remote-guarding claims.

## 4. Sitemap and page requirements

Preserve every existing canonical content URL. Add only `/services/preventive-maintenance` as a proposed page in this release. No redirects are currently proposed. Existing top-level route groups remain authoritative.

Navigation: **Maintenance**, **Services**, **HOAs & Property Managers**, **Service Areas**, **Resources**, plus assessment and emergency actions. The audience navigation can point to `/industries/property-managers`; `/industries` remains accessible through service and footer links.

| Page or group | Required content and next action |
|---|---|
| `/` | Audience-specific hero; four service needs; maintenance emphasis; existing-equipment vs new-installation choices; brief communication approach; Orlando/Tampa coverage; concise FAQs; free assessment CTA; separate urgent call action |
| `/services/preventive-maintenance` (new) | Existing maintenance offer; who it fits; issues prompting a maintenance conversation; how equipment and usage affect scope; request a free assessment. No package tiers, frequencies, included parts, discounts, or pricing without evidence |
| `/services` | Organize maintenance, repairs/emergency, retrofits, and installations first; link all existing services; make cameras/integration secondary |
| `/services/security-gate-systems` | New gates, replacement decisions, site constraints and infrastructure considerations; explain what information helps scope a project; link cost guide and assessment |
| `/services/gate-automation` | Existing gate/operator issues, automation upgrades, repair vs replacement questions; avoid universal retrofit compatibility |
| `/services/access-control` | Resident/visitor/vendor entry needs, entry-device options, existing-system review, administrative handover questions; no unverified migration guarantee |
| `/services/emergency-service` | 24/7 call action first; ordinary equipment-outage examples; form as alternate contact; submission is not dispatch; no ETA or charge amounts |
| `/services/video-surveillance` | What customers need to see and review, existing-camera concerns, equipment scope; no active Sentinel monitoring or guaranteed identification claims |
| `/services/security-system-integration` | Explain coordination among existing gates, credentials, entry equipment and cameras; compatibility assessed per property; remove guaranteed unified timelines or investigation-time savings |
| `/industries/hoa-gated-communities` | Board and community concerns: recurring gate issues, resident access, maintenance planning, replacements; link maintenance, access control and assessment |
| `/industries/property-managers` | Explicitly name CAMs; clear options for one property or portfolios; maintenance/service/install paths; useful preparation checklist; no assigned-account-manager claim |
| Other existing industry pages | Preserve URLs; retain meaningful audience-specific needs for multifamily, storage, commercial, industrial and estates; lower homepage prominence; no mass-generated repetitive text |
| `/service-areas` and existing area pages | Orlando first and Tampa second; preserve all 14 existing city URLs; request coverage confirmation for a specific property where boundaries are uncertain; no invented offices or arrival radius |
| `/resources` and five existing articles | Make gate-cost guidance and the property-manager checklist easier to discover; preserve URLs and useful detail; validate numerical claims before changing or republishing them as current prices |
| `/contact` | Short assessment intro, free status, six required fields, optional details, useful errors and confirmation; urgent call option; context-aware prefills |

Every service page must answer: what FSC does, who it helps, what problem prompts contact, what affects scope, and the next step. Industry pages must add relevant concerns rather than simply swapping audience names.

Onboarding, training, handover and service expectations: address these as **items to discuss when scoping the work**, not included deliverables. A future confirmed SOP can replace this wording without redesigning the site.

## 5. Visual direction

Retain FSC's blue/navy identity and existing type family unless technical validation requires an equivalent substitution. Use a restrained navy hero, clear blue primary actions, and lighter reading surfaces where they improve contrast and scanning. Reserve amber for urgent-service cues; remove decorative urgency pulses.

No real photography is available. Use clean typography, whitespace, simple line icons, and an abstract illustration of community entry equipment. Illustrations must read as illustrations, never as photographs of FSC projects or a live monitoring dashboard. Do not manufacture customer logos, certification badges, ratings, employee portraits, or stock “security guard” imagery.

Keep paragraphs short, avoid all-caps body text and excessive monospace labels, and limit repeated card grids. Show the company name on phones. Core service choices and the main CTA must be visible within the first mobile screen at 390 × 844 without a full-screen decorative hero.

No autoplay, parallax, unnecessary animation, intrusive popups, newsletter gates, or chat widgets. Respect reduced-motion preferences.

## 6. Assessment and emergency flows

### Assessment form

Proposed initial required fields: name, email, phone, property type, city/area, and service need. Keeping both contact channels preserves current delivery compatibility; reducing to one is a separate future experiment. Optional company/community name, timing and message appear under “Add details.” No street address, budget, login, file upload, or mandatory message.

Service options must include maintenance, repair, new installation, retrofit/upgrade, access control, surveillance/integration, and not sure. Maintain a documented mapping to the existing lead contract. Preserve existing service/industry/location query links and accepted legacy labels. Timing is optional and explicitly stored as “Not specified” when omitted; never silently label an unknown request urgent.

Validation: identical client/server rules; Unicode names allowed; email checked without assuming deliverability; phone normalization requires 7–15 digits with an optional extension; name/short fields capped at 200 characters, message at 2,000; request body limited to 32 KiB. Reject over-limit input with a field error rather than silently truncating meaningful content. City permits a named area outside the predefined list. “Other” must not discard the typed area. No automatic rejection solely for an unrecognized town.

| State | Required behavior |
|---|---|
| Empty / initial | Visible labels, required indicators, free-assessment note, no preset property type inferred from being a manager |
| Valid entry | Preserve entered values; no request sent before explicit submit |
| Invalid input | No provider calls; field errors linked to controls; focus error summary and link to first invalid field; retain valid input |
| Submitting | Immediate busy label; prevent concurrent clicks and keyboard submits; announce status |
| Delivered | Show “Request received”; explain that an assessment is not yet booked; provide phone contact; show no fake appointment, ETA, or promise of emailed confirmation |
| Known provider/configuration failure | No success UI or success analytics; safe retry message and direct contact; preserve values |
| Network timeout / lost response | Say receipt could not be confirmed; allow an explicit retry using the same request identifier; no automatic repeated send |
| Duplicate / retry | One logical request produces at most one company notification and one intended lead record within the supported 24-hour retry window; return the original receipt for an unchanged retry |
| Changed data after attempted submit | Treat as a new logical request with a new identifier; do not suppress a genuinely different request from the same person |
| Malformed / oversized / unsupported request | Controlled 400/413/415 response with no provider call; enforce the body limit on bytes rather than character count, before unbounded buffering |
| Abuse / honeypot / rate limit | Controlled rejection and safe feedback; no sensitive diagnostic disclosure; account for shared HOA networks when selecting limits |
| Reload / back navigation | No accidental resubmission; no persistence of contact details in URL or browser storage |

The API retains the `/api/leads` endpoint and a compatible `ok/error/fields/message` response envelope. A request/receipt identifier may be added. Define the exact schema, timeout budget, anti-abuse limits and durable duplicate mechanism in the approved harness before code. In-memory deduplication alone is insufficient across serverless instances. Any schema or architecture addition requires a formal harness amendment and approval where material; this spec does not silently authorize it.

### Emergency journey

Provide the existing public phone number as an explicit `tel:` action on the hero/header mobile path, emergency page and contact page. Inspect the link target without placing a call during tests.

The alternate emergency form uses the same endpoint, with emergency context visibly selected. Direct URL entry, in-app navigation from Contact, browser back/forward, and changing query parameters must agree with the actual submitted values. Preserve typed contact fields when switching context. Heading, submit label and urgency must never disagree. If a visitor explicitly switches to a routine request, remove the emergency presentation.

Confirmation must say the request was received, not that a technician has been dispatched. Display the phone option for urgent assistance. Do not imply a free emergency visit because the property assessment is free.

### Delivery and development isolation

Preserve the current provider choices until production configuration is established. Company-notification acceptance is the primary success condition in email modes. Customer confirmation failure must not provoke a duplicate company notification. In combined mode, email success plus secondary database failure must remain visible to operators and recoverable through an approved process; never describe it as full delivery.

The first vertical slice must use synthetic fixtures and a local/test receipt sink, with all live email/webhook/Prime writes disabled and analytics disabled. Receipt evidence must prove the server handled the submitted fields; a client-side success mock is insufficient. Test primary failure, secondary failure, retry and duplicate cases with controlled adapters. Do not use production database credentials or send real test emails merely because a preview environment exists.

Production console-only success is unacceptable. Unexpected exceptions, unsafe webhook transport, raw provider response logging, and personal-data logging must be addressed in the form-safety session. Provider timeout and recovery behavior must be testable.

## 7. Accessibility, mobile, SEO and performance

Target WCAG 2.2 AA across the complete journeys, with automated checks plus manual keyboard and screen-reader review. Visible focus, accessible home/menu names, landmark hierarchy, skip link, labels, associated errors, status announcements and non-color error cues are mandatory. Menu must support Escape and return focus appropriately. Normal text contrast ≥4.5:1; large text and essential UI boundaries ≥3:1. Prefer 44 × 44 CSS-pixel touch areas for primary controls. No hidden focus behind sticky actions.

Test widths 320, 390, 768, 1024 and 1440 CSS pixels, portrait and landscape, 200% zoom and reflow equivalent to 400% zoom. No horizontal page scrolling, clipped form errors or overlapping CTAs. Test current Chromium, Firefox, Safari/WebKit, plus a real phone where available; report emulation separately from real-device evidence.

SEO: preserve the existing 38 canonical content routes (six top-level, six services, seven industries, fourteen areas, five resources); add the proposed maintenance page. Preserve query-prefill entry paths. Unique titles/descriptions and one descriptive H1 per page; canonicalize contact query variants to `/contact`; keep www host consistent across metadata, sitemap and schema. Keep unknown fields out of LocalBusiness data. Never emit fabricated ratings, reviews, addresses or credentials. Use real content revision dates, not an artificial “updated today.” Verify all existing inbound paths return intended pages, not soft 404s. Preview environments must be excluded from indexing without changing production indexability.

Performance release target: median of three repeatable Lighthouse mobile runs on the built preview: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥95, plus no unresolved critical/serious automated accessibility findings. These scores are targets, not current measurements or proof of WCAG compliance. Record tool version, device/network settings, URL and build.

Field goals where sufficient data exists: 75th-percentile LCP ≤2.5 seconds, INP ≤200 milliseconds and CLS ≤0.1. Do not use local dev cold compilation as a production-performance baseline. Avoid unnecessary scripts, size visual assets, reserve their layout space, and review font loading. Existing build-time Google font fetching needs a reproducible environment or approved equivalent before the gate.

References: [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [Core Web Vitals](https://web.dev/articles/vitals).

## 8. Privacy, data and analytics

FSC owns inquiry records; authorized lead-handling staff may access them through the existing approved delivery system. No public administration interface or customer account is added. Production recipient identity, backup owner, permissions, retention and privacy wording remain explicit launch prerequisites, not guessed SOPs.

Collect only contact and scoping data. No resident lists, access codes, credentials, camera footage, security diagrams or document uploads. Add a brief instruction not to include access codes or other sensitive information. Do not add marketing consent, mailing lists, tracking pixels, session replay or new advertising tools. Any new privacy/retention policy must be approved by Brian before publication; the technical plan cannot invent legal terms.

Custom analytics properties are strictly allowlisted categorical values: page template, CTA placement, service category, normalized property category, region (Orlando/Tampa/other/unknown), urgency category, error class. Never send names, phone numbers, email, company, free text, precise address, form field contents, request IDs, full referrers or unvalidated query strings. Sanitize pageview URLs and campaign attribution; “anonymous analytics” does not make arbitrary URL strings safe.

| Event | Trigger | Counting rule |
|---|---|---|
| assessment_cta_click | Explicit primary CTA activation | Placement/category only |
| assessment_form_start | First user interaction | Once per form view; no entered value |
| assessment_submit_attempt | Valid explicit submit | Separate from success |
| assessment_validation_error | Validation blocks submission | Error class/field category only |
| assessment_delivery_error | Failed or unconfirmed receipt | Safe failure category only |
| Lead Submitted | Confirmed primary acceptance | Preserve existing event name; once per logical request |
| emergency_call_click | Emergency phone action | Click only, not claimed call completion |
| maintenance_interest_click | Maintenance page/assessment CTA | Does not imply qualification or contract |

Analytics failure must not fail a lead. Verify event collection in an isolated test property or intercepted network test before enabling production events. Keep preview traffic out of production reports. No personal identifiers should be used to join analytics to CRM data; use aggregate business counts.

## 9. Staged plan and first vertical slice

This is the proposed session sequence, not a filled or approved harness.

| Stage | Deliverable | Gate |
|---|---|---|
| Spec review | This document, discovery record, explicit decisions/dependencies | Brian approves written SPEC |
| Harness | Tier 3 architecture, agent roster, contracts, permitted files, environment inventory, session packets, verification commands, decisions and evidence policy | No material implementation before relevant sections are defined |
| S-001: first slice | Homepage → assessment → real safe development receipt → truthful confirmation; mobile/keyboard behavior and failure states included | Independent review; session verification raw log; screenshots; Brian preview approval |
| S-002: service content | Maintenance page; services and priority audience pages; emergency call-first journey; no new business packages | S-001 preview accepted; content/route tests and independent review |
| S-003: remaining site | Existing industry/location/resource pages, navigation, truthful SEO/schema, responsive polish | Route regression, accessibility and content review |
| S-004: integration and release readiness | Provider configuration verification, analytics isolation, privacy approval, repeatable performance and cross-browser evidence | No production changes; gated PR and deployment plan |
| Production | Owner-approved deployment and separately approved live verification | Brian alone authorizes release and merge |

Use feature branches; preserve existing local work and the pre-existing local SEO commit. Do not push until branch deployment triggers are known. Do not bundle unrelated untracked templates or PDF render artifacts into a website PR. Select the PR base only after reconciling the existing SEO branch and main so prior work is neither lost nor silently shipped.

Harness specialist responsibilities: orchestrator coordinates; scout establishes disk state; builder implements only approved contracts; test-guard tests real behavior; independent verifier runs `scripts/verify.ps1 -SessionId S-XXX`; independent reviewer and safety reviewer inspect Tier 3/data-touching work. No self-certified completion. Capture handoffs in the session ledger. Follow the requested specialist/model policy only where the corresponding model is available; never silently claim a substituted model meets it.

Current verification wrapper internally invokes cmd, contrary to the PowerShell-only convention, and skips missing test scripts. The harness stage must define a PowerShell-native, fail-closed session gate with required test coverage and reproducible raw evidence before any session can be accepted. Do not count the current lint/typecheck checks as that gate.

### Preview presented to Brian

Open the local or isolated preview homepage; identify the audience and services; request an assessment with clearly synthetic details; inspect the development receipt; verify the confirmation does not imply booking. Repeat at phone width, with keyboard navigation, with invalid input, and with a simulated delivery failure. Show emergency phone placement without placing a call. Present screenshots, raw verification log, what changed and any limitations. Stop before broad build-out until Brian accepts the direction.

## 10. Acceptance criteria

- AC-01: A reviewer unfamiliar with FSC can identify audience, maintenance/repair/emergency/install services, Orlando/Tampa coverage and free assessment within ten seconds. Target four of five representative reviewers when available; Brian's preview acceptance remains mandatory even if a panel is unavailable.
- AC-02: Homepage prioritizes maintenance and HOA/CAM relevance; all current secondary services remain discoverable in at most two navigation actions.
- AC-03: No fabricated proof or unconfirmed SOP, price, warranty, response-time, monitoring or compatibility claims appear in copy, metadata, schema, emails or illustrations.
- AC-04: Assessment form uses the agreed fields and consistent client/server validation; real safe server receipt matches submitted synthetic data.
- AC-05: Emergency heading, selected urgency, payload and confirmation stay consistent through direct entry and client navigation.
- AC-06: Failure, offline/unknown receipt, primary/secondary delivery failure and 24-hour duplicate/retry scenarios pass meaningful integration tests; no false success or duplicate company notification.
- AC-07: No live external delivery, production data mutation or production analytics occurs during development testing; production unsafe console mode is rejected.
- AC-08: Mobile, keyboard, screen-reader and automated accessibility evidence satisfy section 7; brand/home link is named; urgent phone option is visible without menu expansion.
- AC-09: All 38 existing canonical routes survive; the new maintenance route is tested; canonical/schema/sitemap/robots checks and query-prefill regressions pass.
- AC-10: Analytics capture only approved categorical properties and never change lead success behavior; claims about qualified leads and bookings use actual business counts.
- AC-11: Performance is measured with the stated method; targets or approved exceptions are evidenced, not asserted.
- AC-12: Every implemented session has the exit-zero raw verification log, required independent reviews, relevant screenshots, deviations and ledger handoff; preview approval precedes broad build-out.
- AC-13: A reviewable feature PR includes scope, evidence paths and preview instructions. No production deployment, merge, spending or live customer communication without explicit authorization.

## 11. Explicit dependencies and owner decisions

The draft is reviewable now. The following are not silently resolved by “continue.” They either have conservative proposed defaults for spec approval or are prerequisites for later launch.

| ID | Decision or dependency | Proposed handling | Needed by |
|---|---|---|---|
| O-01 | Exact maintenance inclusions, schedule, reports, training, warranties | Omit specific promises; offer a property-specific conversation | Approve this content boundary with spec |
| O-02 | Assessment duration, visit scope, deliverables and follow-up time | State free request and subsequent discussion only; no guaranteed written report or booked appointment | Approve this content boundary with spec |
| O-03 | Lead owner, backup, inbox routing and real receipt | Preserve current architecture; verify private configuration and named accountability before launch | Integration/release gate |
| O-04 | 24/7 coverage and emergency charges | Retain 24/7 per Brian; no fee amount or arrival promise; assess staffing privately before production release | Release readiness |
| O-05 | Existing resource price ranges | Preserve cost-guide URL and cost drivers; flag numerical ranges for evidence review before republishing as current guidance | Content/release gate |
| O-06 | Historical analytics and qualification baseline | Mark unavailable until dashboard/business records verified; do not invent baseline or uplift | Measurement plan / release |
| O-07 | Privacy disclosure, approved retention and data recipients | Draft only after actual routing is known; Brian approves before publication | Release gate |
| O-08 | Vercel account access, branch triggers and preview safety | No push until verified; local preview is the default | First push / external preview |
| O-09 | Detailed town coverage, project minimums and supported brands | Preserve URLs; invite property-specific confirmation; no new blanket exclusions or guarantees | Content approval |
| O-10 | Durable retry/idempotency mechanism and any data-contract changes | Resolve formally in harness; no improvised production schema changes | Before first-slice backend work |
| O-11 | Proposed field reduction, new maintenance page and visual direction | Included as explicit proposals in this written spec | Brian's spec approval |

Out of scope: Sentinel R&D, hardware purchasing, telemetry dashboards, predictive monitoring, remote control, pilot recruitment, new service packages, business SOP design, paid subscriptions, bookings/calendar integration, customer portals, pricing calculators, CRM replacement, resident-data migration, live email campaigns, legal-policy changes without approval, production SQL, deployments and merges.

## 12. Approval

**Brian approval: 2026-09-11**, recorded from his explicit approval of the written spec and direction to continue. This permits the next harness-planning step; it does not itself authorize production actions. Production dependencies remain gated. Later scope changes require recorded change control.
