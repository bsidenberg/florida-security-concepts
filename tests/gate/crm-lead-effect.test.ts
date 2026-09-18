// AM-005 / S-CRM-001 SQL contract against real PostgreSQL 17 (synthetic data only).
// Every test runs the migration exactly as written (sql/fsc-crm-lead-effect.draft.sql)
// on top of the exact AM-003 template the rest of the gate suite uses; the AM-003
// template itself is never modified (helpers/crm.ts applies the migration per
// database). Contract: harness/sessions/S-CRM-001-crm-intake-contract.md §5, §8, §14.1.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import type pg from 'pg';
import { callRpc, count, FSC_ACCOUNT, OTHER_ACCOUNT, rows, runScript, startCluster, type Cluster, type TestDatabase } from '../helpers/postgres';
import { raceProcesses, rpcCall } from '../helpers/processes';
import { digestFor, receiptArgs, uuid4 } from '../helpers/receipt-fixtures';
import { expireLease, setReceiptAge } from '../helpers/receipt-time';
import { applyCrmMigration, CRM_REPORT_SQL_PATH, CRM_ROLLBACK_NARROW_SQL_PATH, CRM_ROLLBACK_SQL_PATH, CRM_SQL_PATH, crmDatabase, REAL_RPC_SHAPES } from '../helpers/crm';

const CRM_SQL = readFileSync(CRM_SQL_PATH, 'utf8');
const ROLLBACK_SQL = readFileSync(CRM_ROLLBACK_SQL_PATH, 'utf8');
/** Read lazily so a missing file fails its own tests with a clear assertion instead of vaporizing the suite. */
function narrowSql(): string {
  expect(existsSync(CRM_ROLLBACK_NARROW_SQL_PATH), `missing ${CRM_ROLLBACK_NARROW_SQL_PATH}`).toBe(true);
  return readFileSync(CRM_ROLLBACK_NARROW_SQL_PATH, 'utf8');
}
const CRM_FN = 'public.fsc_crm_claim_draft(text,uuid)';
const DENIED_ROLES = ['anon', 'authenticated', 'fsc_public_probe'];
const REPORT_COLUMNS = ['receipt_id', 'request_id', 'effect', 'state', 'error_category', 'first_attempt_at', 'retry_cutoff', 'updated_at', 'purged_at'];

let cluster: Cluster;
let db: TestDatabase; // AM-003 + AM-005
beforeAll(async () => { cluster = await startCluster(); db = await crmDatabase(cluster); }, 120_000);
afterAll(async () => { await cluster?.stop('fast'); }, 60_000);

const keys = (value: Record<string, unknown>) => Object.keys(value).sort();
const crmClaim = (client: pg.Client, request: string, slug = 'fsc') => callRpc(client, 'fsc_crm_claim_draft', { p_slug: slug, p_request: request });
const claim = (client: pg.Client, request: string, effect: string) => callRpc(client, 'fsc_effect_claim_draft', { p_slug: 'fsc', p_request: request, p_effect: effect });
const finish = (client: pg.Client, request: string, effect: string, token: string, state: string, provider: string | null = null, error: string | null = null) =>
  callRpc(client, 'fsc_effect_finish_draft', { p_slug: 'fsc', p_request: request, p_effect: effect, p_token: token, p_state: state, p_provider_id: provider, p_error: error });
const crmRow = async (target: TestDatabase, request: string) => (await rows(target.admin, `SELECT state, idempotency_key, provider_id, error_category, first_attempt_at, retry_cutoff, lease_token::text AS token, lease_until, claimed_from_state FROM fsc_private.assessment_effects WHERE request_id = $1 AND effect = 'crm_lead'`, [request]))[0];
const crmRowCount = (target: TestDatabase, request: string) => count(target.admin, `SELECT count(*) FROM fsc_private.assessment_effects WHERE request_id = $1 AND effect = 'crm_lead'`, [request]);
const storedPayload = async (target: TestDatabase, request: string) => (await rows(target.admin, `SELECT payload FROM fsc_private.assessment_receipts WHERE request_id = $1`, [request]))[0].payload;

async function created(target: TestDatabase, label: string, options: Parameters<typeof receiptArgs>[0] = {}) {
  const args = receiptArgs({ source: digestFor(label), ...options });
  const result = await callRpc(target.service, 'fsc_receipt_create_draft', args);
  expect(result.code).toBe('READY');
  return args;
}
/** Creates a receipt and records the company email as durably accepted, through the real RPCs. */
async function accepted(target: TestDatabase, label: string, options: Parameters<typeof receiptArgs>[0] = {}) {
  const args = await created(target, label, options);
  const lease = await claim(target.service, args.p_request, 'company_email');
  expect(lease.code).toBe('CLAIMED');
  expect((await finish(target.service, args.p_request, 'company_email', lease.lease_token, 'succeeded', 'synthetic-resend-id')).code).toBe('SUCCEEDED');
  return args;
}

async function catalogSnapshot(admin: pg.Client) {
  const constraints = await rows(admin, `SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'fsc_private.assessment_effects'::regclass ORDER BY conname`);
  const functions = await rows(admin, `SELECT p.oid::regprocedure::text AS signature, md5(p.prosrc) AS body, p.prosecdef, p.proconfig, p.proacl::text AS acl
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE (n.nspname = 'public' AND p.proname LIKE 'fsc\\_%') OR n.nspname = 'fsc_private' ORDER BY 1`);
  const triggers = await rows(admin, `SELECT tgname, pg_get_triggerdef(oid) AS def FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN ('fsc_private.assessment_effects'::regclass, 'fsc_private.assessment_receipts'::regclass) ORDER BY 1`);
  const grants = await rows(admin, `SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants WHERE table_schema = 'fsc_private' ORDER BY 1, 2, 3`);
  return { constraints, functions, triggers, grants };
}
const checkDef = (snapshot: Awaited<ReturnType<typeof catalogSnapshot>>, column: string) => snapshot.constraints.find(c => c.def.startsWith('CHECK') && new RegExp(`\\(${column} = ANY|\\(\\(${column} = ANY`).test(c.def));

describe('migration application and preflight', { timeout: 90_000 }, () => {
  it('applies on AM-003, widens exactly the two CHECKs in place (same names), adds one function and replaces no existing function body, trigger or grant', async () => {
    const target = await cluster.database('migrated');
    const before = await catalogSnapshot(target.admin);
    await applyCrmMigration(target.admin);
    const after = await catalogSnapshot(target.admin);

    expect(after.constraints.map(c => c.conname)).toEqual(before.constraints.map(c => c.conname));
    const effectBefore = checkDef(before, 'effect')!;
    const categoryBefore = checkDef(before, 'error_category')!;
    expect(effectBefore, 'AM-003 effect CHECK located').toBeDefined();
    expect(categoryBefore, 'AM-003 error_category CHECK located').toBeDefined();
    const effectAfter = after.constraints.find(c => c.conname === effectBefore.conname)!;
    const categoryAfter = after.constraints.find(c => c.conname === categoryBefore.conname)!;
    for (const value of ['company_email', 'customer_email', 'prime_lead', 'crm_lead']) expect(effectAfter.def).toContain(`'${value}'`);
    for (const value of ['provider_unavailable', 'ambiguous', 'database_unavailable', 'cutoff', 'configuration', 'conflict', 'validation']) expect(categoryAfter.def).toContain(`'${value}'`);
    expect(effectBefore.def).not.toContain('crm_lead');
    expect(categoryBefore.def).not.toContain('conflict');
    // Every other constraint is byte-identical.
    const others = (s: typeof before) => s.constraints.filter(c => c.conname !== effectBefore.conname && c.conname !== categoryBefore.conname);
    expect(others(after)).toEqual(others(before));
    // Exactly one new function; every AM-003 function (body, security, config, ACL) is unchanged.
    expect(after.functions.filter(f => f.signature !== 'fsc_crm_claim_draft(text,uuid)')).toEqual(before.functions);
    expect(after.functions.map(f => f.signature)).toContain('fsc_crm_claim_draft(text,uuid)');
    expect(after.functions).toHaveLength(before.functions.length + 1);
    expect(after.triggers).toEqual(before.triggers);
    expect(after.grants).toEqual(before.grants);
  });

  it('the widened CHECKs still reject unknown effects/categories and accept every AM-003 value', async () => {
    const args = await created(db, 'check-widen');
    await expect(db.admin.query(`INSERT INTO fsc_private.assessment_effects (account_id, request_id, effect) VALUES ($1, $2, 'crm_bogus')`, [FSC_ACCOUNT, args.p_request])).rejects.toMatchObject({ code: '23514' });
    await expect(db.admin.query(`UPDATE fsc_private.assessment_effects SET error_category = 'not_a_category' WHERE request_id = $1 AND effect = 'prime_lead'`, [args.p_request])).rejects.toMatchObject({ code: '23514' });
    for (const category of ['provider_unavailable', 'ambiguous', 'database_unavailable', 'cutoff', 'configuration', 'conflict', 'validation']) {
      await db.admin.query(`UPDATE fsc_private.assessment_effects SET error_category = $2 WHERE request_id = $1 AND effect = 'prime_lead'`, [args.p_request, category]);
    }
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_effects WHERE request_id = $1 AND error_category = 'validation'`, [args.p_request])).toBe(1);
  });

  it('before the migration a crm_lead row is impossible (AM-003 CHECK) — proving the widening is what enables it', async () => {
    const target = await cluster.database('migrated');
    const args = await created(target, 'pre-check');
    await expect(target.admin.query(`INSERT INTO fsc_private.assessment_effects (account_id, request_id, effect) VALUES ($1, $2, 'crm_lead')`, [FSC_ACCOUNT, args.p_request])).rejects.toMatchObject({ code: '23514' });
  });

  it('a second application refuses with FSC_CRM_CLAIM_FUNCTION_ALREADY_EXISTS and changes nothing', async () => {
    const target = await crmDatabase(cluster);
    const args = await accepted(target, 'second-apply');
    expect((await crmClaim(target.service, args.p_request)).code).toBe('CLAIMED');
    const before = await catalogSnapshot(target.admin);
    const data = await rows(target.admin, `SELECT e::text AS t FROM fsc_private.assessment_effects e ORDER BY 1`);
    await expect(runScript(target.admin, CRM_SQL)).rejects.toThrow(/FSC_CRM_CLAIM_FUNCTION_ALREADY_EXISTS_REVIEW_DO_NOT_OVERWRITE/);
    expect(await catalogSnapshot(target.admin)).toEqual(before);
    expect(await rows(target.admin, `SELECT e::text AS t FROM fsc_private.assessment_effects e ORDER BY 1`)).toEqual(data);
  });

  it('refuses on a Prime database without AM-003 and creates nothing', async () => {
    const target = await cluster.database('prime');
    await expect(runScript(target.admin, CRM_SQL)).rejects.toThrow(/FSC_CRM_EXPECTED_RECEIPTS_MIGRATION_MISSING_APPLY_AM003_FIRST/);
    const [{ fn }] = await rows(target.admin, `SELECT to_regprocedure($1) AS fn`, [CRM_FN]);
    expect(fn).toBeNull();
  });

  it('refuses when the FSC account identity guard fails (inactive account) and changes nothing', async () => {
    const target = await cluster.database('migrated');
    await target.admin.query(`UPDATE public.accounts SET status = 'inactive' WHERE slug = 'fsc'`);
    const before = await catalogSnapshot(target.admin);
    await expect(runScript(target.admin, CRM_SQL)).rejects.toThrow(/FSC_ACCOUNT_REFUSED/);
    expect(await catalogSnapshot(target.admin)).toEqual(before);
  });

  it.each([
    ['effect CHECK drifted (hand-added value)', 'effect', `CHECK (effect IN ('company_email','customer_email','prime_lead','hand_added'))`, 'replace', /FSC_CRM_UNEXPECTED_EFFECT_CHECK/],
    ['effect CHECK duplicated', 'effect', `CHECK (effect <> '')`, 'add', /FSC_CRM_UNEXPECTED_EFFECT_CHECK/],
    ['error_category CHECK drifted (value removed)', 'error_category', `CHECK (error_category IN ('provider_unavailable','ambiguous','database_unavailable','cutoff'))`, 'replace', /FSC_CRM_UNEXPECTED_ERROR_CATEGORY_CHECK/],
    ['error_category CHECK duplicated', 'error_category', `CHECK (error_category <> '')`, 'add', /FSC_CRM_UNEXPECTED_ERROR_CATEGORY_CHECK/],
  ] as const)('strict constraint discovery (D-031 m-1): %s → RAISE and nothing changes', async (_label, column, definition, mode, error) => {
    const target = await cluster.database('migrated');
    const original = checkDef(await catalogSnapshot(target.admin), column)!;
    expect(original, `AM-003 ${column} CHECK located`).toBeDefined();
    if (mode === 'replace') {
      await target.admin.query(`ALTER TABLE fsc_private.assessment_effects DROP CONSTRAINT ${original.conname}`);
      await target.admin.query(`ALTER TABLE fsc_private.assessment_effects ADD CONSTRAINT ${original.conname} ${definition}`);
    } else {
      await target.admin.query(`ALTER TABLE fsc_private.assessment_effects ADD CONSTRAINT fsc_synthetic_extra_${column}_check ${definition}`);
    }
    const before = await catalogSnapshot(target.admin);
    await expect(runScript(target.admin, CRM_SQL)).rejects.toThrow(error);
    expect(await catalogSnapshot(target.admin)).toEqual(before);
  });

  it('applies to a database that already holds AM-003 rows in every state (existing rows satisfy the widened CHECKs)', async () => {
    const target = await cluster.database('migrated');
    const ok = await accepted(target, 'pre-rows-ok');
    const uncertain = await created(target, 'pre-rows-uncertain');
    const lease = await claim(target.service, uncertain.p_request, 'company_email');
    await finish(target.service, uncertain.p_request, 'company_email', lease.lease_token, 'uncertain', null, 'ambiguous');
    const rowsBefore = await rows(target.admin, `SELECT e::text AS t FROM fsc_private.assessment_effects e ORDER BY 1`);
    await applyCrmMigration(target.admin);
    expect(await rows(target.admin, `SELECT e::text AS t FROM fsc_private.assessment_effects e ORDER BY 1`)).toEqual(rowsBefore);
    expect(await crmRowCount(target, ok.p_request)).toBe(0); // no backfill (OD-CRM-6)
  });
});

describe('fsc_crm_claim_draft', { timeout: 90_000 }, () => {
  it('NOT_FOUND for an unknown request and for another account\'s request, inserting nothing', async () => {
    const unknown = uuid4();
    expect(await crmClaim(db.service, unknown)).toEqual({ code: 'NOT_FOUND' });
    const other = uuid4();
    await db.admin.query(`INSERT INTO fsc_private.assessment_receipts (account_id, request_id, fingerprint, payload, envelopes, template_version, created_at, expires_at, purge_after, accepted_at)
      SELECT $1, $2, repeat('d', 64), '{"email":"other-account@example.invalid"}', '{"company_email":{"to":"info@floridasecurityconcepts.com"}}', 'fsc-assessment-v3', t, t + interval '24 hours', t + interval '7 days', t FROM (SELECT clock_timestamp() AS t) s`, [OTHER_ACCOUNT, other]);
    expect(await crmClaim(db.service, other)).toEqual({ code: 'NOT_FOUND' });
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_effects WHERE request_id = ANY($1::uuid[])`, [[unknown, other]])).toBe(0);
  });

  it('an unapproved slug is refused by the account guard', async () => {
    const args = await accepted(db, 'slug-guard');
    await expect(crmClaim(db.service, args.p_request, 'fpb')).rejects.toThrow(/FSC_ACCOUNT_REFUSED/);
    expect(await crmRowCount(db, args.p_request)).toBe(0);
  });

  it('PRIMARY_PENDING before the company email is accepted, without inserting a row; CLAIMED once accepted', async () => {
    const args = await created(db, 'primary-pending');
    expect(await crmClaim(db.service, args.p_request)).toEqual({ code: 'PRIMARY_PENDING' });
    expect(await crmRowCount(db, args.p_request)).toBe(0);
    // Company in flight / uncertain is still not acceptance.
    const lease = await claim(db.service, args.p_request, 'company_email');
    expect(await crmClaim(db.service, args.p_request)).toEqual({ code: 'PRIMARY_PENDING' });
    await finish(db.service, args.p_request, 'company_email', lease.lease_token, 'uncertain', null, 'ambiguous');
    expect(await crmClaim(db.service, args.p_request)).toEqual({ code: 'PRIMARY_PENDING' });
    expect(await crmRowCount(db, args.p_request)).toBe(0);
    const again = await claim(db.service, args.p_request, 'company_email');
    await finish(db.service, args.p_request, 'company_email', again.lease_token, 'succeeded', 'synthetic-resend-id');
    expect((await crmClaim(db.service, args.p_request)).code).toBe('CLAIMED');
  });

  it('CLAIMED inserts exactly one pending→inflight crm_lead row and returns the stored payload deep- and order-equal to the receipt row', async () => {
    const args = await accepted(db, 'claimed-payload', { utmSource: 'synthetic-utm' });
    const [receipt] = await rows(db.admin, `SELECT prime_lead_id, payload, payload::text AS payload_text, expires_at FROM fsc_private.assessment_receipts WHERE request_id = $1`, [args.p_request]);
    const started = Date.now();
    const result = await crmClaim(db.service, args.p_request);
    expect(keys(result)).toEqual([...REAL_RPC_SHAPES.crmClaimed]);
    expect(result).toMatchObject({ code: 'CLAIMED', idempotency_key: null, envelope: null, prime_lead_id: receipt.prime_lead_id, prior_uncertain: false });
    expect(result.payload).toEqual(receipt.payload);
    expect(result.payload).toEqual(args.p_payload);
    expect(JSON.stringify(result.payload)).toBe(JSON.stringify(JSON.parse(receipt.payload_text))); // same key order as the stored jsonb
    expect(typeof result.lease_until).toBe('string');
    expect(typeof result.retry_cutoff).toBe('string');
    const leaseUntil = Date.parse(result.lease_until);
    const cutoff = Date.parse(result.retry_cutoff);
    expect(leaseUntil - started).toBeGreaterThan(25_000);
    expect(leaseUntil - started).toBeLessThanOrEqual(31_000);
    expect(cutoff).toBeLessThanOrEqual(receipt.expires_at.getTime());
    expect(await crmRowCount(db, args.p_request)).toBe(1);
    const row = await crmRow(db, args.p_request);
    expect(row).toMatchObject({ state: 'inflight', idempotency_key: null, provider_id: null, error_category: null, token: result.lease_token, claimed_from_state: 'pending' });
    expect(row.lease_until.getTime()).toBe(leaseUntil);
  });

  it('no other claim ever carries a payload: company/customer/prime claims and a direct fsc_effect_claim_draft on crm_lead', async () => {
    const args = await created(db, 'no-payload-elsewhere');
    const company = await claim(db.service, args.p_request, 'company_email');
    expect(keys(company)).toEqual([...REAL_RPC_SHAPES.effectClaimed]);
    await finish(db.service, args.p_request, 'company_email', company.lease_token, 'succeeded', 'synthetic-resend-id');
    for (const effect of ['customer_email', 'prime_lead']) {
      const result = await claim(db.service, args.p_request, effect);
      expect(result.code).toBe('CLAIMED');
      expect(keys(result)).toEqual([...REAL_RPC_SHAPES.effectClaimed]);
    }
    const crm = await crmClaim(db.service, args.p_request);
    expect(crm.code).toBe('CLAIMED');
    await expireLease(db.admin, args.p_request, 'crm_lead');
    const direct = await claim(db.service, args.p_request, 'crm_lead');
    expect(direct.code).toBe('CLAIMED');
    expect(keys(direct)).toEqual([...REAL_RPC_SHAPES.effectClaimed]);
    expect(direct).not.toHaveProperty('payload');
  });

  it('BUSY (code only, no payload) under a live lease; after lease expiry the reclaim is CLAIMED with prior_uncertain and the same payload; still one row', async () => {
    const args = await accepted(db, 'busy');
    const first = await crmClaim(db.service, args.p_request);
    expect(first.code).toBe('CLAIMED');
    expect(await crmClaim(db.service, args.p_request)).toEqual({ code: 'BUSY' });
    await expireLease(db.admin, args.p_request, 'crm_lead');
    const second = await crmClaim(db.service, args.p_request);
    expect(second).toMatchObject({ code: 'CLAIMED', prior_uncertain: true });
    expect(second.lease_token).not.toBe(first.lease_token);
    expect(second.payload).toEqual(first.payload);
    expect(second.retry_cutoff).toBe(first.retry_cutoff);
    expect(await crmRowCount(db, args.p_request)).toBe(1);
    expect((await finish(db.service, args.p_request, 'crm_lead', first.lease_token, 'succeeded', 'late')).code).toBe('STALE_LEASE');
  });

  it('SUCCEEDED short-circuit after a recorded success: exactly {code:SUCCEEDED}, no payload, row untouched', async () => {
    const args = await accepted(db, 'succeeded');
    const lease = await crmClaim(db.service, args.p_request);
    const done = await finish(db.service, args.p_request, 'crm_lead', lease.lease_token, 'succeeded', 'synthetic-crm-receipt-1');
    expect(keys(done)).toEqual([...REAL_RPC_SHAPES.finish]);
    expect(done.code).toBe('SUCCEEDED');
    const before = await crmRow(db, args.p_request);
    expect(before).toMatchObject({ state: 'succeeded', provider_id: 'synthetic-crm-receipt-1', error_category: null, token: null });
    expect(await crmClaim(db.service, args.p_request)).toEqual({ code: 'SUCCEEDED' });
    expect(await crmRow(db, args.p_request)).toEqual(before);
  });

  it('EXPIRED at 24 h without inserting a row; inside the final 15 s margin the delegate refuses with CUTOFF (no payload)', async () => {
    const late = await accepted(db, 'expired-24h');
    await setReceiptAge(db.admin, late.p_request, '24 hours');
    expect(await crmClaim(db.service, late.p_request)).toEqual({ code: 'EXPIRED' });
    expect(await crmRowCount(db, late.p_request)).toBe(0);

    const margin = await accepted(db, 'cutoff-margin');
    await setReceiptAge(db.admin, margin.p_request, '23 hours 59 minutes 50 seconds');
    expect(await crmClaim(db.service, margin.p_request)).toEqual({ code: 'CUTOFF' });
  });

  it('CUTOFF after the effect\'s own retry cutoff is returned unchanged (no payload) and no second lease is issued', async () => {
    const args = await accepted(db, 'retry-cutoff');
    const lease = await crmClaim(db.service, args.p_request);
    await finish(db.service, args.p_request, 'crm_lead', lease.lease_token, 'uncertain', null, 'ambiguous');
    await db.admin.query('BEGIN');
    await db.admin.query('SET LOCAL session_replication_role = replica');
    await db.admin.query(`UPDATE fsc_private.assessment_effects SET first_attempt_at = first_attempt_at - interval '23 hours 55 minutes', retry_cutoff = retry_cutoff - interval '23 hours 55 minutes' WHERE request_id = $1 AND effect = 'crm_lead'`, [args.p_request]);
    await db.admin.query('COMMIT');
    expect(await crmClaim(db.service, args.p_request)).toEqual({ code: 'CUTOFF' });
    expect(await crmRow(db, args.p_request)).toMatchObject({ state: 'uncertain', token: null });
  });

  it('insert-if-absent on a receipt created and accepted BEFORE the migration was applied', async () => {
    const target = await cluster.database('migrated'); // AM-003 only
    const args = await accepted(target, 'pre-migration');
    const prime = await claim(target.service, args.p_request, 'prime_lead');
    expect((await callRpc(target.service, 'fsc_prime_record_draft', { p_slug: 'fsc', p_request: args.p_request, p_token: prime.lease_token })).code).toBe('SUCCEEDED');
    expect(await count(target.admin, `SELECT count(*) FROM fsc_private.assessment_effects WHERE request_id = $1`, [args.p_request])).toBe(3);
    await applyCrmMigration(target.admin);
    const result = await crmClaim(target.service, args.p_request);
    expect(result).toMatchObject({ code: 'CLAIMED', prior_uncertain: false });
    expect(result.payload).toEqual(await storedPayload(target, args.p_request));
    expect(await count(target.admin, `SELECT count(*) FROM fsc_private.assessment_effects WHERE request_id = $1`, [args.p_request])).toBe(4);
    expect((await finish(target.service, args.p_request, 'crm_lead', result.lease_token, 'succeeded', 'synthetic-crm-receipt-pre')).code).toBe('SUCCEEDED');
  });
});

describe('finish on crm_lead via the unchanged fsc_effect_finish_draft', { timeout: 60_000 }, () => {
  it.each(['conflict', 'validation', 'configuration'])('first-attempt failed/%s is recorded FAILED with that category and the lease cleared', async category => {
    const args = await accepted(db, `finish-${category}`);
    const lease = await crmClaim(db.service, args.p_request);
    expect(await finish(db.service, args.p_request, 'crm_lead', lease.lease_token, 'failed', null, category)).toMatchObject({ code: 'FAILED' });
    expect(await crmRow(db, args.p_request)).toMatchObject({ state: 'failed', error_category: category, provider_id: null, token: null, lease_until: null, claimed_from_state: null });
  });

  it('F-6: a failed crm_lead can be claimed again (CLAIMED, prior_uncertain=false) and a repeated definitive failure stays FAILED', async () => {
    const args = await accepted(db, 'failed-reclaim');
    const first = await crmClaim(db.service, args.p_request);
    await finish(db.service, args.p_request, 'crm_lead', first.lease_token, 'failed', null, 'conflict');
    const second = await crmClaim(db.service, args.p_request);
    expect(second).toMatchObject({ code: 'CLAIMED', prior_uncertain: false });
    expect(second.payload).toEqual(first.payload);
    expect(await finish(db.service, args.p_request, 'crm_lead', second.lease_token, 'failed', null, 'conflict')).toMatchObject({ code: 'FAILED' });
    expect(await crmRow(db, args.p_request)).toMatchObject({ state: 'failed', error_category: 'conflict' });
  });

  it('SQL backstop: failed after an uncertain attempt is downgraded to UNCERTAIN/configuration, whatever category was requested', async () => {
    for (const category of ['conflict', 'validation']) {
      const args = await accepted(db, `backstop-${category}`);
      const first = await crmClaim(db.service, args.p_request);
      await finish(db.service, args.p_request, 'crm_lead', first.lease_token, 'uncertain', null, 'ambiguous');
      const second = await crmClaim(db.service, args.p_request);
      expect(second).toMatchObject({ code: 'CLAIMED', prior_uncertain: true });
      expect(await finish(db.service, args.p_request, 'crm_lead', second.lease_token, 'failed', null, category)).toMatchObject({ code: 'UNCERTAIN' });
      expect(await crmRow(db, args.p_request)).toMatchObject({ state: 'uncertain', error_category: 'configuration', token: null });
    }
  });

  it('a provider id over 200 characters is refused by the existing CHECK and leaves the lease intact', async () => {
    const args = await accepted(db, 'provider-length');
    const lease = await crmClaim(db.service, args.p_request);
    await expect(finish(db.service, args.p_request, 'crm_lead', lease.lease_token, 'succeeded', 'x'.repeat(201))).rejects.toMatchObject({ code: '23514' });
    expect(await crmRow(db, args.p_request)).toMatchObject({ state: 'inflight', token: lease.lease_token });
    expect((await finish(db.service, args.p_request, 'crm_lead', lease.lease_token, 'succeeded', 'y'.repeat(200))).code).toBe('SUCCEEDED');
  });

  it('crm_lead success never touches accepted_at or any other effect', async () => {
    const args = await accepted(db, 'isolated-finish');
    const before = await rows(db.admin, `SELECT r.accepted_at, (SELECT array_agg(e::text ORDER BY effect) FROM fsc_private.assessment_effects e WHERE e.request_id = r.request_id AND e.effect <> 'crm_lead') AS others FROM fsc_private.assessment_receipts r WHERE r.request_id = $1`, [args.p_request]);
    const lease = await crmClaim(db.service, args.p_request);
    await finish(db.service, args.p_request, 'crm_lead', lease.lease_token, 'succeeded', 'synthetic-crm-receipt-iso');
    expect(await rows(db.admin, `SELECT r.accepted_at, (SELECT array_agg(e::text ORDER BY effect) FROM fsc_private.assessment_effects e WHERE e.request_id = r.request_id AND e.effect <> 'crm_lead') AS others FROM fsc_private.assessment_receipts r WHERE r.request_id = $1`, [args.p_request])).toEqual(before);
  });
});

describe('concurrency', { timeout: 90_000 }, () => {
  it('six separate processes race the first claim on a receipt with no crm_lead row: exactly one CLAIMED (with payload), five BUSY, one row', async () => {
    const args = await accepted(db, 'race-insert');
    const reports = await raceProcesses(db.admin, { port: cluster.port, database: db.name }, Array.from({ length: 6 }, () => [rpcCall('fsc_crm_claim_draft', { p_slug: 'fsc', p_request: args.p_request })]));
    expect(new Set(reports.map(r => r.pid)).size).toBe(6);
    const results = reports.map(r => r.results[0]);
    expect(results.filter(r => r.error)).toEqual([]);
    const values = results.map(r => r.value);
    expect(values.map(v => v.code).sort()).toEqual(['BUSY', 'BUSY', 'BUSY', 'BUSY', 'BUSY', 'CLAIMED']);
    for (const busy of values.filter(v => v.code === 'BUSY')) expect(busy).toEqual({ code: 'BUSY' });
    const winner = values.find(v => v.code === 'CLAIMED');
    expect(winner.payload).toEqual(args.p_payload);
    expect(await crmRowCount(db, args.p_request)).toBe(1);
    expect((await crmRow(db, args.p_request)).token).toBe(winner.lease_token);
  });
});

describe('privileges', { timeout: 60_000 }, () => {
  it('SECURITY INVOKER with search_path=pg_catalog; EXECUTE for service_role only', async () => {
    const [fn] = await rows(db.admin, `SELECT prosecdef, proconfig FROM pg_proc WHERE oid = to_regprocedure($1)`, [CRM_FN]);
    expect(fn).toEqual({ prosecdef: false, proconfig: ['search_path=pg_catalog'] });
    const [{ allowed }] = await rows(db.admin, `SELECT has_function_privilege('service_role', $1, 'EXECUTE') AS allowed`, [CRM_FN]);
    expect(allowed).toBe(true);
    for (const role of DENIED_ROLES) {
      const [{ allowed: denied }] = await rows(db.admin, `SELECT has_function_privilege($1, $2, 'EXECUTE') AS allowed`, [role, CRM_FN]);
      expect({ role, allowed: denied }).toEqual({ role, allowed: false });
    }
  });

  it.each(DENIED_ROLES)('%s cannot execute fsc_crm_claim_draft (42501) and nothing is inserted', async role => {
    const args = await accepted(db, `acl-${role}`);
    const client = await db.connect(role);
    try {
      await expect(crmClaim(client, args.p_request)).rejects.toMatchObject({ code: '42501' });
    } finally { await client.end(); }
    expect(await crmRowCount(db, args.p_request)).toBe(0);
  });
});

describe('purge and erase treat crm_lead like every other effect', { timeout: 60_000 }, () => {
  it('seven-day purge nulls the crm_lead row (inflight → uncertain, succeeded stays succeeded) and later claims are EXPIRED without inserting', async () => {
    const target = await crmDatabase(cluster);
    const inflight = await accepted(target, 'purge-inflight');
    const lease = await crmClaim(target.service, inflight.p_request);
    const succeeded = await accepted(target, 'purge-succeeded');
    const done = await crmClaim(target.service, succeeded.p_request);
    await finish(target.service, succeeded.p_request, 'crm_lead', done.lease_token, 'succeeded', 'synthetic-crm-receipt-purge');
    const noRow = await accepted(target, 'purge-no-row');
    const fresh = await accepted(target, 'purge-fresh');
    const freshLease = await crmClaim(target.service, fresh.p_request);
    for (const args of [inflight, succeeded, noRow]) {
      await target.admin.query('BEGIN');
      await target.admin.query('SET LOCAL session_replication_role = replica');
      await target.admin.query(`UPDATE fsc_private.assessment_effects SET first_attempt_at = first_attempt_at - interval '7 days 1 second', retry_cutoff = retry_cutoff - interval '7 days 1 second', lease_until = lease_until - interval '7 days 1 second' WHERE request_id = $1 AND first_attempt_at IS NOT NULL`, [args.p_request]);
      await target.admin.query('COMMIT');
      await setReceiptAge(target.admin, args.p_request, '7 days 1 second');
    }
    expect(await callRpc(target.service, 'fsc_receipt_purge_draft', { p_slug: 'fsc' })).toBe(3);
    const cleared = { idempotency_key: null, provider_id: null, error_category: null, first_attempt_at: null, retry_cutoff: null, token: null, lease_until: null, claimed_from_state: null };
    expect(await crmRow(target, inflight.p_request)).toEqual({ state: 'uncertain', ...cleared });
    expect(await crmRow(target, succeeded.p_request)).toEqual({ state: 'succeeded', ...cleared });
    expect(lease.lease_token).toBeTruthy();
    for (const args of [inflight, succeeded, noRow]) expect(await crmClaim(target.service, args.p_request)).toEqual({ code: 'EXPIRED' });
    expect(await crmRowCount(target, noRow.p_request)).toBe(0);
    expect(await crmRow(target, fresh.p_request)).toMatchObject({ state: 'inflight', token: freshLease.lease_token });
    expect(await count(target.admin, `SELECT count(*) FROM fsc_private.assessment_effects WHERE effect = 'crm_lead' AND provider_id = 'synthetic-crm-receipt-purge'`)).toBe(0);
  });

  it('erase nulls the crm_lead row immediately and the ID can never be claimed again', async () => {
    const args = await accepted(db, 'erase-crm');
    const lease = await crmClaim(db.service, args.p_request);
    await finish(db.service, args.p_request, 'crm_lead', lease.lease_token, 'failed', null, 'validation');
    expect(await callRpc(db.service, 'fsc_receipt_erase_draft', { p_slug: 'fsc', p_request: args.p_request })).toBe(true);
    expect(await crmRow(db, args.p_request)).toEqual({ state: 'failed', idempotency_key: null, provider_id: null, error_category: null, first_attempt_at: null, retry_cutoff: null, token: null, lease_until: null, claimed_from_state: null });
    expect(await crmClaim(db.service, args.p_request)).toEqual({ code: 'EXPIRED' });
    const noRow = await accepted(db, 'erase-no-row');
    await callRpc(db.service, 'fsc_receipt_erase_draft', { p_slug: 'fsc', p_request: noRow.p_request });
    expect(await crmClaim(db.service, noRow.p_request)).toEqual({ code: 'EXPIRED' });
    expect(await crmRowCount(db, noRow.p_request)).toBe(0);
  });
});

/** A multi-statement script yields one Result per statement; the report output is the final SELECT. */
function finalResult(result: pg.QueryResult | pg.QueryResult[]): pg.QueryResult {
  const last = Array.isArray(result) ? result[result.length - 1] : result;
  if (!last?.fields?.length) throw new Error('script produced no final SELECT result');
  return last;
}
function reportSql(): string {
  expect(existsSync(CRM_REPORT_SQL_PATH), `missing ${CRM_REPORT_SQL_PATH}`).toBe(true);
  return readFileSync(CRM_REPORT_SQL_PATH, 'utf8');
}
async function readOnly(admin: pg.Client, sql: string) {
  await admin.query('BEGIN');
  await admin.query('SET TRANSACTION READ ONLY');
  try { const result = finalResult(await admin.query(sql) as pg.QueryResult | pg.QueryResult[]); await admin.query('COMMIT'); return result; } catch (error) { await admin.query('ROLLBACK'); throw error; }
}

describe('CRM reconciliation report (sql/fsc-crm-lead-reconciliation-report.sql, read-only)', { timeout: 90_000 }, () => {
  let target: TestDatabase;
  const made: Record<string, ReturnType<typeof receiptArgs>> = {};
  beforeAll(async () => {
    target = await crmDatabase(cluster);
    made.missing = await accepted(target, 'report-missing');
    made.missing2 = await accepted(target, 'report-missing-2');
    made.uncertain = await accepted(target, 'report-uncertain');
    const u = await crmClaim(target.service, made.uncertain.p_request);
    await finish(target.service, made.uncertain.p_request, 'crm_lead', u.lease_token, 'uncertain', null, 'ambiguous');
    made.failed = await accepted(target, 'report-failed');
    const f = await crmClaim(target.service, made.failed.p_request);
    await finish(target.service, made.failed.p_request, 'crm_lead', f.lease_token, 'failed', null, 'conflict');
    made.succeeded = await accepted(target, 'report-succeeded');
    const s = await crmClaim(target.service, made.succeeded.p_request);
    await finish(target.service, made.succeeded.p_request, 'crm_lead', s.lease_token, 'succeeded', 'synthetic-crm-receipt-report');
    made.unaccepted = await created(target, 'report-unaccepted');
    made.erased = await accepted(target, 'report-erased');
    await callRpc(target.service, 'fsc_receipt_erase_draft', { p_slug: 'fsc', p_request: made.erased.p_request });
    const other = uuid4();
    await target.admin.query(`INSERT INTO fsc_private.assessment_receipts (account_id, request_id, fingerprint, payload, envelopes, template_version, created_at, expires_at, purge_after, accepted_at)
      SELECT $1, $2, repeat('e', 64), '{"email":"other-account@example.invalid"}', '{"company_email":{"to":"info@floridasecurityconcepts.com"}}', 'fsc-assessment-v3', t, t + interval '24 hours', t + interval '7 days', t FROM (SELECT clock_timestamp() AS t) s`, [OTHER_ACCOUNT, other]);
  }, 90_000);

  it('executes inside a READ ONLY transaction with exactly the 9 reconciliation columns', async () => {
    const result = await readOnly(target.admin, reportSql());
    expect(result.fields.map(f => f.name)).toEqual(REPORT_COLUMNS);
  });

  it('refuses with FSC_ACCOUNT_IDENTITY_MISMATCH unless exactly one FSC account matches', async () => {
    const sql = reportSql();
    await target.admin.query(`UPDATE public.accounts SET website_domain = 'https://unrelated.example.invalid/' WHERE slug = 'fsc'`);
    try {
      await expect(readOnly(target.admin, sql)).rejects.toThrow(/FSC_ACCOUNT_IDENTITY_MISMATCH/);
    } finally {
      await target.admin.query(`UPDATE public.accounts SET website_domain = 'https://www.floridasecurityconcepts.com/' WHERE slug = 'fsc'`);
    }
  });

  it('lists unresolved crm_lead rows and accepted receipts with no crm_lead row (state missing) — nothing else, no payload/contact/provider data', async () => {
    const result = await readOnly(target.admin, reportSql());
    const reported = result.rows.map(r => [r.request_id, r.effect, r.state, r.error_category]);
    expect([...reported].sort()).toEqual([
      [made.missing.p_request, 'crm_lead', 'missing', null],
      [made.missing2.p_request, 'crm_lead', 'missing', null],
      [made.uncertain.p_request, 'crm_lead', 'uncertain', 'ambiguous'],
      [made.failed.p_request, 'crm_lead', 'failed', 'conflict'],
    ].sort());
    const receiptIds = await rows(target.admin, `SELECT request_id, receipt_id FROM fsc_private.assessment_receipts`);
    for (const row of result.rows) {
      expect(row.receipt_id).toBe(receiptIds.find(r => r.request_id === row.request_id)!.receipt_id);
      expect(row.purged_at).toBeNull();
    }
    for (const row of result.rows.filter(r => r.state === 'missing')) expect(row).toMatchObject({ first_attempt_at: null, retry_cutoff: null, updated_at: null });
    // Ordered by updated_at NULLS LAST, then request_id.
    const dated = result.rows.filter(r => r.updated_at !== null);
    const undated = result.rows.filter(r => r.updated_at === null);
    expect(result.rows).toEqual([...dated, ...undated]);
    const times = dated.map(r => (r.updated_at as Date).getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(undated.map(r => r.request_id)).toEqual(undated.map(r => r.request_id).sort());
    const text = JSON.stringify(result.rows);
    for (const forbidden of [...Object.values(made).map(a => a.p_payload.email), 'other-account@example.invalid', 'synthetic-crm-receipt-report', 'synthetic-resend-id', 'info@floridasecurityconcepts.com', 'Synthetic', '2025550100']) {
      expect(text.includes(forbidden), `report leaked ${forbidden}`).toBe(false);
    }
  });

  it('on an AM-003-only database (migration not applied) it runs read-only and reports no missing rows', async () => {
    const plain = await cluster.database('migrated');
    await accepted(plain, 'report-plain');
    const result = await readOnly(plain.admin, reportSql());
    expect(result.fields.map(f => f.name)).toEqual(REPORT_COLUMNS);
    expect(result.rows).toEqual([]);
  });
});

describe('rollback Part A (sql/fsc-crm-lead-effect.rollback.draft.sql, D-031 B-1)', { timeout: 90_000 }, () => {
  it('succeeds while live crm_lead rows and conflict/validation categories exist: drops the function, keeps every row and the widened CHECKs', async () => {
    const target = await crmDatabase(cluster);
    const done = await accepted(target, 'rollback-a-succeeded');
    const lease = await crmClaim(target.service, done.p_request);
    await finish(target.service, done.p_request, 'crm_lead', lease.lease_token, 'succeeded', 'synthetic-crm-receipt-rb');
    const conflict = await accepted(target, 'rollback-a-conflict');
    const c = await crmClaim(target.service, conflict.p_request);
    await finish(target.service, conflict.p_request, 'crm_lead', c.lease_token, 'failed', null, 'conflict');
    const inflight = await accepted(target, 'rollback-a-inflight');
    await crmClaim(target.service, inflight.p_request);
    const before = await catalogSnapshot(target.admin);
    const data = await rows(target.admin, `SELECT e::text AS t FROM fsc_private.assessment_effects e ORDER BY 1`);

    await runScript(target.admin, ROLLBACK_SQL);
    const after = await catalogSnapshot(target.admin);
    const [{ fn }] = await rows(target.admin, `SELECT to_regprocedure($1) AS fn`, [CRM_FN]);
    expect(fn).toBeNull();
    expect(after.functions).toEqual(before.functions.filter(f => f.signature !== 'fsc_crm_claim_draft(text,uuid)'));
    expect(after.constraints).toEqual(before.constraints); // widened CHECKs stay (harmless supersets)
    expect(after.triggers).toEqual(before.triggers);
    expect(after.grants).toEqual(before.grants);
    expect(await rows(target.admin, `SELECT e::text AS t FROM fsc_private.assessment_effects e ORDER BY 1`)).toEqual(data);
    // The claim path is gone (the coordinator sees PostgREST 404 → crm_pending) and AM-003 flows are intact.
    await expect(crmClaim(target.service, done.p_request)).rejects.toMatchObject({ code: '42883' });
    const later = await accepted(target, 'rollback-a-after');
    const prime = await claim(target.service, later.p_request, 'prime_lead');
    expect((await callRpc(target.service, 'fsc_prime_record_draft', { p_slug: 'fsc', p_request: later.p_request, p_token: prime.lease_token })).code).toBe('SUCCEEDED');
    // Idempotent: a second run also succeeds and changes nothing further.
    await runScript(target.admin, ROLLBACK_SQL);
    expect(await catalogSnapshot(target.admin)).toEqual(after);
  });

  it('succeeds on a clean migrated database too', async () => {
    const target = await crmDatabase(cluster);
    await runScript(target.admin, ROLLBACK_SQL);
    const [{ fn }] = await rows(target.admin, `SELECT to_regprocedure($1) AS fn`, [CRM_FN]);
    expect(fn).toBeNull();
  });
});

describe('re-applying the migration after rollback Part A (D-032 TG-1)', { timeout: 90_000 }, () => {
  it('succeeds WITH live crm_lead rows: the widened CHECKs are a no-op, the function is re-created, existing rows are untouched and new receipts can be claimed', async () => {
    const target = await crmDatabase(cluster);
    const done = await accepted(target, 'reapply-succeeded');
    const lease = await crmClaim(target.service, done.p_request);
    await finish(target.service, done.p_request, 'crm_lead', lease.lease_token, 'succeeded', 'synthetic-crm-receipt-reapply');
    const inflight = await accepted(target, 'reapply-inflight');
    await crmClaim(target.service, inflight.p_request);
    const migrated = await catalogSnapshot(target.admin);
    await runScript(target.admin, ROLLBACK_SQL);
    const data = await rows(target.admin, `SELECT e::text AS t FROM fsc_private.assessment_effects e ORDER BY 1`);
    expect(data.length).toBeGreaterThan(0);

    await applyCrmMigration(target.admin);
    expect(await catalogSnapshot(target.admin)).toEqual(migrated); // same function (body/ACL/config), same CHECKs, same grants
    expect(await rows(target.admin, `SELECT e::text AS t FROM fsc_private.assessment_effects e ORDER BY 1`)).toEqual(data);
    for (const role of DENIED_ROLES) {
      const [{ allowed }] = await rows(target.admin, `SELECT has_function_privilege($1, $2, 'EXECUTE') AS allowed`, [role, CRM_FN]);
      expect({ role, allowed }).toEqual({ role, allowed: false });
    }
    expect(await crmClaim(target.service, done.p_request)).toEqual({ code: 'SUCCEEDED' });
    expect(await crmClaim(target.service, inflight.p_request)).toEqual({ code: 'BUSY' });
    const fresh = await accepted(target, 'reapply-fresh');
    const claimed = await crmClaim(target.service, fresh.p_request);
    expect(claimed).toMatchObject({ code: 'CLAIMED', prior_uncertain: false });
    expect(claimed.payload).toEqual(fresh.p_payload);
  });

  it('a double apply without Part A still refuses with FSC_CRM_CLAIM_FUNCTION_ALREADY_EXISTS', async () => {
    const target = await crmDatabase(cluster);
    const before = await catalogSnapshot(target.admin);
    await expect(runScript(target.admin, CRM_SQL)).rejects.toThrow(/FSC_CRM_CLAIM_FUNCTION_ALREADY_EXISTS_REVIEW_DO_NOT_OVERWRITE/);
    expect(await catalogSnapshot(target.admin)).toEqual(before);
  });

  it.each([
    ['effect', `CHECK (effect IN ('company_email','customer_email','prime_lead','crm_lead','hand_added'))`, /FSC_CRM_UNEXPECTED_EFFECT_CHECK/],
    ['error_category', `CHECK (error_category IN ('provider_unavailable','ambiguous','database_unavailable','cutoff','configuration','conflict'))`, /FSC_CRM_UNEXPECTED_ERROR_CATEGORY_CHECK/],
  ] as const)('after Part A, a drifted %s CHECK (neither AM-003 nor the exact widened text) still RAISEs and changes nothing', async (column, definition, error) => {
    const target = await crmDatabase(cluster);
    await runScript(target.admin, ROLLBACK_SQL);
    const current = checkDef(await catalogSnapshot(target.admin), column)!;
    expect(current, `${column} CHECK located`).toBeDefined();
    await target.admin.query(`ALTER TABLE fsc_private.assessment_effects DROP CONSTRAINT ${current.conname}`);
    await target.admin.query(`ALTER TABLE fsc_private.assessment_effects ADD CONSTRAINT ${current.conname} ${definition}`);
    const before = await catalogSnapshot(target.admin);
    await expect(runScript(target.admin, CRM_SQL)).rejects.toThrow(error);
    expect(await catalogSnapshot(target.admin)).toEqual(before);
  });
});

describe('rollback Part B (sql/fsc-crm-lead-effect.rollback-narrow.destructive.draft.sql, owner-only)', { timeout: 90_000 }, () => {
  it('refuses while any crm_lead row exists and changes nothing', async () => {
    const sql = narrowSql();
    const target = await crmDatabase(cluster);
    const args = await accepted(target, 'narrow-blocked');
    await crmClaim(target.service, args.p_request);
    await runScript(target.admin, ROLLBACK_SQL);
    const before = await catalogSnapshot(target.admin);
    const data = await rows(target.admin, `SELECT e::text AS t FROM fsc_private.assessment_effects e ORDER BY 1`);
    await expect(runScript(target.admin, sql)).rejects.toThrow(/FSC_CRM_ROLLBACK_BLOCKED_EXISTING_CRM_LEAD_OR_NEW_CATEGORY_ROWS/);
    expect(await catalogSnapshot(target.admin)).toEqual(before);
    expect(await rows(target.admin, `SELECT e::text AS t FROM fsc_private.assessment_effects e ORDER BY 1`)).toEqual(data);
  });

  it('refuses to run before Part A (function still present) and changes nothing', async () => {
    const sql = narrowSql();
    const target = await crmDatabase(cluster);
    const before = await catalogSnapshot(target.admin);
    await expect(runScript(target.admin, sql)).rejects.toThrow(/FSC_CRM_NARROW_BLOCKED_FUNCTION_STILL_EXISTS_RUN_PART_A_FIRST/);
    expect(await catalogSnapshot(target.admin)).toEqual(before);
  });

  it('refuses while a conflict/validation category exists on any effect (no crm_lead rows) and changes nothing', async () => {
    const sql = narrowSql();
    const target = await crmDatabase(cluster);
    const args = await created(target, 'narrow-category');
    await target.admin.query(`UPDATE fsc_private.assessment_effects SET error_category = 'validation' WHERE request_id = $1 AND effect = 'prime_lead'`, [args.p_request]);
    await runScript(target.admin, ROLLBACK_SQL);
    const before = await catalogSnapshot(target.admin);
    await expect(runScript(target.admin, sql)).rejects.toThrow(/FSC_CRM_ROLLBACK_BLOCKED_EXISTING_CRM_LEAD_OR_NEW_CATEGORY_ROWS/);
    expect(await catalogSnapshot(target.admin)).toEqual(before);
  });

  it('after Part A on a clean database it restores exactly the AM-003 catalog, and the migration can then be re-applied', async () => {
    const sql = narrowSql();
    const pristine = await catalogSnapshot((await cluster.database('migrated')).admin);
    const target = await crmDatabase(cluster);
    const args = await accepted(target, 'narrow-clean');
    await runScript(target.admin, ROLLBACK_SQL);
    await runScript(target.admin, sql);
    expect(await catalogSnapshot(target.admin)).toEqual(pristine);
    await expect(target.admin.query(`INSERT INTO fsc_private.assessment_effects (account_id, request_id, effect) VALUES ($1, $2, 'crm_lead')`, [FSC_ACCOUNT, args.p_request])).rejects.toMatchObject({ code: '23514' });
    await applyCrmMigration(target.admin);
    expect((await crmClaim(target.service, args.p_request)).code).toBe('CLAIMED');
  });
});
