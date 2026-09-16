// Real PostgreSQL 17 harness self-checks and server crash/restart recovery (D-018).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { callRpc, count, RECEIPTS_SQL, requireRuntime, rows, runScript, startCluster, type Cluster } from '../helpers/postgres';
import { receiptArgs } from '../helpers/receipt-fixtures';
import { expireLease } from '../helpers/receipt-time';

let cluster: Cluster;
beforeAll(async () => { cluster = await startCluster(); }, 120_000);
afterAll(async () => { await cluster?.stop('fast'); }, 60_000);

describe('isolated PostgreSQL runtime', { timeout: 120_000 }, () => {
  it('fails loudly (never skips) when the portable runtime is missing', async () => {
    expect(requireRuntime()).toBe(resolve('.fsc-test/pgsql/runtime/pgsql/bin'));
    const bogus = resolve('.fsc-test/pgsql/runtime-that-does-not-exist/bin');
    expect(() => requireRuntime(bogus)).toThrow(/runtime missing.*postgres\.exe, initdb\.exe, pg_ctl\.exe/);
    await expect(startCluster({ bin: bogus })).rejects.toThrow(/runtime missing/);
  });

  it('is the pinned 17.11 server listening only on loopback in its own synthetic data directory', async () => {
    const db = await cluster.database();
    const [settings] = await rows(db.admin, `SELECT current_setting('server_version_num') AS version, current_setting('listen_addresses') AS listen, host(inet_server_addr()) AS addr, current_setting('data_directory') AS dir`);
    expect(settings.version).toBe('170011');
    expect(settings.listen).toBe('127.0.0.1');
    expect(settings.addr).toBe('127.0.0.1');
    const normalized = (path: string) => resolve(path).toLowerCase();
    expect(normalized(settings.dir)).toBe(normalized(cluster.dataDirectory));
    expect(normalized(settings.dir).startsWith(normalized('.fsc-test/postgres') + '\\')).toBe(true);
  });

  it('receipt migration refuses to run twice and leaves the existing schema untouched', async () => {
    const db = await cluster.database('migrated');
    const before = await count(db.admin, `SELECT count(*) FROM pg_proc WHERE proname LIKE 'fsc_%'`);
    expect(before).toBeGreaterThanOrEqual(7);
    await expect(runScript(db.admin, readFileSync(RECEIPTS_SQL, 'utf8'))).rejects.toThrow(/FSC_SCHEMA_ALREADY_EXISTS_REVIEW_DO_NOT_OVERWRITE/);
    expect(await count(db.admin, `SELECT count(*) FROM pg_proc WHERE proname LIKE 'fsc_%'`)).toBe(before);
  });

  it('receipt migration refuses a database without exactly one active FSC account and creates nothing', async () => {
    const db = await cluster.database('prime');
    await db.admin.query(`UPDATE public.accounts SET status = 'inactive' WHERE slug = 'fsc'`);
    await expect(runScript(db.admin, readFileSync(RECEIPTS_SQL, 'utf8'))).rejects.toThrow(/FSC_ACTIVE_ACCOUNT_DOMAIN_NOT_UNIQUE/);
    expect(await count(db.admin, `SELECT count(*) FROM pg_namespace WHERE nspname = 'fsc_private'`)).toBe(0);
    expect(await count(db.admin, `SELECT count(*) FROM pg_proc WHERE proname LIKE 'fsc_%'`)).toBe(0);
  });

  it('server process crash (pg_ctl immediate stop) mid-lease preserves committed state; restart recovers with the same key and envelope', async () => {
    const db = await cluster.database();
    const args = receiptArgs();
    const created = await callRpc(db.service, 'fsc_receipt_create_draft', args);
    expect(created.code).toBe('READY');
    const claim = await callRpc(db.service, 'fsc_effect_claim_draft', { p_slug: 'fsc', p_request: args.p_request, p_effect: 'company_email' });
    expect(claim.code).toBe('CLAIMED');

    await cluster.stop('immediate');
    await expect(cluster.connect(db.name)).rejects.toThrow();
    await cluster.start();

    const admin = await cluster.connect(db.name);
    const service = await cluster.connect(db.name, 'service_role');
    const [effect] = await rows(admin, `SELECT state, lease_token::text AS token, idempotency_key FROM fsc_private.assessment_effects WHERE request_id = $1 AND effect = 'company_email'`, [args.p_request]);
    expect(effect).toEqual({ state: 'inflight', token: claim.lease_token, idempotency_key: claim.idempotency_key });
    expect(await count(admin, `SELECT count(*) FROM fsc_private.assessment_receipts WHERE request_id = $1 AND receipt_id = $2`, [args.p_request, created.receipt_id])).toBe(1);

    // The crashed worker's lease is still live: a new worker must not send.
    expect((await callRpc(service, 'fsc_effect_claim_draft', { p_slug: 'fsc', p_request: args.p_request, p_effect: 'company_email' })).code).toBe('BUSY');
    await expireLease(admin, args.p_request, 'company_email');
    const reclaim = await callRpc(service, 'fsc_effect_claim_draft', { p_slug: 'fsc', p_request: args.p_request, p_effect: 'company_email' });
    expect(reclaim.code).toBe('CLAIMED');
    expect(reclaim.lease_token).not.toBe(claim.lease_token);
    expect(reclaim.idempotency_key).toBe(claim.idempotency_key);
    expect(reclaim.envelope).toEqual(claim.envelope);
    expect(reclaim.envelope).toEqual(args.p_envelopes.company_email);

    expect((await callRpc(service, 'fsc_effect_finish_draft', { p_slug: 'fsc', p_request: args.p_request, p_effect: 'company_email', p_token: claim.lease_token, p_state: 'succeeded', p_provider_id: 'synthetic-stale' })).code).toBe('STALE_LEASE');
    expect((await callRpc(service, 'fsc_effect_finish_draft', { p_slug: 'fsc', p_request: args.p_request, p_effect: 'company_email', p_token: reclaim.lease_token, p_state: 'succeeded', p_provider_id: 'synthetic-1' })).code).toBe('SUCCEEDED');
    const replay = await callRpc(service, 'fsc_receipt_create_draft', args);
    expect(replay).toEqual({ code: 'RECEIVED', receipt_id: created.receipt_id });
    const [final] = await rows(admin, `SELECT state, provider_id FROM fsc_private.assessment_effects WHERE request_id = $1 AND effect = 'company_email'`, [args.p_request]);
    expect(final).toEqual({ state: 'succeeded', provider_id: 'synthetic-1' });
  });
});
