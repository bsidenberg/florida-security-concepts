# S-007 session contract — brand refresh and "show, don't tell" homepage, 2026-10-02

**Status: AUTHORIZED TO BUILD on a feature branch (D-035). Merge to main and production deploy remain Brian's.**

Tier 3 (customer-facing production website). Full standard applies: machine gate (CI runs `scripts/verify.ps1 -SessionId S-007` on push to `codex/**` and on the PR), independent review, owner merge. No SQL, no new providers, no secrets, no production configuration change.

## 1. Authority

- Brian, 2026-10-01: update the site to carry the wow factor and impression of source1solutions.com; the site's goal is to showcase FSC's technical abilities by showing them, not by saying so. Motion must be cursor-driven and involve the user; static/looping animations were rejected. Hero compact, one simple graphic that only gets elaborate on motion.
- Brian, 2026-10-01: new FSC aperture logo package (navy #002868, red #BF0A30, white) replaces the boxed "FSC" mark and the blue/gold palette.
- Brian, 2026-10-02: "pull all the content and functions from my website and complete the content"; the lead form must stay wired to the company email and the CRM exactly as it is; the site is primarily an SEO/AEO/GEO asset; the resource-posting agent (commits to `data/resources.ts`, twice a week) must keep working.
- Brian, 2026-10-02: eleven manufacturer logos confirmed for the equipment strip.
- This session is a Rule 8 **harness amendment** (AM-006): it supersedes the CLAUDE_HANDOFF rule "do not redesign accepted pages again" and the S-UI-001 accepted theme, for the homepage design and the sitewide brand tokens only.

## 2. Objective

Replace the homepage with a cursor-interactive, Source1-structured page in the new FSC brand, re-theme the shared shell and the other 37 routes to the new palette and logo without changing their content, URLs, metadata or schema, and keep every lead, analytics, SEO and resource-agent contract byte-for-byte in behavior.

## 3. In scope (permitted files)

Builder:
- `app/page.tsx` (rewrite), new `components/home/*` client components (hero map canvas, cursor cards, night-view stage, manufacturers strip, resources row).
- `app/globals.css`, `tailwind.config.ts`, `app/layout.tsx` (font swap to Plus Jakarta Sans via `next/font/google`; metadata unchanged except nothing), `components/Header.tsx`, `components/Footer.tsx` (logo image, red CTA), `components/Hero.tsx` (tokens only), `components/CTASection.tsx`/`CapabilityBar.tsx` (tokens only if they hard-code old colors).
- `public/brand/*` (logo PNGs from Brian's package), `public/manufacturers/*` (eleven logos Brian supplied).
- `data/site.ts`: no field removed; `manufacturerCerts`/`licenses` stay empty until Brian supplies them.
- `app/opengraph-image.tsx`, `app/icon.tsx`, `app/apple-icon.tsx`: recolor to the new palette only.
- Harness docs: this contract, SESSIONS.md, DECISIONS.md, verification.json (register S-007 with the standard six stages).

Test-guard:
- `tests/e2e/*`, `tests/release/*` where a selector or expected text depends on the old homepage or old brand mark. Existing assertions are updated to the new truth, never deleted or loosened; the 571 unit / 286 gate floors are untouched. One exception recorded here: `tests/unit/preview-isolation.test.ts` line 12 mocks `next/font/google` by export name and must also export `Plus_Jakarta_Sans` for the layout to import under test. No assertion changes; `Inter` stays in the mock.

## 4. Out of scope / must not change

- `app/api/leads/**`, `lib/leads/**`, `lib/analytics/**`, `components/LeadCaptureForm.tsx`, `app/contact/**`, `sql/**`, `.github/workflows/**`, `scripts/**`, `tests/unit/**`, `tests/gate/**`.
- `data/resources.ts` and `app/resources/**`: the `Resource` type, `resources` array export, `getResource`, slugs, and the `/resources/[slug]` route are the agent's contract. The homepage reads from `resources` (newest `publishedDate` first) and must tolerate any number of entries.
- `data/services.ts`, `data/industries.ts`, `data/locations.ts` content; all 38 canonical routes, titles, descriptions, canonicals, sitemap, robots, JSON-LD (`components/Schema.tsx` content unchanged; `FAQSchema` still emitted from the homepage).
- Analytics: every `data-fsc-event` / `data-fsc-placement` attribute present on the old homepage, header and footer appears on the new one with the same event names (`assessment_cta`, `maintenance_interest`, `emergency_call`) and existing placements; new placements use the same categorical allowlist and add no new event names.
- Approved wording: "24/7 emergency service", "Request a Free Property Assessment", "A form request does not dispatch a technician." Sentinel/monitoring is R&D: the night-view demo is labelled a simulated demonstration and never described as a live FSC monitoring service.
- No fabricated proof: no invented stats, testimonials, licences, ratings, project photos or named customers. Stat tiles carry only facts in the repo: 24/7 emergency service, Orlando & Tampa, the count of `locations`, the count of manufacturer platforms. Project teardowns are deferred to S-008 pending Brian's photos.
- No new runtime dependency. The hero is Canvas 2D; no Three.js.
- The homepage's `#maintenance` section stays (header, footer and service list link to `/#maintenance`).

## 5. Acceptance criteria

- AC-1 Lint, typecheck, unit (571), gate (286), build, e2e all exit 0 under `verify.ps1 -SessionId S-007` in CI with raw evidence uploaded.
- AC-2 `curl` of `/sitemap.xml` from the built site lists the same 38 URLs as before (release test `contract.spec.ts` keeps passing).
- AC-3 `/contact?service=repair`, `/contact?service=retrofit`, `/contact?service=preventive-maintenance`, `/contact?urgency=emergency` and `/#maintenance` all still resolve from the homepage links.
- AC-4 `GET /api/leads` still 405; `POST` path untouched (diff shows zero changes under `app/api`, `lib/leads`, `components/LeadCaptureForm.tsx`).
- AC-5 The homepage renders with JavaScript disabled: all text content, the FAQ, the CTAs and the manufacturers strip are in the HTML; the canvas and cursor effects are progressive enhancement. Reduced-motion disables continuous animation.
- AC-6 Lighthouse (release suite) on `/` stays within the S-006 thresholds already encoded in `tests/release/lighthouse.spec.ts`.
- AC-7 Screenshots at 390 and 1440 of `/`, `/services`, `/contact`, one industry, one area, one resource in the evidence folder.
- AC-8 Independent review report in `harness/evidence/S-007-review.md` by an agent that wrote none of the code.

## 6. Owner-only inputs (not blockers for the PR)

- Licence numbers and manufacturer certifications for `data/site.ts` (currently empty, so the credentials strip is omitted, not faked).
- Three project teardowns with before/after photos and scope/timeline/result (S-008).
- Any real operating stats for the stat tiles (communities under contract, gates installed).
- Merge of the PR; Vercel deploys main.

## 7. Follow-ons drafted, not run

- S-008 project teardowns (needs owner photos).
- S-SEO-002 AEO/GEO hardening: `Service` and `OfferCatalog` JSON-LD per service, `speakable`, `/llms.txt`, FAQ schema on service pages, answer-first intros on services/industries, sitemap `lastmod` from `updatedDate`. Nothing here is required for S-007.
