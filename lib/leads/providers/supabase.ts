// Supabase delivery provider — INSERTs the validated lead into Prime's
// leads table (the FPB Marketing Bot Supabase project), tagged with the
// FSC tenant's account_id.
//
// Required env vars:
//   PRIME_SUPABASE_URL              — Prime Supabase project URL
//   PRIME_SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS; server-only)
//   PRIME_ACCOUNT_SLUG              — Prime accounts.slug to attach this site
//                                     to (e.g. 'fsc'). Looked up at write time.
//
// Behavior:
//   - Never throws — always returns a DeliveryResult.
//   - On any error path, logs with the [LEAD-SUPABASE-FAILURE] tag so
//     Brian's grep finds it fast.
//   - Module-scope cache for the Supabase client + the resolved account
//     UUID. The cache lasts the lifetime of the serverless container —
//     no cold-start risk, no stale-data risk for this short-lived process.
//   - When invoked via the 'resend+supabase' dispatcher mode, a failure
//     here is non-fatal: Resend succeeded, the customer got their email,
//     so the API still returns 200. This module's job is to flag loudly
//     so the measurement gap is visible in logs.
//
// What this writes to Prime's leads table:
//   - account_id (resolved from PRIME_ACCOUNT_SLUG)
//   - client_key = PRIME_ACCOUNT_SLUG (kept in sync; not authoritative)
//   - source_platform derived from utm_source (else 'organic')
//   - lead_type = 'form'
//   - contact_name / contact_email / contact_phone / contact_location (city)
//   - utm_source / utm_medium / utm_campaign
//   - notes ← lead.message
//   - qualification_status = 'new'
//   - attribution_confidence = 'medium' if utm_source present, else 'low'
//   - dedup_key mirrors Prime's lead-ingest convention:
//       `${slug}::email::${email}::${YYYY-MM-DD}`
//     so future cross-tenant dedup queries from Prime work uniformly.
//   - ingest_source = 'fsc-website'
//   - raw_payload.fsc = the FSC-specific fields that don't map directly:
//       propertyType, service, urgency, contactMethod, company, sourcePage,
//       serviceSlug, industrySlug, locationSlug, referrer, submittedAt
//
// What this does NOT do:
//   - Does NOT enforce idempotency. Prime's leads table has no unique index
//     on dedup_key (only a partial non-unique index). Double-submits from
//     the form are an FSC-side concern.
//   - Does NOT modify Prime's schema.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { DeliveryResult, ValidatedLead } from '../types';

type EnvCheck =
  | { ok: true; url: string; key: string; slug: string }
  | { ok: false; reason: string };

function readEnv(): EnvCheck {
  const url = process.env.PRIME_SUPABASE_URL?.trim();
  const key = process.env.PRIME_SUPABASE_SERVICE_ROLE_KEY?.trim();
  const slug = process.env.PRIME_ACCOUNT_SLUG?.trim();

  const missing: string[] = [];
  if (!url) missing.push('PRIME_SUPABASE_URL');
  if (!key) missing.push('PRIME_SUPABASE_SERVICE_ROLE_KEY');
  if (!slug) missing.push('PRIME_ACCOUNT_SLUG');

  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Supabase provider missing required env var(s): ${missing.join(', ')}.`,
    };
  }
  return { ok: true, url: url as string, key: key as string, slug: slug as string };
}

// Module-scope cache — persists for the life of the serverless container.
let cachedClient: SupabaseClient | null = null;
const accountIdCache = new Map<string, string>();

function getClient(url: string, key: string): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedClient;
}

async function resolveAccountId(
  client: SupabaseClient,
  slug: string
): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  const cached = accountIdCache.get(slug);
  if (cached) return { ok: true, id: cached };

  const { data, error } = await client
    .from('accounts')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      reason: `Failed to look up Prime account by slug "${slug}": ${error.message}`,
    };
  }
  if (!data?.id) {
    return {
      ok: false,
      reason: `No Prime account found with slug "${slug}". Apply sql/009 in Prime project, or fix PRIME_ACCOUNT_SLUG.`,
    };
  }
  accountIdCache.set(slug, data.id);
  return { ok: true, id: data.id };
}

// Map FSC's utmSource hint onto Prime's source_platform CHECK constraint.
// Prime values: 'google' | 'meta' | 'organic' | 'referral' | 'manual' | 'unknown'.
function deriveSourcePlatform(utmSource: string | undefined): string {
  const s = (utmSource || '').toLowerCase().trim();
  if (!s) return 'organic'; // FSC website form, no UTM = organic visit
  if (s.includes('google') || s === 'cpc' || s === 'ppc' || s === 'adwords') return 'google';
  if (
    s.includes('facebook') ||
    s.includes('meta') ||
    s.includes('instagram') ||
    s === 'fb' ||
    s === 'ig'
  ) {
    return 'meta';
  }
  // Any other utm_source value (newsletter, partner, etc.) → referral.
  return 'referral';
}

function buildDedupKey(slug: string, lead: ValidatedLead): string {
  const day = lead.submittedAt.slice(0, 10); // YYYY-MM-DD
  const email = lead.email.toLowerCase();
  return `${slug}::email::${email}::${day}`;
}

export async function deliverViaSupabase(
  lead: ValidatedLead
): Promise<DeliveryResult> {
  const env = readEnv();
  if (!env.ok) {
    console.error('[lead-delivery:supabase][LEAD-SUPABASE-FAILURE]', {
      reason: env.reason,
    });
    return { ok: false, mode: 'supabase', reason: env.reason };
  }

  const client = getClient(env.url, env.key);

  const accountResult = await resolveAccountId(client, env.slug);
  if (!accountResult.ok) {
    console.error('[lead-delivery:supabase][LEAD-SUPABASE-FAILURE]', {
      reason: accountResult.reason,
      slug: env.slug,
    });
    return { ok: false, mode: 'supabase', reason: accountResult.reason };
  }

  const sourcePlatform = deriveSourcePlatform(lead.utmSource);
  const dedupKey = buildDedupKey(env.slug, lead);

  const row = {
    account_id: accountResult.id,
    client_key: env.slug,
    source_platform: sourcePlatform,
    lead_type: 'form',
    contact_name: lead.fullName,
    contact_email: lead.email,
    contact_phone: lead.phone,
    contact_location: lead.city ?? null,
    utm_source: lead.utmSource ?? null,
    utm_medium: lead.utmMedium ?? null,
    utm_campaign: lead.utmCampaign ?? null,
    notes: lead.message ?? null,
    qualification_status: 'new',
    attribution_confidence: lead.utmSource ? 'medium' : 'low',
    dedup_key: dedupKey,
    ingest_source: 'fsc-website',
    raw_payload: {
      fsc: {
        propertyType: lead.propertyType,
        service: lead.service,
        urgency: lead.urgency,
        contactMethod: lead.contactMethod,
        company: lead.company,
        sourcePage: lead.sourcePage,
        serviceSlug: lead.serviceSlug,
        industrySlug: lead.industrySlug,
        locationSlug: lead.locationSlug,
        referrer: lead.referrer,
        submittedAt: lead.submittedAt,
      },
    },
  };

  try {
    const { data, error } = await client
      .from('leads')
      .insert(row)
      .select('id')
      .single();

    if (error) {
      console.error('[lead-delivery:supabase][LEAD-SUPABASE-FAILURE]', {
        reason: error.message,
        code: error.code,
        slug: env.slug,
      });
      return {
        ok: false,
        mode: 'supabase',
        reason: `Supabase insert failed: ${error.message}`,
      };
    }

    return {
      ok: true,
      mode: 'supabase',
      deliveryId: data?.id,
    };
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : 'Unknown error during Supabase insert.';
    console.error('[lead-delivery:supabase][LEAD-SUPABASE-FAILURE]', {
      reason,
      slug: env.slug,
    });
    return { ok: false, mode: 'supabase', reason };
  }
}
