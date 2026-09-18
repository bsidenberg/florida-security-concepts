// S-CRM-001 (AM-005) test helpers. ADDITIVE ONLY: nothing here changes the
// behavior of postgres.ts / transport.ts / receipt-fixtures.ts, and the default
// cluster templates stay exactly AM-003. A test that wants the CRM migration
// applies it explicitly to its own fresh database with applyCrmMigration().
//
// - applyCrmMigration(): runs sql/fsc-crm-lead-effect.draft.sql unchanged.
// - createCrmFake(): a synthetic crm-intake endpoint with the CRM's documented
//   semantics (HMAC v1 verification over the exact raw bytes, idempotent on
//   requestId: first 200 RECEIVED, identical replay 200 REPLAYED with the same
//   receiptId, different lead under the same requestId 409), plus scripted
//   failure behaviors. It never reaches a network.
// - installCrmTransport(): routes global fetch to the existing Resend fake,
//   the existing PostgREST emulator (real SQL) and the CRM fake, recording one
//   shared ordered timeline. Any other destination is refused and recorded.
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { vi } from 'vitest';
import type pg from 'pg';
import { runScript, type Cluster, type TestDatabase } from './postgres';
import { PRIME_BASE, RESEND_URL, type createPrimeRestEmulator, type createResendFake } from './transport';

export const CRM_SQL_PATH = resolve('sql/fsc-crm-lead-effect.draft.sql');
/** D-031 B-1: Part A only (REVOKE + DROP FUNCTION IF EXISTS); must succeed with live crm_lead rows. */
export const CRM_ROLLBACK_SQL_PATH = resolve('sql/fsc-crm-lead-effect.rollback.draft.sql');
/** D-031 B-1: optional, destructive, owner-only Part B (narrow the CHECKs); refuses while crm_lead rows exist. */
export const CRM_ROLLBACK_NARROW_SQL_PATH = resolve('sql/fsc-crm-lead-effect.rollback-narrow.destructive.draft.sql');
export const CRM_REPORT_SQL_PATH = resolve('sql/fsc-crm-lead-reconciliation-report.sql');

/**
 * D-031 m-2: the application pins the CRM project host, so tests must use it.
 * It is NEVER contacted: every test stubs global fetch and routes this exact
 * URL to createCrmFake(); any unrouted destination throws, and the gate's
 * network guard blocks non-loopback sockets as defense in depth.
 */
export const CRM_HOST = 'izhandnebyywemsjisye.supabase.co';
export const CRM_URL = `https://${CRM_HOST}/functions/v1/crm-intake`;
export const CRM_SECRET = 'synthetic-crm-hmac-secret-not-real-0123456789abcdef';

export async function applyCrmMigration(admin: pg.Client): Promise<void> {
  await runScript(admin, readFileSync(CRM_SQL_PATH, 'utf8'));
}

/** A fresh AM-003 database with the AM-005 migration applied on top (template untouched). */
export async function crmDatabase(cluster: Cluster): Promise<TestDatabase> {
  const db = await cluster.database('migrated');
  await applyCrmMigration(db.admin);
  return db;
}

export type CrmBehavior =
  | 'normal'
  | 'hang'
  | 'network'
  | 'non-json'
  | { status: number; body?: unknown; accept?: boolean };

export type CrmCall = {
  url: string;
  method: string;
  raw: string;
  headers: Record<string, string>;
  redirect: RequestRedirect | undefined;
  cache: RequestCache | undefined;
  hasSignal: boolean;
  signatureValid: boolean;
  timestamp: string | null;
  signature: string | null;
};

export function expectedSignature(secret: string, timestamp: string, raw: string): string {
  return `v1=${createHmac('sha256', secret).update(`${timestamp}.${raw}`, 'utf8').digest('hex')}`;
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export function createCrmFake(secret = CRM_SECRET) {
  const calls: CrmCall[] = [];
  const leads = new Map<string, { raw: string; lead: string; receiptId: string }>();
  const script: CrmBehavior[] = [];
  let sequence = 0;
  function accept(raw: string): Response {
    const parsed = JSON.parse(raw) as { requestId: string; lead: unknown };
    const lead = JSON.stringify(parsed.lead);
    const existing = leads.get(parsed.requestId);
    if (existing) return existing.lead === lead ? json(200, { ok: true, code: 'REPLAYED', receiptId: existing.receiptId }) : json(409, { ok: false, code: 'CONFLICT' });
    const receiptId = `synthetic-crm-receipt-${++sequence}`;
    leads.set(parsed.requestId, { raw, lead, receiptId });
    return json(200, { ok: true, code: 'RECEIVED', receiptId });
  }
  return {
    calls,
    leads,
    /** Behaviors consumed one per CRM call, in order; afterwards calls behave normally. */
    next(...behaviors: CrmBehavior[]) { script.push(...behaviors); },
    async handle(url: string, init: RequestInit): Promise<Response> {
      const headers: Record<string, string> = {};
      new Headers(init.headers).forEach((value, key) => { headers[key] = value; });
      const raw = typeof init.body === 'string' ? init.body : String(init.body);
      const timestamp = headers['x-fsc-crm-timestamp'] ?? null;
      const signature = headers['x-fsc-crm-signature'] ?? null;
      const signatureValid = timestamp !== null && signature !== null && /^[1-9][0-9]{0,11}$/.test(timestamp) && signature === expectedSignature(secret, timestamp, raw);
      calls.push({ url, method: String(init.method), raw, headers, redirect: init.redirect, cache: init.cache, hasSignal: init.signal instanceof AbortSignal, signatureValid, timestamp, signature });
      if (init.signal?.aborted) throw init.signal.reason;
      const behavior = script.shift() ?? 'normal';
      if (behavior === 'hang') {
        return new Promise<Response>((_resolve, reject) => {
          const signal = init.signal;
          if (!signal) return; // a post without an abort signal hangs forever and the test times out
          signal.addEventListener('abort', () => reject(signal.reason ?? new DOMException('aborted', 'AbortError')));
        });
      }
      if (behavior === 'network') throw new TypeError('fetch failed');
      if (behavior === 'non-json') return new Response('<html>gateway</html>', { status: 200, headers: { 'content-type': 'text/html' } });
      if (!signatureValid) return json(401, { ok: false, code: 'BAD_SIGNATURE' });
      if (typeof behavior === 'object') {
        if (behavior.accept) accept(raw);
        return json(behavior.status, behavior.body ?? { ok: false, code: 'SYNTHETIC' });
      }
      return accept(raw);
    },
  };
}

export type TimelineEvent = string;

/**
 * Routes global fetch to the Resend fake, the PostgREST emulator and the CRM fake.
 * `timeline` records every routed call in order as a label:
 *   rpc:<name>[:<p_effect>] | resend:company | resend:customer | crm:post
 */
export function installCrmTransport(
  resend: ReturnType<typeof createResendFake>,
  prime: ReturnType<typeof createPrimeRestEmulator>,
  crm: ReturnType<typeof createCrmFake>,
  options: { companyTo?: string; crmUrl?: string } = {},
) {
  const companyTo = options.companyTo ?? 'info@floridasecurityconcepts.com';
  const crmUrl = options.crmUrl ?? CRM_URL;
  const unexpected: string[] = [];
  const timeline: TimelineEvent[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    if (url.href === RESEND_URL && init.method === 'POST') {
      let to = '';
      try { to = JSON.parse(String(init.body)).to; } catch { /* recorded by the fake */ }
      timeline.push(to === companyTo ? 'resend:company' : 'resend:customer');
      return resend.handle(init);
    }
    if (url.origin === PRIME_BASE && url.pathname.startsWith('/rest/v1/rpc/') && init.method === 'POST') {
      const name = url.pathname.slice('/rest/v1/rpc/'.length);
      let effect = '';
      try { effect = JSON.parse(String(init.body)).p_effect ?? ''; } catch { /* recorded by the emulator */ }
      timeline.push(`rpc:${name}${effect ? `:${effect}` : ''}`);
      return prime.handle(url, init);
    }
    if (url.href === crmUrl && init.method === 'POST') {
      timeline.push('crm:post');
      return crm.handle(url.href, init);
    }
    unexpected.push(url.origin);
    throw new Error('UNEXPECTED_DESTINATION');
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, unexpected, timeline };
}

/** The ValidatedLead key set (lib/leads/types.ts + validateLead output). `honeypot` is deliberately absent. */
export const VALIDATED_LEAD_KEYS = [
  'fullName', 'email', 'phone', 'propertyType', 'service', 'city', 'urgency', 'contactMethod', 'company', 'message',
  'sourcePage', 'serviceSlug', 'industrySlug', 'locationSlug', 'utmSource', 'utmMedium', 'utmCampaign', 'referrer',
  'requestId', 'submittedAt',
] as const;

/**
 * Exact top-level key sets the real AM-003 + AM-005 SQL returns (asserted
 * against real PostgreSQL in tests/gate/crm-lead-effect.test.ts). The unit
 * fake RPC in tests/unit/crm-coordinator.test.ts builds responses with exactly
 * these keys so it can never drift from the real protocol silently.
 */
export const REAL_RPC_SHAPES = {
  createReady: ['code', 'receipt_id'],
  effectClaimed: ['code', 'envelope', 'idempotency_key', 'lease_token', 'lease_until', 'prime_lead_id', 'prior_uncertain', 'retry_cutoff'],
  crmClaimed: ['code', 'envelope', 'idempotency_key', 'lease_token', 'lease_until', 'payload', 'prime_lead_id', 'prior_uncertain', 'retry_cutoff'],
  codeOnly: ['code'],
  finish: ['code', 'receipt_id'],
  primeRecorded: ['code', 'lead_id'],
} as const;
