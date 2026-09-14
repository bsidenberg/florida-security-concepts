# Release QA readiness — 2026-09-14

Read-only reconnaissance and proposed checks. No test/application/config changes, downloads, new server, live form submission or external request. Existing compiled preview on 127.0.0.1:3100 left running. This is not a verification gate or release acceptance.

## Observed baseline

Latest recorded S-UI-001 independent gate: 96 unit + 11 gate + 83 Chromium browser tests = 190. Preserve that floor. Existing browser suite covers 38 routes, local durable receipt, failure/retry interactions, responsive theme, representative axe, keyboard menu and simulated zoom. It uses one Chromium project; reduced-motion/zoom evidence is emulation, not physical-device or screen-reader observation.

Read-only HTTP observations against the existing compiled preview today:

| Request | Observed |
|---|---|
| `/` | 200; www canonical; noindex/nofollow; no Plausible script |
| `/contact?service=gate-automation&email=fsc-qa%40example.invalid` | 200; canonical excludes the query; noindex/nofollow; no Plausible script |
| `/sitemap.xml` | 200; 38 locations |
| `/robots.txt` | 200; Disallow: / |

These are correct local-preview isolation observations. They do not verify production indexing or production analytics sanitization. HTTP reads execute no browser scripts or form delivery.

Installed-browser inspection through the pinned Playwright API and filesystem: Chromium 1243 executable exists; Chromium headless-shell 1243 cache is present. Firefox 1543 and WebKit 2359 executables are absent. Initial sandbox existence results were unreliable (EPERM); an approved read-only inspection established these results. No downloads performed.

## Concrete remaining checks

| Priority | Test/evidence | Ready now / prerequisite |
|---|---|---|
| P0 | Production idempotency: actual chosen persistence, concurrent workers, restart, 24-hour boundary, timeout/unknown recovery, primary accepted + secondary returned/thrown failure, recovery retries, no duplicate primary effect | Await approved S-005 architecture and implementation. Local receipt tests and mocks cannot satisfy global AC-06. |
| P0 | Enumerate all expected canonical routes; compare actual sitemap, unique titles/descriptions/H1, www canonicals and query canonicalization; parse JSON-LD and verify URLs/claims; follow internal links and anchors | Read-only local sweep immediately possible with installed Chromium/HTTP. New automated release suite is not authored in this reconnaissance. Expected final inventory includes maintenance route once its content session lands. |
| P0 | Preview noindex/no analytics versus production index/follow/canonical configuration; inspect generated production artifact without sending live leads or analytics | Existing preview checks are runnable; production-config equivalent must retain blocked external effects. Do not remove preview safeguards to make local Lighthouse SEO pass. |
| P0 | Intercept analytics requests for all eight SPEC events, enforce categorical-property allowlist, sanitize pageview/campaign/referrer query values, forbid email/phone/name/company/message/requestId leakage; analytics throw cannot change receipt success | Existing preview intentionally disables analytics, so zero requests is insufficient. Need isolated production-like analytics configuration/transport interception after approved implementation. No production dashboard traffic. |
| P1 | Firefox/WebKit core journey, malformed/offline/timeout retry, emergency defaults/history, keyboard and responsive rendering | Install pinned browser binaries first; use existing Playwright framework. Chromium available now. |
| P1 | WCAG 2.2 AA review: screen reader, complete keyboard path/skip link/error focus/success announcements, focus not obscured, touch targets, real 200% zoom/400% reflow, physical phone | Existing axe tags cover WCAG 2/2.1 and do not certify WCAG 2.2 or assistive technology. Human/device evidence remains missing. Emulation is explicitly labeled. |
| P1 | Three repeatable Lighthouse mobile runs on built equivalent; medians Performance >=90, Accessibility >=95, Best Practices >=95, SEO >=95; save version, settings, URL/build, artifacts | Lighthouse dependency/runner absent. Preview noindex intentionally affects SEO; use a safely isolated production-equivalent build or document that limitation. No dev cold-compilation baseline. Field LCP/INP/CLS require enough actual field data, not invented local scores. |
| P1 | Content/proof/privacy review: no unsubstantiated numerical pricing/SOP/monitoring claims; approved recipient/recovery/retention/privacy decisions; approved maintenance page and remaining content acceptance | S-003/S-004/S-005 dependencies remain distinct from theme completion. Owner-approved exceptions must be explicit. |
| P0 | Fail-closed `test:release`, report/evidence manifest, full S-006 independent gate and PR/release handoff | S-006 names `test:release`, but package script and check definition are absent. Register real checks and require their evidence after implementation; never use a placeholder success. |

## Efficient execution order

1. While production design proceeds, implement the read-only canonical/schema/link sweep when assigned; retain existing 190 checks.
2. Once delivery design lands, run genuine persistence contract tests plus existing suite; independently review safety and recovery behavior.
3. Add isolated analytics tests and production-artifact SEO checks; install only required missing test tools/browsers.
4. Run cross-browser and accessibility/performance checks against the finished compiled build. Record unavailable device/field evidence candidly.
5. Independent verifier runs S-006 including nonempty test:release and required evidence. Publication follows the approved production release procedure, not this planning report.

Remaining gates are evidence gaps, not requests for routine implementation permission. Parent orchestrator resolves architecture/owner dependencies and assigns implementation. No source changes made by this read-only pass.
