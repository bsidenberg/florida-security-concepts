# Florida Security Concepts

Production website for Florida Security Concepts — security gates, gate automation, access control, video surveillance, and security system integration for Central Florida and Tampa Bay.

## Stack

- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- Resend for lead-notification email (with console / webhook fallbacks)
- Static-first: 44 prerendered pages, dynamic API route at `/api/leads` and a dynamic `/contact` (reads searchParams)

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values you want active locally
npm run dev                  # http://localhost:3000
```

By default `LEAD_DELIVERY_MODE=console` — leads submitted via the contact form are logged to the dev server console, not emailed.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server. |
| `npm run build` | Production build. Pre-renders all static pages and validates the dynamic routes. |
| `npm start` | Start the production server (after `build`). |
| `npm run lint` | ESLint via `next lint`. |
| `npm run typecheck` | `tsc --noEmit`. |

## Environment variables

See [`.env.example`](.env.example) for the full template with comments. Quick reference:

| Variable | Required? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes (prod) | Canonical URLs, sitemap, schema, OG/Twitter. Defaults to `https://floridasecurityconcepts.com`. |
| `LEAD_DELIVERY_MODE` | yes (prod) | `console` \| `resend` \| `webhook`. In production, missing/invalid → 503 from `/api/leads`. |
| `RESEND_API_KEY` | yes when `mode=resend` | API key from Resend dashboard. |
| `LEAD_NOTIFICATION_TO` | yes when `mode=resend` | Recipient address. Comma-separated for multi-recipient. |
| `LEAD_NOTIFICATION_FROM` | yes when `mode=resend` | Verified sender address (must be on a domain verified in Resend). |
| `LEADS_WEBHOOK_URL` | yes when `mode=webhook` | POST destination for lead JSON. |
| `LEADS_WEBHOOK_SECRET` | optional | Sent as `X-Webhook-Secret`. |

## Lead delivery modes

The `/api/leads` POST handler validates submissions server-side, then dispatches to the configured provider in [`lib/leads/leadDelivery.ts`](lib/leads/leadDelivery.ts).

- **`console`** — logs the structured lead to the server console. Safe local default. In production, useful only as an audit-via-Vercel-Logs fallback.
- **`resend`** — sends a notification email per lead via Resend ([`lib/leads/providers/resend.ts`](lib/leads/providers/resend.ts)). Submitter's email is set as Reply-To. Honeypot field is never included.
- **`webhook`** — POSTs the normalized lead JSON to `LEADS_WEBHOOK_URL` ([`lib/leads/providers/webhook.ts`](lib/leads/providers/webhook.ts)). Compatible with HubSpot, Zapier, Make, n8n, or a private CRM endpoint.
- **`supabase`** — stub. Returns a configuration error until [`lib/leads/providers/supabase.ts`](lib/leads/providers/supabase.ts) is built.

In **production**, an unset or invalid `LEAD_DELIVERY_MODE` returns 503 with a configuration error. There is no silent fallback to console.

## Project layout

```
app/                      Next.js App Router pages and routes
  api/leads/              POST endpoint that validates + dispatches lead
  services/[slug]/        Per-service detail pages
  industries/[slug]/      Per-industry detail pages
  service-areas/[slug]/   Per-city detail pages
  resources/[slug]/       Resource articles
  contact/                Contact page (reads searchParams)
  layout.tsx              Global layout, metadata, schema, fonts
  sitemap.ts robots.ts    SEO infrastructure

components/               Shared UI (Header, Footer, Hero, Forms, Schema, ...)

data/
  site.ts                 Branding, contact info (placeholders), nav config
  services.ts             Service catalog
  industries.ts           Industry catalog
  locations.ts            Location catalog
  resources.ts            Resource articles

lib/leads/                Lead capture domain
  types.ts                Shared types
  validateLead.ts         Server-side validation, sanitization, honeypot
  leadDelivery.ts         Provider dispatcher + safe production logging
  providers/
    console.ts
    resend.ts
    webhook.ts
```

## Deploying to Vercel

For the mechanical deployment guide — Vercel project setup, env-var scopes, preview vs. production options, Resend domain verification, smoke tests, and rollback — see [`DEPLOYMENT.md`](DEPLOYMENT.md).

For the operator's pre-launch readiness punch list — real contact info, brand assets, search setup, and pre-launch QA — see [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md).

Quick orientation:

- **Host:** Vercel (Next.js native deployment). No `vercel.json` needed.
- **Domain:** `floridasecurityconcepts.com`.
- **CI:** none configured. Vercel runs the build on push.
- **Observability:** Vercel Logs are the source of truth. The dispatcher emits safe minimal-metadata logs on success and failure; full lead PII is logged only by the `console` provider, intentionally gated behind `LEAD_DELIVERY_MODE=console`.

## Brand assets

Three brand assets are generated at build time by Next.js's built-in [`next/og`](https://nextjs.org/docs/app/api-reference/functions/image-response) `ImageResponse` (no extra dependencies):

| File | Output | Size | Purpose |
|---|---|---|---|
| [`app/icon.tsx`](app/icon.tsx) | `/icon` (PNG) | 512×512 | Browser tab favicon (Next downsamples to 16×16 / 32×32 as needed) |
| [`app/apple-icon.tsx`](app/apple-icon.tsx) | `/apple-icon` (PNG) | 180×180 | iOS home-screen icon (iOS adds its own rounded mask) |
| [`app/opengraph-image.tsx`](app/opengraph-image.tsx) | `/opengraph-image` (PNG) | 1200×630 | Open Graph + Twitter card preview for shares (Slack, iMessage, X, LinkedIn, Facebook) |

The runtime is set to `edge` on each file — that's the canonical runtime for `ImageResponse` and works around a Windows-specific `fileURLToPath` issue in `@vercel/og`'s bundled-font loader during local builds. On Vercel these become edge functions and the PNG output is cached at the edge after first hit.

These are professional **placeholders** until an official Florida Security Concepts logo / brand kit exists. To regenerate after editing the JSX, just run `npm run build` (or hit the route in dev). To replace with real artwork later, swap each `app/<name>.tsx` for a static `app/<name>.png` (Next.js App Router will pick up either form).

Editorial constraints: the assets carry only the company name, region, service line, and URL. No fake certifications, awards, badges, seals, client logos, license numbers, or stock photography.

## Editorial / copy rules

- No fake testimonials, license numbers, certifications, awards, client logos, phone numbers, or addresses. Empty placeholders only.
- Public service positioning is limited to gates, gate automation, access control, video surveillance, security system integration, and emergency service. Do not reintroduce fire-alarm or life-safety positioning without verified licensing context.
- Real photography is preferred over stock; absent that, no images.

## License

Proprietary. All rights reserved by Florida Security Concepts.
