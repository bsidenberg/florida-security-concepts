// AM-003/AM-004 privilege isolation against real PostgreSQL 17. The synthetic
// cluster carries Supabase-like default privileges (new public functions are
// granted to anon/authenticated/service_role), so only explicit revokes pass.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { callRpc, rows, startCluster, type Cluster, type TestDatabase } from '../helpers/postgres';
import { digestFor, receiptArgs } from '../helpers/receipt-fixtures';

let cluster: Cluster;
let db: TestDatabase;
let functions: { signature: string; name: string; schema: string; args: number }[];
const TABLES = ['fsc_private.assessment_receipts', 'fsc_private.assessment_effects', 'fsc_private.admission_counters'];
const RPCS = ['fsc_receipt_create_draft', 'fsc_effect_claim_draft', 'fsc_effect_finish_draft', 'fsc_prime_record_draft', 'fsc_receipt_purge_draft', 'fsc_receipt_erase_draft', 'fsc_admission_cleanup_draft'];
const DENIED_ROLES = ['anon', 'authenticated', 'fsc_public_probe'];

beforeAll(async () => {
  cluster = await startCluster();
  db = await cluster.database();
  functions = await rows(db.admin, `SELECT p.oid::regprocedure::text AS signature, p.proname AS name, n.nspname AS schema, p.pronargs AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE (n.nspname = 'public' AND p.proname LIKE 'fsc\\_%') OR n.nspname = 'fsc_private' ORDER BY 1`);
}, 120_000);
afterAll(async () => { await cluster?.stop('fast'); }, 60_000);

describe('private tables and RPC privileges', { timeout: 60_000 }, () => {
  it('discovers exactly the contracted public RPC set, each with a single signature', () => {
    expect(functions.filter(f => f.schema === 'public').map(f => f.name).sort()).toEqual([...RPCS].sort());
    expect(functions.find(f => f.name === 'fsc_receipt_create_draft')?.args).toBe(7);
  });

  it.each(DENIED_ROLES)('%s has no table privilege and every direct table statement is denied', async role => {
    for (const table of TABLES) for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) {
      const [{ allowed }] = await rows(db.admin, `SELECT has_table_privilege($1, $2, $3) AS allowed`, [role, table, privilege]);
      expect({ table, privilege, allowed }).toEqual({ table, privilege, allowed: false });
    }
    const client = await db.connect(role);
    try {
      for (const statement of [
        'SELECT * FROM fsc_private.assessment_receipts', 'SELECT * FROM fsc_private.assessment_effects', 'SELECT * FROM fsc_private.admission_counters',
        `INSERT INTO fsc_private.admission_counters (account_id, source_digest, admitted_at, expires_at) VALUES ('11111111-1111-4111-8111-111111111111', repeat('a', 64), '{}', now())`,
        `UPDATE fsc_private.assessment_effects SET state = 'succeeded'`, 'DELETE FROM fsc_private.assessment_receipts',
      ]) {
        await expect(client.query(statement), statement).rejects.toMatchObject({ code: '42501' });
      }
    } finally { await client.end(); }
  });

  it.each(DENIED_ROLES)('%s cannot execute any fsc function (catalog-discovered) and execution is denied', async role => {
    expect(functions.length).toBeGreaterThanOrEqual(RPCS.length + 3);
    for (const fn of functions) {
      const [{ allowed }] = await rows(db.admin, `SELECT has_function_privilege($1, $2, 'EXECUTE') AS allowed`, [role, fn.signature]);
      expect({ fn: fn.signature, allowed }).toEqual({ fn: fn.signature, allowed: false });
    }
    const client = await db.connect(role);
    try {
      await expect(callRpc(client, 'fsc_receipt_create_draft', receiptArgs({ source: digestFor(`acl-${role}`) }))).rejects.toMatchObject({ code: '42501' });
      await expect(callRpc(client, 'fsc_receipt_purge_draft', { p_slug: 'fsc' })).rejects.toMatchObject({ code: '42501' });
      await expect(callRpc(client, 'fsc_admission_cleanup_draft', { p_slug: 'fsc' })).rejects.toMatchObject({ code: '42501' });
      await expect(callRpc(client, 'fsc_effect_claim_draft', { p_slug: 'fsc', p_request: '18a85f2b-5ba9-43c2-a475-84ac0ac98310', p_effect: 'company_email' })).rejects.toMatchObject({ code: '42501' });
    } finally { await client.end(); }
    const [{ n }] = await rows(db.admin, `SELECT count(*)::int AS n FROM fsc_private.assessment_receipts`);
    expect(n).toBe(0);
  });

  it('control: in this cluster an unrevoked new public function IS executable by anon (so the denials above are earned)', async () => {
    const scratch = await cluster.database();
    await scratch.admin.query(`CREATE FUNCTION public.synthetic_unrevoked_probe() RETURNS integer LANGUAGE sql AS 'SELECT 42'`);
    const anon = await scratch.connect('anon');
    try { expect((await anon.query('SELECT public.synthetic_unrevoked_probe() AS v')).rows[0].v).toBe(42); } finally { await anon.end(); }
  });

  it('no fsc function ACL grants PUBLIC, anon or authenticated', async () => {
    const grants = await rows(db.admin, `SELECT p.oid::regprocedure::text AS fn, CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE a.grantee::regrole::text END AS grantee
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
      WHERE ((n.nspname = 'public' AND p.proname LIKE 'fsc\\_%') OR n.nspname = 'fsc_private') AND (a.grantee = 0 OR a.grantee::regrole::text IN ('anon', 'authenticated'))`);
    expect(grants).toEqual([]);
  });

  it('service_role can execute every public RPC and read/insert/update private tables', async () => {
    for (const fn of functions.filter(f => f.schema === 'public')) {
      const [{ allowed }] = await rows(db.admin, `SELECT has_function_privilege('service_role', $1, 'EXECUTE') AS allowed`, [fn.signature]);
      expect({ fn: fn.signature, allowed }).toEqual({ fn: fn.signature, allowed: true });
    }
    const args = receiptArgs({ source: digestFor('acl-service') });
    expect((await callRpc(db.service, 'fsc_receipt_create_draft', args)).code).toBe('READY');
    expect(await callRpc(db.service, 'fsc_receipt_purge_draft', { p_slug: 'fsc' })).toBe(0);
    expect(await callRpc(db.service, 'fsc_admission_cleanup_draft', { p_slug: 'fsc' })).toBe(0);
    expect((await db.service.query('SELECT count(*)::int AS n FROM fsc_private.assessment_effects WHERE request_id = $1', [args.p_request])).rows[0].n).toBe(3);
    for (const table of TABLES) for (const privilege of ['SELECT', 'INSERT', 'UPDATE']) {
      const [{ allowed }] = await rows(db.admin, `SELECT has_table_privilege('service_role', $1, $2) AS allowed`, [table, privilege]);
      expect({ table, privilege, allowed }).toEqual({ table, privilege, allowed: true });
    }
  });

  it('service_role has no DELETE or TRUNCATE on receipts/effects (DELETE only on transient admission counters)', async () => {
    const args = receiptArgs({ source: digestFor('acl-delete') });
    await callRpc(db.service, 'fsc_receipt_create_draft', args);
    for (const table of ['fsc_private.assessment_receipts', 'fsc_private.assessment_effects']) {
      for (const privilege of ['DELETE', 'TRUNCATE']) {
        const [{ allowed }] = await rows(db.admin, `SELECT has_table_privilege('service_role', $1, $2) AS allowed`, [table, privilege]);
        expect({ table, privilege, allowed }).toEqual({ table, privilege, allowed: false });
      }
      await expect(db.service.query(`DELETE FROM ${table} WHERE request_id = $1`, [args.p_request])).rejects.toMatchObject({ code: '42501' });
    }
    const [{ allowed }] = await rows(db.admin, `SELECT has_table_privilege('service_role', 'fsc_private.admission_counters', 'DELETE') AS allowed`);
    expect(allowed).toBe(true);
    const [{ n }] = await rows(db.admin, `SELECT count(*)::int AS n FROM fsc_private.assessment_effects WHERE request_id = $1`, [args.p_request]);
    expect(n).toBe(3);
  });

  it('RLS is enabled on every private table with no client policies, and every fsc function is SECURITY INVOKER with a fixed search_path', async () => {
    const tables = await rows(db.admin, `SELECT c.oid::regclass::text AS name, c.relrowsecurity AS rls FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'fsc_private' AND c.relkind = 'r' ORDER BY 1`);
    expect(tables).toEqual([...TABLES].sort().map(name => ({ name, rls: true })));
    expect(await rows(db.admin, `SELECT policyname FROM pg_policies WHERE schemaname = 'fsc_private'`)).toEqual([]);
    const definers = await rows(db.admin, `SELECT p.oid::regprocedure::text AS fn, p.prosecdef, p.proconfig FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE ((n.nspname = 'public' AND p.proname LIKE 'fsc\\_%') OR n.nspname = 'fsc_private')`);
    expect(definers.length).toBe(functions.length);
    for (const fn of definers) expect({ fn: fn.fn, definer: fn.prosecdef, config: fn.proconfig }).toEqual({ fn: fn.fn, definer: false, config: ['search_path=pg_catalog'] });
  });
});
