# Florida Security Concepts — Launch Checklist

Last updated: 2026-05-04
Owner: Brian Sidenberg
Repo: `florida-security-concepts/`
Recommended host: Vercel

This is the operator's punch list for taking the site from "build green" to "production-live." Work top-to-bottom.

---

## 1. Required Vercel environment variables

Set these on the Vercel project (Production scope at minimum; Preview and Development scopes recommended):

| Variable | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://floridasecurityconcepts.com` | Used by canonical URLs, sitemap, schema, OG/Twitter. Set per environment if preview/staging differs. |
| `LEAD_DELIVERY_MODE` | `resend` | Anything else in production returns a 503 from `/api/leads`. Use `console` only intentionally. |
| `RESEND_API_KEY` | `re_…` | From the Resend dashboard. Server-only. Never expose to the client. |
| `LEAD_NOTIFICATION_TO` | `alerts@floridasecurityconcepts.com` | Single address or comma-separated list. |
| `LEAD_NOTIFICATION_FROM` | `leads@floridasecurityconcepts.com` | Must be on a domain verified in Resend (see § 3). |

Required when `LEAD_DELIVERY_MODE` includes `supabase` (i.e. `supabase`
or `resend+supabase`) — writes the lead into Prime's leads table for
cross-tenant measurement:

| Variable | Value | Notes |
|---|---|---|
| `PRIME_SUPABASE_URL` | `https://<ref>.supabase.co` | Prime project URL (production: `olpyqfuphiwdongzmazi`). |
| `PRIME_SUPABASE_SERVICE_ROLE_KEY` | `eyJ…` | Service role key. Server-only. |
| `PRIME_ACCOUNT_SLUG` | `fsc` | Prime `accounts.slug` to attach FSC leads to. |

Optional — only if/when used:

| Variable | Used by | Notes |
|---|---|---|
| `LEADS_WEBHOOK_URL` | Webhook lead provider | Set when `LEAD_DELIVERY_MODE=webhook`. |
| `LEADS_WEBHOOK_SECRET` | Webhook lead provider | Optional. Sent as `X-Webhook-Secret` for receiver verification. |

**Verification:** after deploying with these set, hit `/api/leads` from a real device and confirm a notification email is received (see § 8 Pre-launch QA).

---

## 2. Required Resend setup

1. Create / log into the Resend account.
2. Generate a Production API key. Store as `RESEND_API_KEY` in Vercel.
3. Confirm `LEAD_NOTIFICATION_TO` inbox is monitored (or routed to a monitored alias). Multiple recipients via comma separation are supported.
4. Verify the `floridasecurityconcepts.com` domain in Resend (see § 3 below).
5. Send a test email through Resend's UI and confirm deliverability to the alert recipients before relying on it.

---

## 3. Required DNS / domain verification

Before production launch:

1. **Domain registration / hosting:** confirm `floridasecurityconcepts.com` points at Vercel (A / CNAME records via Vercel's domain panel).
2. **Resend SPF / DKIM:** add the DNS records Resend generates when you start the domain verification flow. Until DKIM is verified, emails from `leads@floridasecurityconcepts.com` will be flagged as suspicious or rejected.
3. **DMARC:** add a DMARC record (`p=none` to start, monitor reports, then tighten) once SPF/DKIM are in place. Defer until basic sending is healthy.
4. **MX records:** if the FSC domain also receives email, configure MX records with the chosen inbox host. Resend does not need MX to send.

**Sanity tests after DNS:**
- `dig TXT floridasecurityconcepts.com` shows the SPF and Resend-issued records.
- A test email from Resend lands in inbox (not spam) at the alert address.
- A bounce / SPF-fail check on a tool like mail-tester.com scores ≥ 8/10.

---

## 4. Required real FSC contact details

These fields in [`data/site.ts`](data/site.ts) are intentionally blank until verified info is supplied. Components and schema hide them gracefully when blank, but real values strengthen LocalBusiness signal and provide visitor fallbacks.

| Field | Format | Used for |
|---|---|---|
| `phone` | E.164, e.g. `+13215551234` | `tel:` links, schema `telephone` |
| `phoneDisplay` | Human-readable, e.g. `(321) 555-1234` | UI display |
| `emergencyPhone` | E.164 | Emergency `tel:` link |
| `emergencyPhoneDisplay` | Human-readable | Emergency UI display |
| `email` | `info@floridasecurityconcepts.com` | Schema `email`, optional UI |
| `address.street` | Street line | Postal address (only set when verified business address exists) |
| `address.city` | City | Postal address |
| `address.region` | State (already `'FL'`) | Postal address |
| `address.postalCode` | ZIP | Postal address |
| `address.country` | Country (already `'US'`) | Postal address |
| `social.google` | Google Business Profile URL | Schema `sameAs`, footer |
| `social.facebook` | Facebook page URL | Schema `sameAs`, footer |
| `social.linkedin` | LinkedIn page URL | Schema `sameAs`, footer |

**Rules:**
- Do not invent phone, email, address, license numbers, or certifications.
- Helpers `hasPhone()`, `hasEmail()`, `hasPostalAddress()`, `activeSocialLinks()` already gate UI and schema. No code changes needed when filling these in.
- Empty strings are the contract for "not set." Never use placeholder strings like `"TBD"`.

---

## 5. Required brand assets

None of these exist in the repo today. App-Router conventions mean dropping correctly named files in `app/` is enough — no code changes.

| Asset | Path | Spec |
|---|---|---|
| Favicon | `app/icon.png` (or `app/favicon.ico`) | 32×32 minimum, square. PNG preferred. |
| Apple touch icon | `app/apple-icon.png` | 180×180 PNG. |
| Open Graph image | `app/opengraph-image.png` | 1200×630 PNG. Include FSC wordmark and a short value prop. |
| Twitter card image | `app/twitter-image.png` | 1200×630 PNG. Often the same as OG. |

**Until these are added:**
- Search engines and browsers will show generic / no favicon.
- Link previews on Slack, iMessage, Twitter, LinkedIn will fall back to the global `metadata.openGraph` text from [`app/layout.tsx`](app/layout.tsx) — a plain card with title and description, no image. Acceptable for soft launch, not ideal for paid traffic.
- No fake / generated assets are committed. Create real branded versions before launch.

---

## 6. Recommended Google / Search setup

In order, after the domain is live and Resend is verified:

1. **Google Search Console** — add and verify `floridasecurityconcepts.com`. Submit `https://floridasecurityconcepts.com/sitemap.xml`.
2. **Google Business Profile (GBP)** — claim or create. Match address (when set), service area (Central FL + Tampa Bay), categories (Security System Installer, Security System Supplier).
3. **Bing Webmaster Tools** — same sitemap, low effort.
4. **Schema.org validation** — test a few pages on [validator.schema.org](https://validator.schema.org) to confirm `LocalBusiness`, `Service`, `FAQPage`, `BreadcrumbList`, `Article` emissions are clean.
5. **Rich results test** — hit Google's [Rich Results Test](https://search.google.com/test/rich-results) on the homepage, a service page, a location page, and a resource page.
6. **PageSpeed Insights** — confirm Core Web Vitals are green on mobile and desktop for at least the homepage and one location page.
7. **Backlinks / citations** — link from FPB, Weld Workx, and Brian's other Google-trusted properties to FSC. Set up consistent NAP (name/address/phone) across local directories once contact info is set.

---

## 7. Lead capture readiness (pre-flight)

Each successful lead now triggers **two emails** sent through Resend:
1. **Internal notification** to `LEAD_NOTIFICATION_TO` (company alert inbox).
2. **Customer confirmation** to the submitter, summarizing what they sent.

The customer confirmation is best-effort: a confirmation failure does not fail the lead, since the company has already been notified. A `[lead-delivery:resend] customer confirmation failed` warning is logged with safe metadata only when this happens.

Before flipping to `LEAD_DELIVERY_MODE=resend` in production:

- [ ] All five env vars in § 1 are set in Vercel Production scope.
- [ ] Resend domain verification is complete (SPF + DKIM green) — required for both emails.
- [ ] `LEAD_NOTIFICATION_TO` inbox is monitored.
- [ ] Decide whether to override `LEAD_CONFIRMATION_FROM` / `LEAD_CONFIRMATION_REPLY_TO` or accept defaults (defaults are sensible — confirmation reuses `LEAD_NOTIFICATION_FROM` and routes Reply-To to the company inbox).
- [ ] Manual smoke test on Vercel preview deployment (`LEAD_DELIVERY_MODE=resend`, full env): submit a real lead and confirm BOTH emails:
  - Internal notification arrives at `LEAD_NOTIFICATION_TO`, Reply-To routes to the submitter.
  - Customer confirmation arrives at the submitter's address with subject `Florida Security Concepts received your request`, summarizes what they submitted, contains no UTM/referrer/source-page/system metadata, and Reply-To routes to the company inbox.
- [ ] Manual smoke test on Vercel preview deployment **without** `RESEND_API_KEY`: confirm `/api/leads` returns 503 with the user-friendly error and the server log contains `Resend provider missing required env var(s)`.
- [ ] (Optional) Manual smoke test with `LEAD_CONFIRMATION_ENABLED=false`: confirm the internal notification still arrives and no confirmation goes to the submitter.
- [ ] Confirm the form's success state appears only after a 200 response.

---

## 8. Pre-launch QA

Spot-check the following manually before opening to traffic:

**Pages**
- [ ] Home loads, hero renders, CTAs route correctly.
- [ ] `/services` and one service detail page (e.g. `/services/gate-automation`).
- [ ] `/industries` and one industry detail page.
- [ ] `/service-areas` and three location pages spanning both regions (Orlando, Tampa, Wesley Chapel).
- [ ] `/resources` and one resource article.
- [ ] `/contact` with no params.
- [ ] `/contact?service=access-control` prefills the Service field.
- [ ] `/contact?location=tampa` prefills the City field.
- [ ] `/contact?urgency=emergency` prefills urgency and shows emergency variant copy.
- [ ] `/_not-found` (visit a junk URL).

**Form**
- [ ] Submit with required fields → success state.
- [ ] Submit with empty fields → field-level errors render under inputs.
- [ ] Submit twice rapidly → second submit is blocked.
- [ ] Tab through the form → focus order is sensible, error region announces on failure.
- [ ] Mobile width: form is comfortable, no horizontal scroll.

**SEO / metadata**
- [ ] View source on five different pages → unique `<title>`, unique `<meta name="description">`, correct `<link rel="canonical">`.
- [ ] `https://floridasecurityconcepts.com/sitemap.xml` lists all expected URLs.
- [ ] `https://floridasecurityconcepts.com/robots.txt` references the sitemap.
- [ ] No empty/blank values in any JSON-LD blob (`view-source` + ctrl-F `""` inside the script tag).

**Performance**
- [ ] Lighthouse run on home and one location page; Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO 100.
- [ ] No console errors in the browser on any page.

---

## 9. Post-launch QA

In the first 24–72 hours:

- [ ] Watch Vercel logs for any `[lead-delivery] failure` lines.
- [ ] Confirm at least one real lead has been captured and the alert email arrived as expected.
- [ ] Confirm Search Console has crawled the sitemap and not flagged indexing errors.
- [ ] Confirm GBP listing surfaces FSC in branded search.
- [ ] Spot-check Resend delivery logs for any bounces or spam complaints.
- [ ] Set a reminder to review `npm audit` weekly for the first month and monthly thereafter.

---

## 10. Dependency / security review

Run `npm audit` to reproduce. Findings as of 2026-05-04 after the Next.js 14.2.18 → 14.2.35 patch bump:

| Package | Severity | Status | Decision |
|---|---|---|---|
| `next` 14.2.35 | high | One advisory remains (`GHSA-9g9p-9gw9-jx7f` — Image Optimizer `remotePatterns` DoS for self-hosted apps) | **Not exploitable in this deployment.** We deploy to Vercel (not self-hosted) and do not use `next/image` with `remotePatterns`. Defer the Next 15 major bump. |
| `postcss` <8.5.10 | moderate | Transitive of `next@14.2`. Build-time tool only, not in runtime bundle. | Defer. Cleared by future Next 15 bump. |
| `glob` (via `eslint-config-next` → `@next/eslint-plugin-next`) | high | `glob` CLI command-injection. We do not invoke `glob` CLI from npm scripts. Dev tooling only. | Defer. Fix path is `eslint-config-next@16` (major bump, breaking). |
| `uuid` <14 (via `svix` via `resend`) | moderate | Buffer-bounds issue in `uuid.v3/v5/v6` with `buf` arg. Not exercised by Resend SDK in our usage. | Defer. `npm audit fix --force` would *downgrade* `resend` (regression), so do not run it. |

**Action taken:** bumped `next` and `eslint-config-next` from `14.2.18` to `14.2.35` (same minor, safe patch). Cleared all critical advisories.

**Action deferred:** Next 15 major bump and `eslint-config-next` 16 major bump — both should ride a deliberate framework-upgrade sprint, not a launch-readiness sprint.

**Re-check cadence:** weekly for the first month after launch, monthly thereafter, plus immediately whenever Resend or Next ships a security release.

---

## 11. Known deferred items

These are tracked but explicitly out of scope for the launch sprint.

- Real branded photography. Currently zero placeholder images by design — no fake content.
- Webhook lead provider tested against a real receiver (HubSpot / Zapier / Make).
- Customer testimonials (only when real, attributable, and approved by the customer).
- Awards, certifications, or licensing badges (only when verified and publicly defensible).
- Blog / resource expansion beyond the initial five guides.
- Multi-language support (none planned).
- Live chat / chatbot (none planned).
- Service area map embed (currently a text grid; map embed deferred until needed).
- Analytics: Plausible installed via `next-plausible` v4. Script is loaded once `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL` is set in Vercel. Brian must: (1) create Plausible account at plausible.io, (2) add `floridasecurityconcepts.com` as a site, (3) copy the site-specific script URL (looks like `https://plausible.io/js/pa-XXXXX.js`) into Vercel env var `NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL`, (4) optionally create a "Lead Submitted" custom goal in Plausible dashboard for funnel reporting. Dashboard: https://plausible.io/floridasecurityconcepts.com

---

## 12. Pre-flight summary

The code is launch-capable. Launch is blocked on **operator inputs**, not engineering:

| Blocker | Owner | Action |
|---|---|---|
| Resend domain verification | Brian | DNS records + verification flow in Resend dashboard |
| Vercel env vars set in production | Brian | Add the five vars in § 1 |
| Real FSC phone / email / address | Brian | Fill in [`data/site.ts`](data/site.ts) |
| Brand assets (favicon / OG / Apple icon) | Brian | Drop files into `app/` |
| Domain pointed at Vercel | Brian | Vercel domains panel |
| Manual smoke test of full lead flow on a preview deploy | Brian | Submit a real lead end-to-end |

Do these in order. The site can soft-launch missing items 3–4 if needed; it cannot launch missing items 1–2 and 5–6.
