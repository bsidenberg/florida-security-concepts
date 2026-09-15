// AM-004 admission counter against real PostgreSQL 17. Source digests are
// produced by the real lib/leads/admission.ts from synthetic documentation-range
// addresses, so the final raw-address scan checks what actually reached the DB.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type pg from 'pg';
import { trustedSourceDigest } from '../../lib/leads/admission';
import { callRpc, count, FSC_ACCOUNT, OTHER_ACCOUNT, privateTableText, rows, startCluster, type Cluster, type TestDatabase } from '../helpers/postgres';
import { raceProcesses, rpcCall } from '../helpers/processes';
import { receiptArgs } from '../helpers/receipt-fixtures';
import { setReceiptAge } from '../helpers/receipt-time';

const SYNTHETIC_KEY = 'a1'.repeat(32);
const ENV = { VERCEL: '1', VERCEL_ENV: 'production', FSC_ADMISSION_HMAC_KEY: SYNTHETIC_KEY } as unknown as NodeJS.ProcessEnv;
const ADDRESSES: string[] = [];
function sourceFor(address: string): string {
  ADDRESSES.push(address);
  const digest = trustedSourceDigest(new Headers({ 'x-vercel-forwarded-for': address }), ENV);
  if (!digest) throw new Error(`trustedSourceDigest returned null for synthetic ${address}`);
  return digest;
}

let cluster: Cluster;
let db: TestDatabase;
const databases: TestDatabase[] = [];
beforeAll(async () => { cluster = await startCluster(); db = await cluster.database(); databases.push(db); }, 120_000);
afterAll(async () => { await cluster?.stop('fast'); }, 60_000);

const create = (client: pg.Client, options: Parameters<typeof receiptArgs>[0]) => { const args = receiptArgs(options); return callRpc(client, 'fsc_receipt_create_draft', args).then(result => ({ args, result })); };
const counter = async (client: pg.Client, source: string) => (await rows(client, `SELECT cardinality(admitted_at) AS n, admitted_at, expires_at, t::text AS text FROM fsc_private.admission_counters t WHERE account_id = $1 AND source_digest = $2`, [FSC_ACCOUNT, source]))[0];
async function fill(client: pg.Client, source: string, n = 20) {
  const admitted: ReturnType<typeof receiptArgs>[] = [];
  for (let i = 0; i < n; i += 1) {
    const { args, result } = await create(client, { source });
    expect(result.code).toBe('READY');
    admitted.push(args);
  }
  return admitted;
}
async function shiftCounter(client: pg.Client, source: string, sql: string) {
  const result = await client.query(`UPDATE fsc_private.admission_counters SET ${sql} WHERE account_id = $1 AND source_digest = $2`, [FSC_ACCOUNT, source]);
  expect(result.rowCount).toBe(1);
}

describe('rolling 20 per 10 minutes per source', { timeout: 90_000 }, () => {
  it('admits 20 new IDs, returns RATE_LIMIT with retry_after about 600 s for the 21st, writes no receipt and does not extend the counter', async () => {
    const source = sourceFor('198.51.100.20');
    await fill(db.service, source);
    const full = await counter(db.admin, source);
    expect(full.n).toBe(20);
    const { args, result } = await create(db.service, { source });
    expect(result).toEqual({ code: 'RATE_LIMIT', retry_after: expect.any(Number) });
    expect(result.retry_after).toBeGreaterThanOrEqual(590);
    expect(result.retry_after).toBeLessThanOrEqual(600);
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_receipts WHERE request_id = $1`, [args.p_request])).toBe(0);
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_effects WHERE request_id = $1`, [args.p_request])).toBe(0);
    expect((await counter(db.admin, source)).text).toBe(full.text);
    // A different source is unaffected.
    expect((await create(db.service, { source: sourceFor('198.51.100.21') })).result.code).toBe('READY');
  });

  it('retry_after is the ceiling of seconds until the earliest retained admission leaves the window (minimum 1)', async () => {
    const source = sourceFor('198.51.100.22');
    await fill(db.service, source);
    await shiftCounter(db.admin, source, `admitted_at = ARRAY(SELECT t - interval '5 minutes' FROM unnest(admitted_at) t ORDER BY t), expires_at = expires_at - interval '5 minutes'`);
    const halfway = (await create(db.service, { source })).result;
    expect(halfway.code).toBe('RATE_LIMIT');
    expect(halfway.retry_after).toBeGreaterThanOrEqual(290);
    expect(halfway.retry_after).toBeLessThanOrEqual(300);
    await shiftCounter(db.admin, source, `admitted_at = ARRAY(SELECT clock_timestamp() - interval '9 minutes 59.2 seconds' + (ordinality * interval '1 millisecond') FROM unnest(admitted_at) WITH ORDINALITY ORDER BY ordinality)`);
    const almost = (await create(db.service, { source })).result;
    expect(almost).toEqual({ code: 'RATE_LIMIT', retry_after: 1 });
  });

  it('an existing ID at capacity is exempt (same receipt, NULL source allowed), a changed payload conflicts, and the counter is untouched', async () => {
    const source = sourceFor('198.51.100.23');
    const admitted = await fill(db.service, source);
    const before = await counter(db.admin, source);
    const first = await callRpc(db.service, 'fsc_receipt_create_draft', admitted[0]);
    expect(first.code).toBe('READY');
    expect(await callRpc(db.service, 'fsc_receipt_create_draft', { ...admitted[0], p_source: null })).toEqual(first);
    expect(await callRpc(db.service, 'fsc_receipt_create_draft', { ...admitted[19], p_source: sourceFor('198.51.100.99') })).toEqual({ code: 'READY', receipt_id: expect.any(String) });
    const changed = receiptArgs({ requestId: admitted[1].p_request, message: 'changed at capacity', source });
    expect(await callRpc(db.service, 'fsc_receipt_create_draft', changed)).toEqual({ code: 'CONFLICT' });
    expect((await counter(db.admin, source)).text).toBe(before.text);
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.admission_counters WHERE source_digest = $1`, [sourceFor('198.51.100.99')])).toBe(0);
  });

  it('rolling window: an admission 9m50s old still counts; once older than 10 minutes it is pruned and a new ID is admitted', async () => {
    const source = sourceFor('198.51.100.24');
    await fill(db.service, source);
    await shiftCounter(db.admin, source, `admitted_at[1] = clock_timestamp() - interval '9 minutes 50 seconds'`);
    expect((await create(db.service, { source })).result.code).toBe('RATE_LIMIT');
    await shiftCounter(db.admin, source, `admitted_at[1] = clock_timestamp() - interval '10 minutes 1 second'`);
    const before = await counter(db.admin, source);
    const oldest = before.admitted_at[0] as Date;
    const { result } = await create(db.service, { source });
    expect(result.code).toBe('READY');
    const after = await counter(db.admin, source);
    expect(after.n).toBe(20);
    expect((after.admitted_at as Date[]).map(d => d.getTime())).not.toContain(oldest.getTime());
    expect((after.expires_at as Date).getTime()).toBeGreaterThan((before.expires_at as Date).getTime());
    expect((await create(db.service, { source })).result.code).toBe('RATE_LIMIT');
  });

  it('IPv4 and its IPv4-mapped IPv6 form share one counter', async () => {
    const plain = sourceFor('198.51.100.25');
    const mapped = sourceFor('::ffff:198.51.100.25');
    expect(mapped).toBe(plain);
    await fill(db.service, plain, 19);
    expect((await create(db.service, { source: mapped })).result.code).toBe('READY');
    expect((await create(db.service, { source: plain })).result.code).toBe('RATE_LIMIT');
    expect((await counter(db.admin, plain)).n).toBe(20);
  });

  it.each([
    ['NULL', null], ['empty', ''], ['short', 'abc'], ['uppercase hex', 'A'.repeat(64)], ['63 hex', 'a'.repeat(63)], ['65 hex', 'a'.repeat(65)],
    ['raw address', '198.51.100.26'], ['digest with whitespace', `${'b'.repeat(64)} `],
  ])('%s source refuses a new ID with SOURCE_UNAVAILABLE and writes nothing, but an existing ID still replays', async (_label, source) => {
    const snapshot = async () => [await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_receipts`), await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_effects`), (await rows(db.admin, `SELECT t::text AS t FROM fsc_private.admission_counters t ORDER BY 1`)).map(r => r.t)];
    const existing = receiptArgs({ source: sourceFor('198.51.100.27') });
    const created = await callRpc(db.service, 'fsc_receipt_create_draft', existing);
    const before = await snapshot();
    const fresh = receiptArgs({ source });
    expect(await callRpc(db.service, 'fsc_receipt_create_draft', fresh)).toEqual({ code: 'SOURCE_UNAVAILABLE' });
    expect(await snapshot()).toEqual(before);
    expect(await callRpc(db.service, 'fsc_receipt_create_draft', { ...existing, p_source: source })).toEqual(created);
    expect(await snapshot()).toEqual(before);
  });
});

describe('cross-process admission contention', { timeout: 120_000 }, () => {
  it('five processes creating the same new ID with the same source produce one receipt and charge once', async () => {
    const source = sourceFor('198.51.100.30');
    const args = receiptArgs({ source });
    const reports = await raceProcesses(db.admin, { port: cluster.port, database: db.name }, Array.from({ length: 5 }, () => [rpcCall('fsc_receipt_create_draft', args)]));
    expect(new Set(reports.map(r => r.pid)).size).toBe(5);
    const values = reports.map(r => r.results[0]);
    expect(values.filter(v => v.error)).toEqual([]);
    expect(new Set(values.map(v => v.value.receipt_id)).size).toBe(1);
    expect(values.every(v => v.value.code === 'READY')).toBe(true);
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_receipts WHERE request_id = $1`, [args.p_request])).toBe(1);
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_effects WHERE request_id = $1`, [args.p_request])).toBe(3);
    expect((await counter(db.admin, source)).n).toBe(1);
  });

  it('five processes creating the same new ID from five different sources charge exactly one admission in total', async () => {
    const sources = [31, 32, 33, 34, 35].map(n => sourceFor(`198.51.100.${n}`));
    const args = receiptArgs({});
    const reports = await raceProcesses(db.admin, { port: cluster.port, database: db.name }, sources.map(source => [rpcCall('fsc_receipt_create_draft', { ...args, p_source: source })]));
    const values = reports.map(r => r.results[0]);
    expect(values.filter(v => v.error)).toEqual([]);
    expect(new Set(values.map(v => v.value.receipt_id)).size).toBe(1);
    const [{ total }] = await rows(db.admin, `SELECT coalesce(sum(cardinality(admitted_at)), 0)::int AS total FROM fsc_private.admission_counters WHERE source_digest = ANY($1)`, [sources]);
    expect(total).toBe(1);
  });

  it('four processes submitting 8 distinct new IDs each from one source admit exactly 20 and rate-limit the other 12', async () => {
    const source = sourceFor('198.51.100.40');
    const lists = Array.from({ length: 4 }, () => Array.from({ length: 8 }, () => rpcCall('fsc_receipt_create_draft', receiptArgs({ source }))));
    const ids = lists.flat().map(call => call.values[1] as string);
    const reports = await raceProcesses(db.admin, { port: cluster.port, database: db.name }, lists);
    expect(new Set(reports.map(r => r.pid)).size).toBe(4);
    const results = reports.flatMap(r => r.results);
    expect(results.filter(r => r.error)).toEqual([]);
    expect(results.filter(r => r.value.code === 'READY')).toHaveLength(20);
    expect(results.filter(r => r.value.code === 'RATE_LIMIT')).toHaveLength(12);
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_receipts WHERE request_id = ANY($1::uuid[])`, [ids])).toBe(20);
    expect((await counter(db.admin, source)).n).toBe(20);
  });
});

describe('cleanup racing admission across processes (D-023 M-5)', { timeout: 120_000 }, () => {
  it('repeated concurrent expiry + cleanup of counters while new IDs are admitted never produces an error in any process', async () => {
    const race = await cluster.database();
    databases.push(race);
    const sources = [1, 2, 3, 4].map(n => sourceFor(`198.51.101.${n}`));
    const createLists = [0, 1, 2, 3].map(child => Array.from({ length: 60 }, (_, i) => rpcCall('fsc_receipt_create_draft', receiptArgs({ source: sources[(child + i) % sources.length] }))));
    const ids = createLists.flat().map(call => call.values[1] as string);
    // One process keeps marking each counter expired (single-row updates), one keeps running the real cleanup.
    const expirer = Array.from({ length: 500 }, (_, i) => ({ sql: `UPDATE fsc_private.admission_counters SET expires_at = clock_timestamp() - interval '1 second' WHERE source_digest = $1`, values: [sources[i % sources.length]] }));
    const cleaner = Array.from({ length: 1000 }, () => ({ sql: `SELECT public.fsc_admission_cleanup_draft('fsc')`, values: [] as unknown[] }));
    const reports = await raceProcesses(race.admin, { port: cluster.port, database: race.name }, [...createLists, expirer, cleaner]);
    expect(new Set(reports.map(r => r.pid)).size).toBe(6);
    const errors = reports.flatMap(r => r.results.filter(result => result.error).map(result => `${result.code}: ${result.error}`));
    expect(errors).toEqual([]);
    const created = reports.slice(0, 4).flatMap(r => r.results.map(result => result.value));
    expect(created).toHaveLength(240);
    expect(created.filter(v => !['READY', 'RATE_LIMIT'].includes(v.code))).toEqual([]);
    const ready = created.filter(v => v.code === 'READY').length;
    expect(ready).toBeGreaterThan(0);
    expect(await count(race.admin, `SELECT count(*) FROM fsc_private.assessment_receipts WHERE request_id = ANY($1::uuid[])`, [ids])).toBe(ready);
    expect(reports[5].results.filter(result => typeof result.value === 'number' && result.value > 0).length).toBeGreaterThan(0);
  });
});

describe('rollback and cleanup', { timeout: 90_000 }, () => {
  it('a create that fails after admission rolls back both the charge and the receipt (fault injection on effect insert)', async () => {
    const faulty = await cluster.database();
    databases.push(faulty);
    const source = sourceFor('198.51.100.50');
    await faulty.admin.query(`CREATE FUNCTION public.synthetic_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYNTHETIC_EFFECT_INSERT_FAILURE'; END $$;
      CREATE TRIGGER zz_synthetic_fault BEFORE INSERT ON fsc_private.assessment_effects FOR EACH ROW EXECUTE FUNCTION public.synthetic_fault();`);
    const args = receiptArgs({ source });
    await expect(callRpc(faulty.service, 'fsc_receipt_create_draft', args)).rejects.toThrow(/SYNTHETIC_EFFECT_INSERT_FAILURE/);
    expect(await count(faulty.admin, `SELECT count(*) FROM fsc_private.assessment_receipts`)).toBe(0);
    expect(await count(faulty.admin, `SELECT count(*) FROM fsc_private.admission_counters`)).toBe(0);
    await faulty.admin.query(`DROP TRIGGER zz_synthetic_fault ON fsc_private.assessment_effects`);
    expect((await callRpc(faulty.service, 'fsc_receipt_create_draft', args)).code).toBe('READY');
    expect((await counter(faulty.admin, source)).n).toBe(1);
  });

  it('cleanup deletes only this account\'s expired counters and never touches receipts, effects, leads or payloads due for purge', async () => {
    const clean = await cluster.database();
    databases.push(clean);
    const live = sourceFor('198.51.100.60');
    const expired = sourceFor('198.51.100.61');
    const otherExpired = sourceFor('198.51.100.62');
    const accepted = receiptArgs({ source: live });
    expect((await callRpc(clean.service, 'fsc_receipt_create_draft', accepted)).code).toBe('READY');
    const lease = await callRpc(clean.service, 'fsc_effect_claim_draft', { p_slug: 'fsc', p_request: accepted.p_request, p_effect: 'company_email' });
    await callRpc(clean.service, 'fsc_effect_finish_draft', { p_slug: 'fsc', p_request: accepted.p_request, p_effect: 'company_email', p_token: lease.lease_token, p_state: 'succeeded', p_provider_id: 'synthetic' });
    const prime = await callRpc(clean.service, 'fsc_effect_claim_draft', { p_slug: 'fsc', p_request: accepted.p_request, p_effect: 'prime_lead' });
    expect((await callRpc(clean.service, 'fsc_prime_record_draft', { p_slug: 'fsc', p_request: accepted.p_request, p_token: prime.lease_token })).code).toBe('SUCCEEDED');
    const due = receiptArgs({ source: live });
    await callRpc(clean.service, 'fsc_receipt_create_draft', due);
    await setReceiptAge(clean.admin, due.p_request, '8 days');
    await clean.admin.query(`INSERT INTO fsc_private.admission_counters (account_id, source_digest, admitted_at, expires_at) VALUES
      ($1, $2, ARRAY[clock_timestamp() - interval '11 minutes'], clock_timestamp() - interval '1 minute'),
      ($3, $4, ARRAY[clock_timestamp() - interval '11 minutes'], clock_timestamp() - interval '1 minute')`, [FSC_ACCOUNT, expired, OTHER_ACCOUNT, otherExpired]);
    const snapshot = async () => ({
      receipts: (await rows(clean.admin, `SELECT t::text AS t FROM fsc_private.assessment_receipts t ORDER BY request_id`)).map(r => r.t),
      effects: (await rows(clean.admin, `SELECT t::text AS t FROM fsc_private.assessment_effects t ORDER BY request_id, effect`)).map(r => r.t),
      leads: (await rows(clean.admin, `SELECT t::text AS t FROM public.leads t ORDER BY id`)).map(r => r.t),
      accounts: (await rows(clean.admin, `SELECT t::text AS t FROM public.accounts t ORDER BY id`)).map(r => r.t),
    });
    const before = await snapshot();
    expect(before.leads).toHaveLength(1);

    expect(await callRpc(clean.service, 'fsc_admission_cleanup_draft', { p_slug: 'fsc' })).toBe(1);
    expect((await rows(clean.admin, `SELECT account_id, source_digest FROM fsc_private.admission_counters ORDER BY account_id`)).map(r => [r.account_id, r.source_digest])).toEqual([[FSC_ACCOUNT, live], [OTHER_ACCOUNT, otherExpired]]);
    expect(await snapshot()).toEqual(before);
    expect(await callRpc(clean.service, 'fsc_admission_cleanup_draft', { p_slug: 'fsc' })).toBe(0);
    await expect(callRpc(clean.service, 'fsc_admission_cleanup_draft', { p_slug: 'fpb' })).rejects.toThrow(/FSC_ACCOUNT_REFUSED/);
  });

  it('counter rows hold only account, digest, bounded timestamps and expiry', async () => {
    const columns = await rows(db.admin, `SELECT column_name FROM information_schema.columns WHERE table_schema = 'fsc_private' AND table_name = 'admission_counters' ORDER BY ordinal_position`);
    expect(columns.map(c => c.column_name)).toEqual(['account_id', 'source_digest', 'admitted_at', 'expires_at']);
    await expect(db.admin.query(`INSERT INTO fsc_private.admission_counters VALUES ($1, $2, ARRAY(SELECT clock_timestamp() FROM generate_series(1, 21)), clock_timestamp())`, [FSC_ACCOUNT, 'c'.repeat(64)])).rejects.toMatchObject({ code: '23514' });
    await expect(db.admin.query(`INSERT INTO fsc_private.admission_counters VALUES ($1, '198.51.100.70', '{}', clock_timestamp())`, [FSC_ACCOUNT])).rejects.toMatchObject({ code: '23514' });
  });

  it('no raw source address used in this file appears in any private table or lead row', async () => {
    expect(ADDRESSES.length).toBeGreaterThan(20);
    for (const database of databases) {
      const text = (await privateTableText(database.admin)) + (await rows(database.admin, `SELECT t::text AS t FROM public.leads t`)).map(r => r.t).join('\n');
      expect(text.length).toBeGreaterThan(0);
      for (const address of new Set(ADDRESSES)) expect(text.includes(address), `${database.name} contains ${address}`).toBe(false);
      expect(text).not.toMatch(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
      expect(text).not.toMatch(/::ffff:/i);
    }
  });
});
