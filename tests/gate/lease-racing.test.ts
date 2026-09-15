// AM-003 effect leases: separate OS processes racing claims, stale tokens,
// expired-lease reclaim with the immutable key/envelope, and cutoff refusal.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { callRpc, rows, startCluster, type Cluster, type TestDatabase } from '../helpers/postgres';
import { raceProcesses, rpcCall } from '../helpers/processes';
import { digestFor, receiptArgs } from '../helpers/receipt-fixtures';
import { expireLease } from '../helpers/receipt-time';

let cluster: Cluster;
let db: TestDatabase;
beforeAll(async () => { cluster = await startCluster(); db = await cluster.database(); }, 120_000);
afterAll(async () => { await cluster?.stop('fast'); }, 60_000);

const claimArgs = (request: string, effect = 'company_email') => ({ p_slug: 'fsc', p_request: request, p_effect: effect });
const claim = (client: pg.Client, request: string, effect = 'company_email') => callRpc(client, 'fsc_effect_claim_draft', claimArgs(request, effect));
const finish = (client: pg.Client, request: string, token: string, state: string, provider: string | null = null, effect = 'company_email') =>
  callRpc(client, 'fsc_effect_finish_draft', { p_slug: 'fsc', p_request: request, p_effect: effect, p_token: token, p_state: state, p_provider_id: provider, p_error: state === 'uncertain' ? 'ambiguous' : null });
const effectRow = async (request: string, effect = 'company_email') => (await rows(db.admin, `SELECT state, lease_token::text AS token, idempotency_key, first_attempt_at, retry_cutoff, lease_until, provider_id FROM fsc_private.assessment_effects WHERE request_id = $1 AND effect = $2`, [request, effect]))[0];
async function newReceipt(label: string) {
  const args = receiptArgs({ source: digestFor(label) });
  expect((await callRpc(db.service, 'fsc_receipt_create_draft', args)).code).toBe('READY');
  return args;
}

describe('cross-process lease contention', { timeout: 90_000 }, () => {
  it('six separate node processes race one claim: exactly one CLAIMED, five BUSY, and the stored token is the winner', async () => {
    const args = await newReceipt('race-claim');
    const reports = await raceProcesses(db.admin, { port: cluster.port, database: db.name }, Array.from({ length: 6 }, () => [rpcCall('fsc_effect_claim_draft', claimArgs(args.p_request))]));
    expect(new Set(reports.map(r => r.pid)).size).toBe(6);
    expect(reports.map(r => r.pid)).not.toContain(process.pid);
    expect(new Set(reports.map(r => r.backend)).size).toBe(6);
    const results = reports.map(r => r.results[0]);
    expect(results.filter(r => r.error)).toEqual([]);
    const codes = results.map(r => r.value.code).sort();
    expect(codes).toEqual(['BUSY', 'BUSY', 'BUSY', 'BUSY', 'BUSY', 'CLAIMED']);
    const winner = results.find(r => r.value.code === 'CLAIMED')!.value;
    const row = await effectRow(args.p_request);
    expect(row.state).toBe('inflight');
    expect(row.token).toBe(winner.lease_token);
    expect(winner.idempotency_key).toBe(row.idempotency_key);
    expect(winner.envelope).toEqual(args.p_envelopes.company_email);
    expect(winner.prior_uncertain).toBe(false);
  });

  it('after the winner dies (lease expiry) four processes race the reclaim: exactly one wins with the identical key and envelope', async () => {
    const args = await newReceipt('race-reclaim');
    const first = await claim(db.service, args.p_request);
    expect(first.code).toBe('CLAIMED');
    expect(first.prior_uncertain).toBe(false);
    const before = await effectRow(args.p_request);
    await expireLease(db.admin, args.p_request, 'company_email');
    const reports = await raceProcesses(db.admin, { port: cluster.port, database: db.name }, Array.from({ length: 4 }, () => [rpcCall('fsc_effect_claim_draft', claimArgs(args.p_request))]));
    expect(new Set(reports.map(r => r.pid)).size).toBe(4);
    const values = reports.map(r => r.results[0].value);
    expect(values.map(v => v.code).sort()).toEqual(['BUSY', 'BUSY', 'BUSY', 'CLAIMED']);
    const winner = values.find(v => v.code === 'CLAIMED');
    expect(winner.lease_token).not.toBe(first.lease_token);
    expect(winner.idempotency_key).toBe(first.idempotency_key);
    expect(winner.envelope).toEqual(first.envelope);
    expect(winner.prior_uncertain).toBe(true);
    const after = await effectRow(args.p_request);
    expect(after.token).toBe(winner.lease_token);
    expect(after.first_attempt_at).toEqual(before.first_attempt_at);
    expect(after.retry_cutoff).toEqual(before.retry_cutoff);
  });
});

describe('lease tokens', { timeout: 60_000 }, () => {
  it('an unknown or stale token can never finish; only the current lease holder records success once', async () => {
    const args = await newReceipt('stale-token');
    const first = await claim(db.service, args.p_request);
    expect((await finish(db.service, args.p_request, randomUUID(), 'succeeded', 'synthetic-forged')).code).toBe('STALE_LEASE');
    expect((await effectRow(args.p_request)).state).toBe('inflight');

    await expireLease(db.admin, args.p_request, 'company_email');
    // Expired but not yet reclaimed: the old holder still may not record.
    expect((await finish(db.service, args.p_request, first.lease_token, 'succeeded', 'synthetic-late')).code).toBe('STALE_LEASE');
    const second = await claim(db.service, args.p_request);
    expect(second.code).toBe('CLAIMED');
    expect((await finish(db.service, args.p_request, first.lease_token, 'failed')).code).toBe('STALE_LEASE');
    expect((await finish(db.service, args.p_request, second.lease_token, 'succeeded', 'synthetic-current')).code).toBe('SUCCEEDED');
    expect((await finish(db.service, args.p_request, second.lease_token, 'uncertain')).code).toBe('STALE_LEASE');
    const row = await effectRow(args.p_request);
    expect(row).toMatchObject({ state: 'succeeded', token: null, provider_id: 'synthetic-current' });
    expect((await claim(db.service, args.p_request)).code).toBe('SUCCEEDED');
    const [receipt] = await rows(db.admin, `SELECT accepted_at IS NOT NULL AS accepted FROM fsc_private.assessment_receipts WHERE request_id = $1`, [args.p_request]);
    expect(receipt.accepted).toBe(true);
  });

  it('an uncertain finish releases the lease and the next claim reuses the same key and envelope', async () => {
    const args = await newReceipt('uncertain-reclaim');
    const first = await claim(db.service, args.p_request);
    expect((await finish(db.service, args.p_request, first.lease_token, 'uncertain')).code).toBe('UNCERTAIN');
    expect(await effectRow(args.p_request)).toMatchObject({ state: 'uncertain', token: null });
    const again = await claim(db.service, args.p_request);
    expect(first.prior_uncertain).toBe(false);
    expect(again).toMatchObject({ code: 'CLAIMED', idempotency_key: first.idempotency_key, envelope: first.envelope, prior_uncertain: true });
  });

  it('prior_uncertain is false for a first claim and for a reclaim after a definitive failure (round-2 contract)', async () => {
    const args = await newReceipt('prior-after-failed');
    const first = await claim(db.service, args.p_request);
    expect(first.prior_uncertain).toBe(false);
    expect((await finish(db.service, args.p_request, first.lease_token, 'failed')).code).toBe('FAILED');
    const again = await claim(db.service, args.p_request);
    expect(again).toMatchObject({ code: 'CLAIMED', idempotency_key: first.idempotency_key, prior_uncertain: false });
    expect((await finish(db.service, args.p_request, again.lease_token, 'failed')).code).toBe('FAILED');
    expect(await effectRow(args.p_request)).toMatchObject({ state: 'failed', token: null });
  });

  it('finish downgrades a definitive failure to UNCERTAIN when the claim came from an uncertain state (round-2 contract)', async () => {
    const args = await newReceipt('finish-downgrade');
    const first = await claim(db.service, args.p_request);
    expect((await finish(db.service, args.p_request, first.lease_token, 'uncertain')).code).toBe('UNCERTAIN');
    const retry = await claim(db.service, args.p_request);
    expect(retry.prior_uncertain).toBe(true);
    const result = await callRpc(db.service, 'fsc_effect_finish_draft', { p_slug: 'fsc', p_request: args.p_request, p_effect: 'company_email', p_token: retry.lease_token, p_state: 'failed', p_provider_id: null, p_error: 'configuration' });
    expect(result.code).toBe('UNCERTAIN');
    const [row] = await rows(db.admin, `SELECT state, error_category, lease_token FROM fsc_private.assessment_effects WHERE request_id = $1 AND effect = 'company_email'`, [args.p_request]);
    expect(row).toEqual({ state: 'uncertain', error_category: 'configuration', lease_token: null });
  });

  // R3-1: a worker that died holding a lease may already have reached the provider, so reclaiming an
  // EXPIRED inflight lease makes the new claim's origin 'uncertain' whatever the original claim came from.
  async function reclaimExpired(label: string, origin: 'pending' | 'failed') {
    const args = await newReceipt(label);
    let lease = await claim(db.service, args.p_request);
    expect(lease.code).toBe('CLAIMED');
    if (origin === 'failed') {
      expect((await finish(db.service, args.p_request, lease.lease_token, 'failed')).code).toBe('FAILED');
      lease = await claim(db.service, args.p_request);
      expect(lease).toMatchObject({ code: 'CLAIMED', prior_uncertain: false });
    }
    await expireLease(db.admin, args.p_request, 'company_email');
    const reclaim = await claim(db.service, args.p_request);
    expect(reclaim).toMatchObject({ code: 'CLAIMED', prior_uncertain: true, idempotency_key: lease.idempotency_key });
    return { args, reclaim };
  }

  it.each(['pending', 'failed'] as const)('R3-1: after an expired lease that was claimed from %s, a reclaim finishing failed returns UNCERTAIN and stores uncertain/configuration', async origin => {
    const { args, reclaim } = await reclaimExpired(`r3-finish-${origin}`, origin);
    const result = await callRpc(db.service, 'fsc_effect_finish_draft', { p_slug: 'fsc', p_request: args.p_request, p_effect: 'company_email', p_token: reclaim.lease_token, p_state: 'failed', p_provider_id: null, p_error: 'configuration' });
    expect(result.code).toBe('UNCERTAIN');
    const [row] = await rows(db.admin, `SELECT state, error_category, lease_token, claimed_from_state FROM fsc_private.assessment_effects WHERE request_id = $1 AND effect = 'company_email'`, [args.p_request]);
    expect(row).toEqual({ state: 'uncertain', error_category: 'configuration', lease_token: null, claimed_from_state: null });
  });

  it.each(['pending', 'failed'] as const)('R3-1: a direct service_role UPDATE to failed on a reclaimed expired lease (origin %s) is rejected by the trigger', async origin => {
    const { args } = await reclaimExpired(`r3-trigger-${origin}`, origin);
    const before = (await rows(db.admin, `SELECT t::text AS t FROM fsc_private.assessment_effects t WHERE request_id = $1 AND effect = 'company_email'`, [args.p_request]))[0].t;
    await expect(db.service.query(`UPDATE fsc_private.assessment_effects SET state = 'failed', error_category = 'configuration', lease_token = NULL, lease_until = NULL, claimed_from_state = NULL WHERE request_id = $1 AND effect = 'company_email'`, [args.p_request])).rejects.toThrow(/FSC_IMMUTABLE_EFFECT/);
    expect((await rows(db.admin, `SELECT t::text AS t FROM fsc_private.assessment_effects t WHERE request_id = $1 AND effect = 'company_email'`, [args.p_request]))[0].t).toBe(before);
  });

  it('rejects finishing prime_lead or an unknown state through the email finish RPC', async () => {
    const args = await newReceipt('finish-invalid');
    const lease = await claim(db.service, args.p_request);
    await expect(finish(db.service, args.p_request, lease.lease_token, 'skipped')).rejects.toThrow(/FSC_INVALID_EFFECT_FINISH/);
    await expect(finish(db.service, args.p_request, lease.lease_token, 'succeeded', null, 'prime_lead')).rejects.toThrow(/FSC_INVALID_EFFECT_FINISH/);
    expect((await effectRow(args.p_request)).token).toBe(lease.lease_token);
  });
});

describe('provider retry cutoff', { timeout: 60_000 }, () => {
  it('refuses a claim when the stored retry cutoff is under 15 s away and leaves the effect unchanged', async () => {
    const args = await newReceipt('cutoff-pending');
    await db.admin.query(`WITH t AS (SELECT clock_timestamp() - interval '23 hours 54 minutes 50 seconds' AS first) UPDATE fsc_private.assessment_effects SET first_attempt_at = t.first, retry_cutoff = t.first + interval '23 hours 55 minutes' FROM t WHERE request_id = $1 AND effect = 'company_email'`, [args.p_request]);
    const before = await effectRow(args.p_request);
    expect((await claim(db.service, args.p_request)).code).toBe('CUTOFF');
    expect(await effectRow(args.p_request)).toEqual(before);
  });

  it('an uncertain send past its cutoff is never reclaimed', async () => {
    const args = await newReceipt('cutoff-uncertain');
    const lease = await claim(db.service, args.p_request);
    expect((await finish(db.service, args.p_request, lease.lease_token, 'uncertain')).code).toBe('UNCERTAIN');
    await db.admin.query('BEGIN');
    await db.admin.query('SET LOCAL session_replication_role = replica');
    await db.admin.query(`UPDATE fsc_private.assessment_effects SET first_attempt_at = first_attempt_at - interval '23 hours 55 minutes', retry_cutoff = retry_cutoff - interval '23 hours 55 minutes' WHERE request_id = $1 AND effect = 'company_email'`, [args.p_request]);
    await db.admin.query('COMMIT');
    for (let attempt = 0; attempt < 3; attempt += 1) expect((await claim(db.service, args.p_request)).code).toBe('CUTOFF');
    expect(await effectRow(args.p_request)).toMatchObject({ state: 'uncertain', token: null });
  });

  it('a lease granted near the cutoff never extends past the cutoff', async () => {
    const args = await newReceipt('cutoff-bounded');
    await db.admin.query(`WITH t AS (SELECT clock_timestamp() - interval '23 hours 54 minutes 40 seconds' AS first) UPDATE fsc_private.assessment_effects SET first_attempt_at = t.first, retry_cutoff = t.first + interval '23 hours 55 minutes' FROM t WHERE request_id = $1 AND effect = 'company_email'`, [args.p_request]);
    const lease = await claim(db.service, args.p_request);
    expect(lease.code).toBe('CLAIMED');
    const row = await effectRow(args.p_request);
    expect(row.lease_until.getTime()).toBeLessThanOrEqual(row.retry_cutoff.getTime());
    expect(Date.parse(lease.lease_until)).toBeLessThanOrEqual(Date.parse(lease.retry_cutoff));
  });
});
