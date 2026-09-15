// Transport-level fakes for coordinator tests. Only the network is replaced:
// - Resend: a synthetic POST /emails endpoint with Resend idempotency semantics
//   (same key + same body replays the same id; same key + different body is a
//   409 invalid_idempotent_request), plus scripted failure behaviors.
// - Prime: a PostgREST-shaped POST /rest/v1/rpc/<name> endpoint whose every call
//   runs the real RPC in the isolated PostgreSQL database as service_role.
// The real lib/leads/productionReceipt.ts productionDependencies() code
// (fetch, headers, status/body mapping) is exercised unchanged.
import { vi } from 'vitest';
import type pg from 'pg';
import { callRpc } from './postgres';

export const RESEND_URL = 'https://api.resend.com/emails';
export const PRIME_BASE = 'https://prime-synthetic.example.invalid';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value as object).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export type ResendBehavior = 'normal' | 'hang' | 'network' | 'accept-then-lose-response' | { status: number; body?: unknown };
export type ResendCall = { method: string; key: string | null; authorization: string | null; contentType: string | null; body: any; at: number };

export function createResendFake() {
  const calls: ResendCall[] = [];
  const accepted = new Map<string, { body: string; id: string }>();
  const script: ResendBehavior[] = [];
  let sequence = 0;
  function accept(key: string, body: string): Response {
    const existing = accepted.get(key);
    if (existing) return existing.body === body ? json(200, { id: existing.id }) : json(409, { statusCode: 409, name: 'invalid_idempotent_request', message: 'Same idempotency key used with a different request payload.' });
    const id = `synthetic-resend-${++sequence}`;
    accepted.set(key, { body, id });
    return json(200, { id });
  }
  return {
    calls,
    accepted,
    /** Behaviors consumed one per provider call, in order; afterwards calls behave normally. */
    next(...behaviors: ResendBehavior[]) { script.push(...behaviors); },
    async handle(init: RequestInit): Promise<Response> {
      const headers = new Headers(init.headers);
      const raw = String(init.body);
      const body = JSON.parse(raw);
      const key = headers.get('idempotency-key');
      calls.push({ method: String(init.method), key, authorization: headers.get('authorization'), contentType: headers.get('content-type'), body, at: Date.now() });
      const behavior = script.shift() ?? 'normal';
      if (behavior === 'hang') {
        return new Promise<Response>((_resolve, reject) => {
          const signal = init.signal;
          if (!signal) return; // a send without an abort signal hangs forever and the test times out
          if (signal.aborted) reject(signal.reason);
          signal.addEventListener('abort', () => reject(signal.reason ?? new DOMException('aborted', 'AbortError')));
        });
      }
      if (behavior === 'network') throw new TypeError('fetch failed');
      if (behavior === 'accept-then-lose-response') { accept(String(key), canonical(body)); throw new TypeError('fetch failed'); }
      if (typeof behavior === 'object') return json(behavior.status, behavior.body ?? { statusCode: behavior.status, name: 'synthetic_error', message: 'synthetic' });
      if (!key) return json(400, { name: 'missing_idempotency_key' });
      return accept(key, canonical(body));
    },
    callsTo(to: string) { return calls.filter(call => call.body?.to === to); },
  };
}

export type RestFault = 'network' | { status: number; body?: unknown };
export function createPrimeRestEmulator(client: pg.Client, serviceKey: string) {
  const calls: { name: string; args: Record<string, unknown>; apikey: string | null; authorization: string | null }[] = [];
  const faults = new Map<string, { remaining: number; fault: RestFault }>();
  return {
    calls,
    /** Fail the next `times` calls to an RPC before they reach PostgreSQL. */
    fail(name: string, fault: RestFault, times = Number.POSITIVE_INFINITY) { faults.set(name, { remaining: times, fault }); },
    clearFaults() { faults.clear(); },
    async handle(url: URL, init: RequestInit): Promise<Response> {
      const headers = new Headers(init.headers);
      if (init.signal?.aborted) throw init.signal.reason;
      const name = url.pathname.slice('/rest/v1/rpc/'.length);
      const args = JSON.parse(String(init.body));
      calls.push({ name, args, apikey: headers.get('apikey'), authorization: headers.get('authorization') });
      if (headers.get('apikey') !== serviceKey || headers.get('authorization') !== `Bearer ${serviceKey}`) return json(401, { message: 'Invalid API key' });
      const fault = faults.get(name);
      if (fault && fault.remaining > 0) {
        fault.remaining -= 1;
        if (fault.fault === 'network') throw new TypeError('fetch failed');
        return json(fault.fault.status, fault.fault.body ?? { message: 'synthetic upstream failure' });
      }
      try {
        return json(200, await callRpc(client, name, args));
      } catch (error) {
        const e = error as { code?: string; message?: string };
        const status = e.code === '23505' ? 409 : e.code === '42501' ? 403 : e.code === '42883' ? 404 : 400;
        return json(status, { code: e.code ?? null, message: e.message ?? 'error', details: null, hint: null });
      }
    },
  };
}

/** Routes global fetch to the fakes; any other destination is recorded and refused. */
export function installTransport(resend: ReturnType<typeof createResendFake>, prime: ReturnType<typeof createPrimeRestEmulator>) {
  const unexpected: string[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    if (url.href === RESEND_URL && init.method === 'POST') return resend.handle(init);
    if (url.origin === PRIME_BASE && url.pathname.startsWith('/rest/v1/rpc/') && init.method === 'POST') return prime.handle(url, init);
    unexpected.push(url.origin);
    throw new Error('UNEXPECTED_DESTINATION');
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, unexpected };
}
