# Website discovery record — 2026-09-11

Status: inspection evidence and limitations supporting the draft SPEC. **Not a session acceptance log, not a production delivery certification, and not a passing verify.ps1 claim.**

## Repository and safeguards

- Inspected repository root, package scripts, routing/data/components, lead endpoint/providers, deployment documentation, harness templates, verification script and CI workflow before authoring the spec.
- Starting branch: `seo/audit-execution`, one local commit ahead of its tracking branch. Existing untracked `.github/`, `harness/` and `scripts/` were preserved. Prior local commit: `3d6c3fd`, existing SEO work. No implementation edits were made during discovery.
- Created local branch `codex/website-spec` from the existing checkout to preserve that work. No push, merge, production deployment or live inquiry was performed.
- `tmp/pdfs/sentinel-review/` contains six rendered pages from the owner-supplied monitoring PDF. These are scratch files produced by this task, not application assets or intended PR contents.
- GitHub repo access confirmed with ADMIN viewer permission; default branch is main. Initial Git global-ignore and GitHub CLI config access failures disappeared for the same read-only checks outside the sandbox. No ownership configuration or filesystem ACLs changed; no safe.directory workaround used.
- Repository `.claude/settings.json` contains Claude Bash allow rules. User-level `.codex/hooks.json` exists but matches `Bash` and points at `.claude/hooks/` scripts. This does not establish interception of Codex's PowerShell/exec tool. Hook files exist; runtime enforcement was not probed with dangerous commands. Approval boundaries remain in force independently.
- `HARNESS.md`, `SESSIONS.md`, `DECISIONS.md`, `ENVIRONMENT.md`, agent roster and evidence README are templates. They were not filled as an approved harness during spec discovery.
- `scripts/verify.ps1` dispatches through `cmd /c`, uses minute-granularity log names with append, and runs only package scripts that exist. The current package lacks test/e2e scripts. The CI workflow uses `--if-present` and does not invoke the session gate or archive its raw logs. Its comment says every push, but triggers are pushes to main/master and pull requests.
- The verification wrapper was inspected, not run: the PowerShell-only convention and missing behavioral test floor must be reconciled in harness planning. No accepted session is claimed.

## Local development

- Node 24.16.0 and npm 11.13.0 available. Existing deployment document describes Node 20; actual Vercel runtime remains unknown.
- `npm run lint`: reported “No ESLint warnings or errors.”
- `npx tsc --noEmit --incremental false`: completed without diagnostics; combined command exited zero. These are discovery checks, not a saved raw session gate.
- Local dev server launched on loopback port 3100 with explicit `LEAD_DELIVERY_MODE=console`, empty public analytics script configuration and Next telemetry disabled. Only `.env.example` was found by filename listing; secret files were not read.
- Initial homepage browser navigation timed out while Google font fetching encountered sandbox EACCES. Server subsequently compiled with fallback fonts and returned homepage HTTP 200. Stopped that server and restarted the same safe local configuration with approved execution outside the sandbox; homepage reload and rendered navigation were observed.
- No dependency upgrade, application repair or architectural change was made to make these checks succeed.
- After the approved restart, browser reload rendered the homepage and server output showed HTTP 200 without the earlier font-download errors.
- Safe local form check: empty submit produced HTTP 400 and visible field errors; synthetic name `FSC Synthetic Audit`, reserved email `fsc-audit@example.invalid` and fictional phone `2025550100` were then submitted for HOA maintenance in Orlando. Server output showed console receipt and HTTP 200; browser displayed “Request received.” This tests the existing local path only. No live provider was enabled; it is not evidence that production email/database delivery works or that the proposed redesign is implemented.

## Live website and journeys

Inspected https://www.floridasecurityconcepts.com/ in the browser at desktop size and at 390 × 844. Viewed homepage, followed assessment to Contact, followed Contact's emergency link, checked urgency value, and opened mobile navigation. No production form submissions or telephone calls.

- Desktop hero is a large dark technical headline with assessment and services actions. All major audience cards have similar prominence; maintenance lacks a dedicated page.
- Mobile homepage shows a long multiline headline and description. The brand wordmark is hidden; the home link appeared unnamed in the accessibility tree. Menu opens and exposes the expected links, with duplicate Emergency Service entries.
- Contact-to-emergency navigation changes heading and submit label but the urgency select value remains empty. Source uses uncontrolled selects with `defaultValue`; this is consistent with stale form defaults during same-page query navigation. Requires regression testing, not just changing the heading.
- Emergency mobile page places phone/email below a sizable hero and puts coverage and other sidebar cards before the form. Recommend a call-first layout and shorter assessment introduction.
- The normal form has ten visible fields: name, phone, email, company, property type, service, city, urgency, contact method and message. Six currently required; city optional.
- Strengths to retain: visible primary assessment path, dedicated emergency service URL, coverage pages, FAQs, server-side validation, resource articles and cost education.
- Live DOM contains one H1, www homepage canonical and a Plausible script. No raster images were present on the homepage. No dedicated privacy-policy link was identified; a text match for “privacy” instead matched the estate-service card, not a privacy policy.
- Visual and accessibility observations are limited to inspected pages and viewport sizes, not a full WCAG audit or cross-device certification. Earlier screenshots were viewed in-tool, not saved as release acceptance assets.

## Lead implementation audit

Source references: `components/LeadCaptureForm.tsx`, `app/contact/page.tsx`, `app/api/leads/route.ts`, `lib/leads/validateLead.ts`, `lib/leads/leadDelivery.ts`, `lib/leads/providers/*`.

- API checks JSON content type, parses body, validates required fields and honeypot, invokes the selected provider, and returns success only for provider success. Body size check uses JavaScript string length after reading the entire body, despite its byte-based name.
- Validator trims/cleans and silently truncates input. Phone character regex can accept invalid all-letter strings from the allowed character set; stricter digit validation belongs in the future form session.
- Client disables repeated busy submissions, renders server errors and has an error-focus effect. `noValidate` means even empty form attempts go to server validation. Busy suppression is not durable idempotency.
- Resend sends company email first, then an optional best-effort customer copy. Customer-copy failure does not invalidate company success. Inbox receipt, sender verification and configured recipients have not been verified.
- Optional combined mode treats email as primary and the Prime database write as secondary. A failed secondary write produces logs but still reports success to the visitor. No durable repair queue is present in the inspected dispatcher.
- The Supabase adapter writes a dedup key but explicitly does not enforce uniqueness/idempotency. Account mapping, production database configuration and access controls were not queried. No production SQL or data writes were performed.
- Console mode logs personal contact fields and a message preview and may return success in production with a warning. This is unsuitable as the redesigned site's production delivery contract.
- Webhook permits HTTP or HTTPS, uses an eight-second timeout and can log a remote error-body preview. Production transport and log redaction require review.
- Plausible currently records `Lead Submitted` after success with service, urgency and location slug. Location can remain unknown for manually selected cities because attribution uses the location-slug default. No measurement of actual booked assessments or maintenance contracts is established.
- Form source captures raw UTM values and referrer for lead delivery. Those values are untrusted and must not be assumed safe for analytics or logs.

The Supabase skill was consulted for review boundaries. No Supabase implementation or version change occurred. Its changelog Markdown endpoint could not be read through the web extractor; current API guidance must be revisited if that adapter changes.

## Hosting, analytics and performance limits

- Vercel connected-app team enumeration returned an empty list. No project settings, secret values, logs with real leads, or environment values were retrieved.
- Read-only GitHub deployment metadata shows both Preview and Production deployments created by `vercel[bot]`. This confirms deployment integration activity, not its exact configured branch triggers, ignored-build rules or environment scoping. No push until those are established.
- Public Plausible script presence is verified. Account access, event receipt, historical volumes, conversion baseline and downstream qualification are not.
- Public PageSpeed API measurement first encountered network sandbox denial. The approved retry outside the sandbox returned HTTP 429. No performance score or Core Web Vitals baseline is available from that attempt. Local cold compilation is not substituted for a production score.
- No full production build or session verification gate was run during this draft-spec stage. Performance/accessibility thresholds in SPEC are proposed acceptance targets.

## Competitive findings revalidated

These are observations of competitors' published positioning, not independent verification of their operational promises and not authority to copy their offers.

| Source | Finding | FSC implication |
|---|---|---|
| [TEM homepage](https://www.temsystems.com/) | Broad integration, installation and service positioning | “Integrated” alone is not distinctive |
| [TEM support](https://www.temsystems.com/support) | Describes communication through service, warranties, preventive inspections and preferred-client agreements | Specific expectations are persuasive; FSC should publish only its own confirmed commitments |
| [FDC maintenance](https://www.fdc.com/automatic-gate-maintenance-contract/) | Infrastructure-oriented maintenance explanation and customizable recurring service | Maintenance deserves a discoverable page; do not borrow guarantees, coverage, prices or compliance claims |
| [FDC contact](https://www.fdc.com/contact-us/) | Quote CTA destination resolves through text retrieval; a maintenance-page sidebar exposes a detailed quote form | The prior awkward-quote-path finding is not reproduced as a confirmed current browser defect |
| [Envera homepage](https://enverasystems.com/) | Community-focused language, separate resident login, video and proof elements | Keep FSC's buyer audience unmistakable; unavailable proof should be omitted |
| [Envera FAQ](https://enverasystems.com/resources/faq/) | Existing resident guest lists are described as not transferring to MyEnvera | Compatibility/transition questions matter; FSC must not imply it already offers a superior migration service |

TEM's defined support terms and Envera's guest-list limitation were revalidated. FDC's maintenance emphasis was revalidated. A full competitor mobile/browser form audit and independent warranty/service verification were not performed.

## Owner-supplied monitoring document

All six pages of the FSC Proactive Monitoring Kit PDF were rendered and visually read because text extraction was unusable. It describes proposed equipment sensing, alerts, predictive service, estimated components/costs, pilot decisions and next steps. Brian explicitly confirmed R&D status. Treat all detection, compatibility, cost, ROI, service-tier and remote-control details as unvalidated proposals; the document's next-step instructions were not executed.

## Draft handoff

Role: product/spec discovery. Output: `harness/SPEC.md` and this supporting record. Application code changed: none. Owner decisions incorporated: priority audience, maintenance objective, Orlando/Tampa, free assessment, keep 24/7, no fabricated proof, Sentinel excluded from present offer. Remaining inputs are listed by gate in SPEC. Next action: Brian reviews the written spec; only after approval does harness authoring begin.
