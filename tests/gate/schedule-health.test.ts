// Owner-run cleanup schedule, health check and reconciliation report SQL.
// pg_cron is NOT in the portable runtime: schedule tests run against a clearly
// labeled SIMULATION — a synthetic `cron` schema, a pg_cron catalog marker and a
// cron.schedule() stub with real pg_cron 1.6 same-name *overwrite* semantics
// (so an unguarded script would visibly clobber a conflicting job). Health and
// reconciliation SQL run read-only against real synthetic receipts/effects/counters.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type pg from 'pg';
import { callRpc, count, FSC_ACCOUNT, OTHER_ACCOUNT, rows, runScript, startCluster, type Cluster, type TestDatabase } from '../helpers/postgres';
import { digestFor, receiptArgs, uuid4 } from '../helpers/receipt-fixtures';
import { setReceiptAge } from '../helpers/receipt-time';

const SCHEDULE_SQL = readFileSync(resolve('sql/fsc-cleanup-schedule.draft.sql'), 'utf8');
const HEALTH_SQL = readFileSync(resolve('sql/fsc-cleanup-health.sql'), 'utf8');
const REPORT_SQL = readFileSync(resolve('sql/fsc-receipt-reconciliation-report.sql'), 'utf8');
const JOB = 'fsc-assessment-private-cleanup';
const COMMAND = `SELECT public.fsc_receipt_purge_draft('fsc'); SELECT public.fsc_admission_cleanup_draft('fsc');`;

let cluster: Cluster;
beforeAll(async () => { cluster = await startCluster(); }, 120_000);
afterAll(async () => { await cluster?.stop('fast'); }, 60_000);

async function installCronSimulation(admin: pg.Client, options: { extension?: boolean } = {}) {
  await admin.query(`CREATE SCHEMA cron;
    CREATE TABLE cron.job (jobid bigserial PRIMARY KEY, schedule text NOT NULL, command text NOT NULL, nodename text NOT NULL DEFAULT 'localhost', nodeport integer NOT NULL DEFAULT 5432,
      database text NOT NULL DEFAULT current_database(), username text NOT NULL DEFAULT current_user, active boolean NOT NULL DEFAULT true, jobname text, UNIQUE (jobname, username));
    CREATE TABLE cron.job_run_details (jobid bigint, runid bigserial PRIMARY KEY, job_pid integer, database text, username text, command text, status text, return_message text, start_time timestamptz, end_time timestamptz);
    CREATE FUNCTION cron.schedule(job_name text, schedule text, command text) RETURNS bigint LANGUAGE plpgsql AS $$
    DECLARE id bigint; BEGIN
      INSERT INTO cron.job (jobname, schedule, command) VALUES (job_name, schedule, command)
      ON CONFLICT (jobname, username) DO UPDATE SET schedule = EXCLUDED.schedule, command = EXCLUDED.command RETURNING jobid INTO id;
      RETURN id; END $$;
    CREATE FUNCTION cron.unschedule(job_name text) RETURNS boolean LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SIMULATION_FORBIDDEN_UNSCHEDULE'; END $$;
    CREATE FUNCTION cron.alter_job(job_id bigint, schedule text DEFAULT NULL, command text DEFAULT NULL, database text DEFAULT NULL, username text DEFAULT NULL, active boolean DEFAULT NULL) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SIMULATION_FORBIDDEN_ALTER_JOB'; END $$;
    INSERT INTO cron.job (jobname, schedule, command) VALUES ('unrelated-project-nightly', '0 3 * * *', 'SELECT 1');`);
  if (options.extension !== false) {
    await admin.query('BEGIN');
    await admin.query('SET LOCAL allow_system_table_mods = on');
    await admin.query(`INSERT INTO pg_catalog.pg_extension (oid, extname, extowner, extnamespace, extrelocatable, extversion, extconfig, extcondition)
      VALUES ((SELECT max(oid::int8) + 1 FROM pg_catalog.pg_extension)::oid, 'pg_cron', 10, 'cron'::regnamespace, false, '1.6.4', NULL, NULL)`);
    await admin.query('COMMIT');
  }
}
const jobsText = async (admin: pg.Client) => (await rows(admin, `SELECT t::text AS t FROM cron.job t ORDER BY jobid`)).map(r => r.t);

describe('SIMULATION: owner-run pg_cron schedule script against a stub cron schema', { timeout: 60_000 }, () => {
  it('(simulation) creates exactly one FSC minute job with the exact cleanup command and leaves other jobs untouched', async () => {
    const db = await cluster.database();
    await installCronSimulation(db.admin);
    const unrelated = await jobsText(db.admin);
    await runScript(db.admin, SCHEDULE_SQL);
    const jobs = await rows(db.admin, `SELECT jobname, schedule, command, active FROM cron.job WHERE jobname = $1`, [JOB]);
    expect(jobs).toEqual([{ jobname: JOB, schedule: '* * * * *', command: COMMAND, active: true }]);
    expect((await jobsText(db.admin)).slice(0, 1)).toEqual(unrelated);
    expect(await count(db.admin, `SELECT count(*) FROM cron.job`)).toBe(2);
  });

  it('(simulation) re-running is idempotent: still one job with the same jobid', async () => {
    const db = await cluster.database();
    await installCronSimulation(db.admin);
    await runScript(db.admin, SCHEDULE_SQL);
    const first = await jobsText(db.admin);
    await runScript(db.admin, SCHEDULE_SQL);
    await runScript(db.admin, SCHEDULE_SQL);
    expect(await jobsText(db.admin)).toEqual(first);
  });

  it.each([
    ['different command', `'* * * * *', 'SELECT public.some_other_function()'`],
    ['different schedule', `'*/5 * * * *', $cmd$${COMMAND}$cmd$`],
  ])('(simulation) refuses a conflicting same-name job with a %s and changes nothing', async (_label, values) => {
    const db = await cluster.database();
    await installCronSimulation(db.admin);
    await db.admin.query(`INSERT INTO cron.job (jobname, schedule, command) VALUES ('${JOB}', ${values})`);
    const before = await jobsText(db.admin);
    await expect(runScript(db.admin, SCHEDULE_SQL)).rejects.toThrow(/FSC_CLEANUP_JOB_NAME_CONFLICT/);
    expect(await jobsText(db.admin)).toEqual(before);
  });

  it('(simulation) with pg_cron absent the script attempts CREATE EXTENSION, fails in this runtime and commits no job', async () => {
    const db = await cluster.database();
    await expect(runScript(db.admin, SCHEDULE_SQL)).rejects.toThrow(/pg_cron/);
    expect(await count(db.admin, `SELECT count(*) FROM pg_namespace WHERE nspname = 'cron'`)).toBe(0);
    expect(await count(db.admin, `SELECT count(*) FROM pg_extension WHERE extname = 'pg_cron'`)).toBe(0);
  });

  it('(simulation) refuses to run before the receipts migration and creates no job', async () => {
    const db = await cluster.database('prime');
    await installCronSimulation(db.admin);
    const before = await jobsText(db.admin);
    await expect(runScript(db.admin, SCHEDULE_SQL)).rejects.toThrow(/FSC_CLEANUP_FUNCTIONS_MISSING/);
    expect(await jobsText(db.admin)).toEqual(before);
  });

  it.each([
    ['the FSC account domain does not match', `UPDATE public.accounts SET website_domain = 'https://unrelated.example.invalid' WHERE slug = 'fsc'`],
    ['a private table is missing', `ALTER TABLE fsc_private.admission_counters RENAME TO admission_counters_renamed`],
    ['the account resolver function is missing', `ALTER FUNCTION fsc_private.account_for_fsc(text, boolean) RENAME TO account_for_fsc_renamed`],
  ])('(simulation) preflight refuses when %s and creates no job (D-023 M-8)', async (_label, breakage) => {
    const db = await cluster.database();
    await installCronSimulation(db.admin);
    await db.admin.query(breakage);
    const before = await jobsText(db.admin);
    await expect(runScript(db.admin, SCHEDULE_SQL)).rejects.toThrow(/FSC_/);
    expect(await jobsText(db.admin)).toEqual(before);
    expect(await count(db.admin, `SELECT count(*) FROM cron.job WHERE jobname = $1`, [JOB])).toBe(0);
  });

  it('(simulation) the stored job command, executed as the scheduler would, purges due receipts and deletes expired counters only', async () => {
    const db = await cluster.database();
    await installCronSimulation(db.admin);
    await runScript(db.admin, SCHEDULE_SQL);
    const due = receiptArgs({ source: digestFor('job-due') });
    const fresh = receiptArgs({ source: digestFor('job-fresh') });
    await callRpc(db.service, 'fsc_receipt_create_draft', due);
    await callRpc(db.service, 'fsc_receipt_create_draft', fresh);
    await setReceiptAge(db.admin, due.p_request, '7 days 2 minutes');
    await db.admin.query(`UPDATE fsc_private.admission_counters SET expires_at = clock_timestamp() - interval '1 minute' WHERE source_digest = $1`, [digestFor('job-due')]);
    const [{ command }] = await rows(db.admin, `SELECT command FROM cron.job WHERE jobname = $1`, [JOB]);
    await db.admin.query(command);
    const receipts = await rows(db.admin, `SELECT request_id, payload IS NULL AS purged FROM fsc_private.assessment_receipts ORDER BY created_at`);
    expect(receipts).toEqual([{ request_id: due.p_request, purged: true }, { request_id: fresh.p_request, purged: false }]);
    expect((await rows(db.admin, `SELECT source_digest FROM fsc_private.admission_counters`)).map(r => r.source_digest)).toEqual([digestFor('job-fresh')]);
  });
});

/** A multi-statement script yields one Result per statement; the report/health output is the final SELECT. */
function finalResult(result: pg.QueryResult | pg.QueryResult[]): pg.QueryResult {
  const last = Array.isArray(result) ? result[result.length - 1] : result;
  if (!last?.fields?.length) throw new Error('script produced no final SELECT result');
  return last;
}
async function readOnly(admin: pg.Client, sql: string) {
  await admin.query('BEGIN');
  await admin.query('SET TRANSACTION READ ONLY');
  try { const result = finalResult(await admin.query(sql) as pg.QueryResult | pg.QueryResult[]); await admin.query('COMMIT'); return result; } catch (error) { await admin.query('ROLLBACK'); throw error; }
}
async function stateTextNoCron(admin: pg.Client) {
  const out: string[] = [];
  for (const table of ['fsc_private.assessment_receipts', 'fsc_private.assessment_effects', 'fsc_private.admission_counters', 'public.leads']) {
    out.push(...(await rows(admin, `SELECT t::text AS t FROM ${table} t ORDER BY 1`)).map(r => `${table} ${r.t}`));
  }
  return out;
}
async function stateText(admin: pg.Client) {
  const out: string[] = [];
  for (const table of ['fsc_private.assessment_receipts', 'fsc_private.assessment_effects', 'fsc_private.admission_counters', 'public.leads', 'cron.job', 'cron.job_run_details']) {
    out.push(...(await rows(admin, `SELECT t::text AS t FROM ${table} t ORDER BY 1`)).map(r => `${table} ${r.t}`));
  }
  return out;
}

describe('cleanup health SQL (read-only, real synthetic data; cron tables simulated)', { timeout: 60_000 }, () => {
  let db: TestDatabase;
  const contacts: string[] = [];
  const HEALTH_COLUMNS = ['job_exists', 'job_active', 'job_schedule_matches', 'job_command_matches', 'last_successful_run_at', 'receipts_due_for_purge', 'receipts_oldest_overdue_seconds', 'expired_admission_counters', 'counters_oldest_overdue_seconds', 'unresolved_effects_by_effect_state', 'healthy'];
  const health = async () => {
    const before = await stateText(db.admin);
    const result = await readOnly(db.admin, HEALTH_SQL);
    expect(await stateText(db.admin)).toEqual(before);
    expect(result.rows).toHaveLength(1);
    expect(result.fields.map(f => f.name)).toEqual(HEALTH_COLUMNS);
    const text = JSON.stringify(result.rows);
    for (const contact of contacts) expect(text).not.toContain(contact);
    return result.rows[0];
  };

  beforeAll(async () => {
    db = await cluster.database();
    await installCronSimulation(db.admin);
    await runScript(db.admin, SCHEDULE_SQL);
    const make = async (label: string) => { const args = receiptArgs({ source: digestFor(label) }); contacts.push(args.p_payload.email); expect((await callRpc(db.service, 'fsc_receipt_create_draft', args)).code).toBe('READY'); return args; };
    const overdue10 = await make('health-overdue-10');
    const overdue5 = await make('health-overdue-5');
    const accepted = await make('health-accepted');
    const uncertain = await make('health-uncertain');
    await setReceiptAge(db.admin, overdue10.p_request, '7 days 10 minutes');
    await setReceiptAge(db.admin, overdue5.p_request, '7 days 5 minutes');
    const lease = await callRpc(db.service, 'fsc_effect_claim_draft', { p_slug: 'fsc', p_request: accepted.p_request, p_effect: 'company_email' });
    await callRpc(db.service, 'fsc_effect_finish_draft', { p_slug: 'fsc', p_request: accepted.p_request, p_effect: 'company_email', p_token: lease.lease_token, p_state: 'succeeded', p_provider_id: 'synthetic-provider' });
    const lease2 = await callRpc(db.service, 'fsc_effect_claim_draft', { p_slug: 'fsc', p_request: uncertain.p_request, p_effect: 'company_email' });
    await callRpc(db.service, 'fsc_effect_finish_draft', { p_slug: 'fsc', p_request: uncertain.p_request, p_effect: 'company_email', p_token: lease2.lease_token, p_state: 'uncertain', p_error: 'ambiguous' });
    await db.admin.query(`INSERT INTO fsc_private.admission_counters (account_id, source_digest, admitted_at, expires_at) VALUES ($1, $2, ARRAY[clock_timestamp() - interval '17 minutes'], clock_timestamp() - interval '7 minutes')`, [FSC_ACCOUNT, digestFor('health-expired-counter')]);
    const [{ jobid }] = await rows(db.admin, `SELECT jobid FROM cron.job WHERE jobname = $1`, [JOB]);
    await db.admin.query(`INSERT INTO cron.job_run_details (jobid, status, command, start_time, end_time) VALUES
      ($1, 'succeeded', $2, clock_timestamp() - interval '61 seconds', clock_timestamp() - interval '60 seconds'),
      ($1, 'failed', $2, clock_timestamp() - interval '11 seconds', clock_timestamp() - interval '10 seconds'),
      (1, 'succeeded', 'SELECT 1', clock_timestamp() - interval '6 seconds', clock_timestamp() - interval '5 seconds')`, [jobid, COMMAND]);
  }, 60_000);

  it('reports job status, last success, purge backlog, expired counters and unresolved effects exactly; backlog over 5 minutes is unhealthy', async () => {
    const [{ expected }] = await rows(db.admin, `SELECT max(end_time) AS expected FROM cron.job_run_details d JOIN cron.job j USING (jobid) WHERE j.jobname = $1 AND d.status = 'succeeded'`, [JOB]);
    const row = await health();
    expect(row).toMatchObject({ job_exists: true, job_active: true, job_schedule_matches: true, job_command_matches: true, healthy: false });
    expect((row.last_successful_run_at as Date).getTime()).toBe((expected as Date).getTime());
    expect(Number(row.receipts_due_for_purge)).toBe(2);
    expect(Number(row.receipts_oldest_overdue_seconds)).toBeGreaterThanOrEqual(600);
    expect(Number(row.receipts_oldest_overdue_seconds)).toBeLessThanOrEqual(605);
    expect(Number(row.expired_admission_counters)).toBe(1);
    expect(Number(row.counters_oldest_overdue_seconds)).toBeGreaterThanOrEqual(420);
    expect(Number(row.counters_oldest_overdue_seconds)).toBeLessThanOrEqual(425);
    expect(row.unresolved_effects_by_effect_state).toEqual({ 'company_email:pending': 2, 'company_email:uncertain': 1, 'customer_email:pending': 4, 'prime_lead:pending': 4 });
  });

  it('becomes healthy after the job command clears the backlog with a recent success; a backlog under 5 minutes stays healthy', async () => {
    const [{ command }] = await rows(db.admin, `SELECT command FROM cron.job WHERE jobname = $1`, [JOB]);
    await db.admin.query(command);
    let row = await health();
    expect(row).toMatchObject({ receipts_due_for_purge: '0', receipts_oldest_overdue_seconds: null, expired_admission_counters: '0', counters_oldest_overdue_seconds: null, healthy: true });
    // Purged tombstones' effects are no longer counted as unresolved (D-023 N-5).
    expect(row.unresolved_effects_by_effect_state).toEqual({ 'company_email:uncertain': 1, 'customer_email:pending': 2, 'prime_lead:pending': 2 });
    await db.admin.query(`INSERT INTO fsc_private.admission_counters (account_id, source_digest, admitted_at, expires_at) VALUES ($1, $2, ARRAY[clock_timestamp() - interval '12 minutes'], clock_timestamp() - interval '2 minutes')`, [FSC_ACCOUNT, digestFor('health-recent-expired')]);
    row = await health();
    expect(Number(row.expired_admission_counters)).toBe(1);
    expect(row.healthy).toBe(true);
  });

  it('is unhealthy when the last success is older than 5 minutes and when the job is inactive', async () => {
    await db.admin.query(`UPDATE cron.job_run_details SET start_time = start_time - interval '6 minutes', end_time = end_time - interval '6 minutes'`);
    let row = await health();
    expect(row.healthy).toBe(false);
    await db.admin.query(`UPDATE cron.job_run_details SET start_time = clock_timestamp() - interval '2 seconds', end_time = clock_timestamp() - interval '1 second' WHERE status = 'succeeded' AND command = $1`, [COMMAND]);
    expect((await health()).healthy).toBe(true);
    await db.admin.query(`UPDATE cron.job SET active = false WHERE jobname = $1`, [JOB]);
    row = await health();
    expect(row).toMatchObject({ job_exists: true, job_active: false, healthy: false });
  });

  it.each([
    ['schedule', `schedule = '*/5 * * * *'`, 'job_schedule_matches'],
    ['command', `command = 'SELECT public.fsc_receipt_purge_draft(''fsc'')'`, 'job_command_matches'],
  ])('is unhealthy when the job %s no longer matches, even with a recent success and no backlog (D-023 N-5)', async (_label, assignment, flag) => {
    await db.admin.query(`UPDATE cron.job SET active = true WHERE jobname = $1`, [JOB]);
    expect((await health()).healthy).toBe(true);
    const [original] = await rows(db.admin, `SELECT schedule, command FROM cron.job WHERE jobname = $1`, [JOB]);
    await db.admin.query(`UPDATE cron.job SET ${assignment} WHERE jobname = $1`, [JOB]);
    try {
      const row = await health();
      expect(row[flag]).toBe(false);
      expect(row.healthy).toBe(false);
    } finally {
      await db.admin.query(`UPDATE cron.job SET schedule = $2, command = $3 WHERE jobname = $1`, [JOB, original.schedule, original.command]);
    }
  });

  it('reports a missing job as job_exists = false (a boolean, not NULL) and unhealthy', async () => {
    await db.admin.query(`DELETE FROM cron.job WHERE jobname = $1`, [JOB]);
    const row = await health();
    expect(row).toMatchObject({ job_exists: false, job_active: false, job_schedule_matches: false, job_command_matches: false, last_successful_run_at: null, healthy: false });
  });
});

// Contract item 6 columns plus purged_at (timestamp only), added under review M-7 / D-023(c). Closed list: any other column fails.
const REPORT_COLUMNS = ['receipt_id', 'request_id', 'effect', 'state', 'error_category', 'first_attempt_at', 'retry_cutoff', 'updated_at', 'purged_at'];
describe('reconciliation report SQL (read-only, real synthetic data)', { timeout: 60_000 }, () => {
  let db: TestDatabase;
  let pending: ReturnType<typeof receiptArgs>;
  let done: ReturnType<typeof receiptArgs>;
  beforeAll(async () => {
    db = await cluster.database();
    pending = receiptArgs({ source: digestFor('report-pending') });
    done = receiptArgs({ source: digestFor('report-done'), customer: false });
    for (const args of [pending, done]) expect((await callRpc(db.service, 'fsc_receipt_create_draft', args)).code).toBe('READY');
    const lease = await callRpc(db.service, 'fsc_effect_claim_draft', { p_slug: 'fsc', p_request: pending.p_request, p_effect: 'company_email' });
    await callRpc(db.service, 'fsc_effect_finish_draft', { p_slug: 'fsc', p_request: pending.p_request, p_effect: 'company_email', p_token: lease.lease_token, p_state: 'uncertain', p_error: 'ambiguous' });
    const doneLease = await callRpc(db.service, 'fsc_effect_claim_draft', { p_slug: 'fsc', p_request: done.p_request, p_effect: 'company_email' });
    await callRpc(db.service, 'fsc_effect_finish_draft', { p_slug: 'fsc', p_request: done.p_request, p_effect: 'company_email', p_token: doneLease.lease_token, p_state: 'succeeded', p_provider_id: 'synthetic-provider-secret-id' });
    const primeLease = await callRpc(db.service, 'fsc_effect_claim_draft', { p_slug: 'fsc', p_request: done.p_request, p_effect: 'prime_lead' });
    await callRpc(db.service, 'fsc_prime_record_draft', { p_slug: 'fsc', p_request: done.p_request, p_token: primeLease.lease_token });
    // Unrelated account's unresolved effect, inserted directly as synthetic data: must not be reported.
    const other = uuid4();
    await db.admin.query(`INSERT INTO fsc_private.assessment_receipts (account_id, request_id, fingerprint, payload, envelopes, template_version, created_at, expires_at, purge_after)
      SELECT $1, $2, repeat('d', 64), '{"email":"other-account@example.invalid"}', '{"company_email":{"to":"info@floridasecurityconcepts.com"}}', 'fsc-assessment-v2', t, t + interval '24 hours', t + interval '7 days' FROM (SELECT clock_timestamp() AS t) s`, [OTHER_ACCOUNT, other]);
    await db.admin.query(`INSERT INTO fsc_private.assessment_effects (account_id, request_id, effect, state) VALUES ($1, $2, 'company_email', 'pending')`, [OTHER_ACCOUNT, other]);
  }, 60_000);

  it('refuses with FSC_ACCOUNT_IDENTITY_MISMATCH unless exactly one FSC account matches, even read-only (round-2 contract)', async () => {
    await db.admin.query(`UPDATE public.accounts SET website_domain = 'https://unrelated.example.invalid/' WHERE slug = 'fsc'`);
    try {
      await expect(readOnly(db.admin, REPORT_SQL)).rejects.toThrow(/FSC_ACCOUNT_IDENTITY_MISMATCH/);
    } finally {
      await db.admin.query(`UPDATE public.accounts SET website_domain = 'https://www.floridasecurityconcepts.com/' WHERE slug = 'fsc'`);
    }
  });

  it('executes inside a READ ONLY transaction', async () => {
    const result = await readOnly(db.admin, REPORT_SQL);
    expect(result.fields.map(f => f.name)).toEqual(REPORT_COLUMNS);
  });

  it('lists only unresolved FSC effects with identifiers, states, categories and timestamps — no payload, envelope, recipient or provider data', async () => {
    const before = [...await stateTextNoCron(db.admin), ...(await rows(db.admin, `SELECT t::text AS t FROM public.accounts t ORDER BY 1`)).map(r => r.t)];
    const result = finalResult(await db.admin.query(REPORT_SQL) as pg.QueryResult | pg.QueryResult[]);
    expect([...await stateTextNoCron(db.admin), ...(await rows(db.admin, `SELECT t::text AS t FROM public.accounts t ORDER BY 1`)).map(r => r.t)]).toEqual(before);
    expect(result.fields.map(f => f.name)).toEqual(REPORT_COLUMNS);
    expect(result.rows.every(r => r.purged_at === null)).toBe(true);
    const reported = result.rows.map(r => [r.request_id, r.effect, r.state, r.error_category]).sort();
    expect(reported).toEqual([
      [pending.p_request, 'company_email', 'uncertain', 'ambiguous'],
      [pending.p_request, 'customer_email', 'pending', null],
      [pending.p_request, 'prime_lead', 'pending', null],
    ].sort());
    const times = result.rows.map(r => (r.updated_at as Date).getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
    const text = JSON.stringify(result.rows);
    for (const forbidden of [pending.p_payload.email, done.p_payload.email, 'other-account@example.invalid', 'synthetic-provider-secret-id', 'info@floridasecurityconcepts.com', 'Synthetic']) expect(text).not.toContain(forbidden);
  });
});
