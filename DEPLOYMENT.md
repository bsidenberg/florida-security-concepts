# Deployment

Operator's mechanical guide for shipping `florida-security-concepts/` to Vercel. For pre-launch readiness items (real contact info, brand assets, search setup, QA), see [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md). This document covers the deployment plumbing.

---

## 1. Deployment target

- **Host:** Vercel (Next.js native).
- **Framework auto-detection:** Vercel detects `next` in `package.json` and configures itself. No `vercel.json` is needed and none is present in this repo.
- **Region:** Vercel's default (auto-selected nearest to user). Don't override.

## 2. Project root

The Vercel project must be rooted at this folder, not at any parent or sibling directory. The `package.json`, `next.config.mjs`, and `app/` directory must sit at the deployment root.

If the GitHub repo backing this project is `florida-security-concepts` (recommended) and the project lives at the repo root, the Vercel "Root Directory" setting stays at the default. If you ever embed this project inside a monorepo, set the Vercel Root Directory to the path containing `package.json`.

## 3. Build configuration

Vercel uses these defaults — leave them as-is:

| Vercel setting | Value |
|---|---|
| Framework Preset | Next.js |
| Build Command | `next build` (or `npm run build`) |
| Output Directory | `.next` (default; do not override) |
| Install Command | `npm install` (default) |
| Node.js Version | 20.x (default; 18.x also works for Next 14) |

Build output: 44 prerendered routes (static + SSG) + two dynamic routes (`/api/leads`, `/contact`). Sitemap and robots are generated automatically by App Router conventions.

## 4. Runtime notes

- `/api/leads` runs on the **Node.js** runtime (`export const runtime = 'nodejs'` is set explicitly so the Resend SDK works — the SDK uses APIs not available on Vercel's Edge runtime).
- `/contact` is dynamic because it reads `searchParams` for prefill (`?service=...&urgency=...`). Renders server-side per request; canonical URL is `/contact` regardless.
- All other routes are statically generated at build time and served from Vercel's CDN.
- No filesystem writes anywhere in the request path — Resend SDK uses HTTPS, the webhook provider uses `fetch`, the console provider uses `console.log` (visible in Vercel Logs).

## 5. Required environment variables

Set these in the Vercel project's **Environment Variables** panel. Pick scopes per row.

### Required for any production-like deployment

| Name | Scopes | Value |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Production, Preview | `https://floridasecurityconcepts.com` (or the preview-specific URL Vercel assigns; for Preview it can be left to default) |
| `LEAD_DELIVERY_MODE` | Production | `resend` (or `console` for the very first preview — see § 6) |

### Required when `LEAD_DELIVERY_MODE=resend`

| Name | Scopes | Value | Notes |
|---|---|---|---|
| `RESEND_API_KEY` | Production (Preview optional) | `re_…` | Server-only. Never expose. |
| `LEAD_NOTIFICATION_TO` | Production | `alerts@floridasecurityconcepts.com` | Single address or comma-separated list. |
| `LEAD_NOTIFICATION_FROM` | Production | `leads@floridasecurityconcepts.com` | Must be on a domain verified in Resend (see § 7). |

### Optional — customer confirmation email

A second email is sent automatically to the submitter on every successful lead, summarizing what they submitted and setting expectations on response time. This is enabled by default in `resend` mode and reuses `LEAD_NOTIFICATION_FROM` as the sender unless overridden.

| Name | Scopes | Default | Notes |
|---|---|---|---|
| `LEAD_CONFIRMATION_ENABLED` | Production / Preview | enabled | Set to `false`, `0`, `no`, or `off` to disable. |
| `LEAD_CONFIRMATION_FROM` | Production / Preview | falls back to `LEAD_NOTIFICATION_FROM` | Must be on a Resend-verified domain. |
| `LEAD_CONFIRMATION_REPLY_TO` | Production / Preview | falls back to first address in `LEAD_NOTIFICATION_TO` | So customer replies route to the company inbox. |

### Optional / future

| Name | When to set |
|---|---|
| `LEADS_WEBHOOK_URL` | Only when `LEAD_DELIVERY_MODE=webhook`. |
| `LEADS_WEBHOOK_SECRET` | Optional with webhook mode. Sent as `X-Webhook-Secret`. |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Reserved for the not-yet-built Supabase provider. |

### What never appears in Vercel env

- No client-side secret. `NEXT_PUBLIC_SITE_URL` is the only `NEXT_PUBLIC_*` variable in use.
- The Resend API key, webhook secret, and any future Supabase service role key are server-only and must not be prefixed with `NEXT_PUBLIC_`.

## 6. Preview deployment recommendation

For the **first** Vercel preview, you have two options. Pick deliberately.

**Option A — Routing/build smoke test only**
- Set `LEAD_DELIVERY_MODE=console` on the Preview scope.
- Skip `RESEND_API_KEY` and the notification env vars on Preview.
- Submit test leads → they appear in Vercel Logs (`[lead-delivery:console] new lead …`) but are not emailed.
- Use this if Resend domain verification is not yet complete.

**Option B — End-to-end including delivery**
- Set `LEAD_DELIVERY_MODE=resend` plus `RESEND_API_KEY`, `LEAD_NOTIFICATION_TO`, `LEAD_NOTIFICATION_FROM` on the Preview scope.
- Use a temporary `LEAD_NOTIFICATION_TO` if you don't want preview leads in the production alert inbox (e.g., your personal email).
- `LEAD_NOTIFICATION_FROM` must already be on a verified Resend domain — there is no "preview-only" exception.
- Submit a test lead; confirm the email lands within 30 seconds and Reply-To is correctly set to the submitter address.

**The difference:** Option A validates that the build, routing, form submission, and validation are all working in Vercel's serverless environment. Option B additionally validates that Resend credentials work in production. You generally want to run Option A first, then graduate to Option B once the email path is set up.

In **Production**, always use `LEAD_DELIVERY_MODE=resend` (or whichever real delivery mode you've configured). Console mode in production is technically allowed but deliberately emits a `[PROD-FALLBACK]` warning on every lead.

## 7. Resend domain verification

Order of operations:

1. Log into Resend → **Domains** → **Add Domain** → `floridasecurityconcepts.com`.
2. Resend issues DNS records (SPF + DKIM, possibly tracking CNAMEs). Copy them into your DNS provider for that domain.
3. Wait for propagation (usually minutes; up to a few hours). Resend's UI shows the verification status.
4. Once verified, both `LEAD_NOTIFICATION_FROM` and `LEAD_CONFIRMATION_FROM` (if overridden) can use any address on that domain (e.g., `leads@floridasecurityconcepts.com`).
5. Send a test from Resend's UI to a real inbox; confirm it lands in inbox (not spam) and the `From` header looks right.
6. Optionally set up DMARC (`p=none` to start, monitor reports, then tighten to `p=quarantine`).

Until DKIM is verified, both the internal notification AND the customer confirmation will be flagged or rejected — symptoms: lead UI says "submitted" but no email arrives, and Vercel Logs show Resend SDK errors like `domain not verified` or `from address not allowed`.

## 8. DNS / domain setup checklist

- [ ] `floridasecurityconcepts.com` registered.
- [ ] In Vercel: project → **Domains** → add `floridasecurityconcepts.com` and `www.floridasecurityconcepts.com`. Vercel will tell you which DNS records (A / CNAME) to add.
- [ ] DNS records set with the registrar / DNS host.
- [ ] HTTPS certificate auto-provisioned by Vercel (visible in the Domains tab).
- [ ] Resend SPF + DKIM records added (see § 7).
- [ ] (Optional) DMARC record set to `v=DMARC1; p=none; rua=mailto:dmarc@floridasecurityconcepts.com`.
- [ ] `dig TXT floridasecurityconcepts.com` shows the SPF record + Resend's verification record.
- [ ] `https://floridasecurityconcepts.com/sitemap.xml` resolves and lists all expected URLs.

## 9. First preview smoke test

After the first Vercel preview deploys (regardless of Option A or B above):

- [ ] Preview URL loads the homepage.
- [ ] `/services/gate-automation` loads (sample of dynamic SSG).
- [ ] `/service-areas/tampa` loads.
- [ ] `/resources/how-much-does-an-automatic-gate-cost` loads.
- [ ] `/contact` loads.
- [ ] `/contact?service=access-control&urgency=this-week` prefills the form correctly.
- [ ] `/sitemap.xml` and `/robots.txt` resolve.
- [ ] `view-source:` on the homepage shows JSON-LD with no empty strings inside the `<script type="application/ld+json">` blocks.
- [ ] Submit the contact form with valid data.
  - Option A: a `[lead-delivery:console] new lead …` line appears in Vercel Logs.
  - Option B: a notification email lands at `LEAD_NOTIFICATION_TO` within 30 seconds.
- [ ] Submit the form with empty required fields → field-level errors render.
- [ ] Mobile width: form is comfortable; nav menu opens; CTAs wrap correctly.
- [ ] No browser console errors on any page.
- [ ] Lighthouse on the homepage: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO 100.

If any step fails, do not promote to Production. Diagnose first.

## 10. First production smoke test

Once the production domain is live:

- [ ] `https://floridasecurityconcepts.com` resolves over HTTPS.
- [ ] `https://www.floridasecurityconcepts.com` resolves and redirects (or serves content) — depends on Vercel's domain config.
- [ ] All preview smoke-test items above repeat successfully on the live domain.
- [ ] Submit one real lead end-to-end. Confirm both emails:
  - **Internal notification** arrives at `LEAD_NOTIFICATION_TO`. Reply-To is the submitter's email. Subject includes urgency / service / city / property type. All submitted fields appear in the body. The honeypot field does **not** appear.
  - **Customer confirmation** arrives at the submitter's address. Subject is `Florida Security Concepts received your request`. The body summarizes service / property type / city / urgency / preferred contact method only — no UTM, referrer, source page, or system metadata. Reply-To routes back to the company inbox.
  - HTTP 200 returned to the form on the API call.
- [ ] Vercel Logs show `[lead-delivery] success` with safe minimal metadata only — no full PII. If the customer confirmation failed but the internal notification succeeded, you'll also see a `[lead-delivery:resend] customer confirmation failed` warning with `confirmationFailed: true` — that means the lead is captured and the company was notified, but the submitter didn't receive their copy.
- [ ] Submit Sitemap to Google Search Console (`https://search.google.com/search-console`).
- [ ] Spot-check three pages with Google's [Rich Results Test](https://search.google.com/test/rich-results).

## 11. Rollback

Vercel keeps every deployment. To roll back:

1. Vercel project → **Deployments** → pick the previous good deployment → ⋯ → **Promote to Production**.
2. Domain switches within seconds; no DNS change needed.
3. Verify the home page resolves with the rolled-back content.
4. If the rollback was triggered by a lead-delivery problem, also check that the rolled-back deployment's env vars are still correct — env-var changes are scoped to the project, not to deployments, so they persist across rollbacks.

If the issue is a corrupted env var (not the code), edit the env var in the Vercel UI and **Redeploy** the latest deployment from the Deployments tab. No code rollback needed.

## 12. Do-not-launch checklist

Block production launch if **any** of these are true:

- [ ] Resend domain verification (SPF + DKIM) is not green.
- [ ] `LEAD_DELIVERY_MODE` is unset or set to `console` in Production.
- [ ] `RESEND_API_KEY`, `LEAD_NOTIFICATION_TO`, or `LEAD_NOTIFICATION_FROM` is missing in Production.
- [ ] No real lead has been submitted end-to-end on a preview deployment.
- [ ] `npm run typecheck`, `npm run lint`, or `npm run build` fails locally on a clean checkout.
- [ ] The contact form on the preview deployment does not return 200 on a valid submission.
- [ ] The contact form on the preview deployment returns 200 on a missing-required-fields submission (validation broken).
- [ ] Lead notification emails go to spam in your inbox testing.
- [ ] Browser console errors appear on any page.

Soft launch is acceptable while the following are still pending — they are not deployment blockers:

- Real photography (none used; site is currently text and SVG only).
- Brand assets (favicon, OG image, Apple icon) — link previews fall back gracefully without them.
- Real `phone` / `email` / `address` in `data/site.ts` — UI hides cleanly when blank.
- Google Business Profile claim.

## 13. Environment validation behavior (reference)

The `/api/leads` endpoint enforces the env contract at request time:

| Scenario | HTTP | Body |
|---|---|---|
| `LEAD_DELIVERY_MODE` unset, `NODE_ENV=production` | 503 | `Lead delivery is temporarily unavailable.` (server log: `LEAD_DELIVERY_MODE is not configured`) |
| `LEAD_DELIVERY_MODE=garbage`, `NODE_ENV=production` | 503 | Same. (server log: `LEAD_DELIVERY_MODE="garbage" is not a supported provider`) |
| `LEAD_DELIVERY_MODE=resend` but `RESEND_API_KEY` missing | 503 | Same. (server log: `Resend provider missing required env var(s): RESEND_API_KEY, …`) |
| `LEAD_DELIVERY_MODE=resend` with bad API key | 503 | Same. (server log: `Resend API error: validation_error — API key is invalid`) |
| `LEAD_DELIVERY_MODE=console` (any env) | 200 | Lead logged to server console. In Production also emits `[PROD-FALLBACK]` warning. |
| `LEAD_DELIVERY_MODE=resend`, all vars set, valid API key | 200 | Email sent; Reply-To = submitter. |

There is **no silent fallback** in Production. A misconfigured environment fails closed with a 503, never with a fake-success 200.

## 14. No `vercel.json` — by design

Next.js on Vercel auto-configures correctly without one. Adding a `vercel.json` introduces another surface to debug for no current benefit. If a future need arises (e.g., custom function timeouts beyond the default, redirect rules, region pinning), add it then with a clear justification commit message.
