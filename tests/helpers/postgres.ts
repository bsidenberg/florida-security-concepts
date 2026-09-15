// Isolated real PostgreSQL 17 test cluster (D-018). Loopback only, synthetic
// data only, owned pg_ctl start/stop of this cluster's own data directory.
// Never invokes a PostgreSQL command-line client; all SQL goes through the
// Node `pg` driver. Never deletes directories: each cluster lives in a new
// unique folder under the ignored .fsc-test/postgres tree.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import pg from 'pg';

export const FSC_ACCOUNT = '11111111-1111-4111-8111-111111111111';
export const OTHER_ACCOUNT = '22222222-2222-4222-8222-222222222222';
export const RUNTIME_BIN = resolve('.fsc-test/pgsql/runtime/pgsql/bin');
export const RECEIPTS_SQL = resolve('sql/fsc-assessment-receipts.draft.sql');
const REQUIRED_BINARIES = ['postgres.exe', 'initdb.exe', 'pg_ctl.exe'];

/** Throws (never skips) when the pinned portable runtime is absent. */
export function requireRuntime(bin = RUNTIME_BIN): string {
  const missing = REQUIRED_BINARIES.filter(file => !existsSync(join(bin, file)));
  if (missing.length) throw new Error(`PostgreSQL 17 test runtime missing at ${bin}: ${missing.join(', ')}`);
  return bin;
}

function childEnvironment(bin: string): NodeJS.ProcessEnv {
  const env: Record<string, string | undefined> = {};
  for (const key of ['SystemRoot', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP']) if (process.env[key]) env[key] = process.env[key];
  env.PATH = [bin, process.env.SystemRoot ? join(process.env.SystemRoot, 'System32') : ''].filter(Boolean).join(';');
  return env as unknown as NodeJS.ProcessEnv;
}

function runBinary(bin: string, file: string, args: string[]): Promise<string> {
  return new Promise((done, reject) => {
    const child = spawn(join(bin, file), args, { shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: childEnvironment(bin) });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    child.on('error', reject);
    // pg_ctl start leaves the server holding inherited handles, so wait for exit, not close.
    child.on('exit', code => (code === 0 ? done(output) : reject(new Error(`${file} exited ${code}: ${output}`))));
  });
}

function freeLoopbackPort(): Promise<number> {
  return new Promise((done, reject) => {
    const server = createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') { server.close(); reject(new Error('No loopback port')); return; }
      server.close(() => done(address.port));
    });
  });
}

type Column = { name: string; data_type: string; options: string[]; default_value?: string; check?: string };
function tableColumns(table: string): string {
  const metadata = JSON.parse(readFileSync(resolve('harness/evidence/prime-schema-metadata-20260914.json'), 'utf8')) as { name: string; columns: Column[] }[];
  const entry = metadata.find(item => item.name === table);
  if (!entry) throw new Error(`Prime metadata missing ${table}`);
  return entry.columns.map(c => `"${c.name}" ${c.data_type}${c.options.includes('nullable') ? '' : ' NOT NULL'}${c.default_value ? ` DEFAULT ${c.default_value}` : ''}${c.check ? ` CHECK (${c.check})` : ''}`).join(',\n');
}

export type TestDatabase = {
  name: string;
  /** Superuser connection: fixture setup, fault injection and synthetic time manipulation only. */
  admin: pg.Client;
  /** Connection acting as Supabase service_role (SET ROLE, like PostgREST). */
  service: pg.Client;
  connect(role?: string | null): Promise<pg.Client>;
};

export type Cluster = {
  port: number;
  directory: string;
  dataDirectory: string;
  bin: string;
  connect(database: string, role?: string | null): Promise<pg.Client>;
  /** Fresh database copied from a template: 'migrated' (Prime + receipts draft) or 'prime' (Prime schema only). */
  database(kind?: 'migrated' | 'prime'): Promise<TestDatabase>;
  stop(mode?: 'fast' | 'immediate'): Promise<void>;
  start(): Promise<void>;
  isRunning(): boolean;
  serverLog(): string;
};

export async function startCluster(options: { bin?: string } = {}): Promise<Cluster> {
  const bin = requireRuntime(options.bin);
  mkdirSync(resolve('.fsc-test/postgres'), { recursive: true });
  const directory = mkdtempSync(resolve('.fsc-test/postgres/run-'));
  const dataDirectory = join(directory, 'data');
  const logFile = join(directory, 'server.log');
  const port = await freeLoopbackPort();
  await runBinary(bin, 'initdb.exe', ['-D', dataDirectory, '-U', 'fsc_test', '--auth=trust', '-E', 'UTF8', '--locale=C', '--no-sync', '--wal-segsize=1']);
  const clients = new Set<pg.Client>();
  let running = false;
  let counter = 0;
  const serverOptions = `-h 127.0.0.1 -p ${port} -c fsync=off -c shared_buffers=16MB -c max_connections=80 -c min_wal_size=2MB -c max_wal_size=16MB`;
  const start = async () => {
    await runBinary(bin, 'pg_ctl.exe', ['-D', dataDirectory, '-l', logFile, '-o', serverOptions, '-w', '-t', '60', 'start']);
    running = true;
  };
  const stop = async (mode: 'fast' | 'immediate' = 'fast') => {
    if (!running) return;
    for (const client of clients) { client.end().catch(() => undefined); }
    clients.clear();
    await runBinary(bin, 'pg_ctl.exe', ['-D', dataDirectory, '-w', '-t', '60', '-m', mode, 'stop']);
    running = false;
  };
  const connect = async (database: string, role: string | null = null) => {
    const client = new pg.Client({ host: '127.0.0.1', port, user: 'fsc_test', database });
    client.on('error', () => undefined); // server stop/restart tests terminate idle sessions deliberately
    await client.connect();
    clients.add(client);
    client.on('end', () => clients.delete(client));
    if (role) await client.query(`SET ROLE ${pg.escapeIdentifier(role)}`);
    return client;
  };
  await start();
  try {
    const root = await connect('postgres');
    // Cluster-wide synthetic Supabase-like roles. fsc_public_probe has no grants: it holds only what PUBLIC holds.
    await root.query(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE ROLE fsc_public_probe NOLOGIN;`);
    await root.query('CREATE DATABASE fsc_template_prime');
    await root.end();
    const prime = await connect('fsc_template_prime');
    await prime.query(`CREATE TABLE public.accounts (${tableColumns('public.accounts')}, PRIMARY KEY (id), UNIQUE (slug))`);
    await prime.query(`CREATE TABLE public.leads (${tableColumns('public.leads')}, PRIMARY KEY (id), FOREIGN KEY (account_id) REFERENCES public.accounts(id))`);
    await prime.query(`ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY; ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
      GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
      GRANT SELECT, UPDATE ON public.accounts TO service_role; GRANT SELECT, INSERT ON public.leads TO service_role;
      -- Supabase-like default privileges: new public functions are granted to API roles unless explicitly revoked.
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;`);
    await prime.query(`INSERT INTO public.accounts (id, name, slug, status, website_domain) VALUES
      ($1, 'Florida Security Concepts (synthetic)', 'fsc', 'active', 'https://www.floridasecurityconcepts.com/'),
      ($2, 'Unrelated synthetic account', 'fpb', 'active', 'https://unrelated.example.invalid')`, [FSC_ACCOUNT, OTHER_ACCOUNT]);
    await prime.end();
    const root2 = await connect('postgres');
    await root2.query('CREATE DATABASE fsc_template TEMPLATE fsc_template_prime');
    await root2.end();
    const migrated = await connect('fsc_template');
    await migrated.query(readFileSync(RECEIPTS_SQL, 'utf8'));
    await migrated.end();
  } catch (error) {
    await stop('fast').catch(() => undefined);
    throw error;
  }
  return {
    port, directory, dataDirectory, bin, connect, stop, start,
    isRunning: () => running,
    serverLog: () => (existsSync(logFile) ? readFileSync(logFile, 'utf8') : ''),
    async database(kind = 'migrated') {
      const name = `fsc_t${process.pid}_${++counter}`;
      const root = await connect('postgres');
      try { await root.query(`CREATE DATABASE ${name} TEMPLATE ${kind === 'migrated' ? 'fsc_template' : 'fsc_template_prime'}`); } finally { await root.end(); }
      const admin = await connect(name);
      const service = await connect(name, 'service_role');
      return { name, admin, service, connect: (role = null) => connect(name, role) };
    },
  };
}

const RPC_NAME = /^fsc_[a-z_]+_draft$/;
const PARAMETER = /^p_[a-z_]+$/;
/** Named-argument RPC call, mirroring PostgREST's POST /rpc/<name> JSON body. */
export async function callRpc(client: pg.Client, name: string, args: Record<string, unknown>): Promise<any> {
  if (!RPC_NAME.test(name)) throw new Error(`Unexpected RPC name ${name}`);
  const keys = Object.keys(args).filter(key => args[key] !== undefined);
  for (const key of keys) if (!PARAMETER.test(key)) throw new Error(`Unexpected RPC parameter ${key}`);
  const values = keys.map(key => { const value = args[key]; return value !== null && typeof value === 'object' ? JSON.stringify(value) : value; });
  const sql = `SELECT public.${name}(${keys.map((key, index) => `${key} => $${index + 1}`).join(', ')}) AS result`;
  return (await client.query(sql, values)).rows[0].result;
}

/** Runs a whole SQL file/script as one simple-protocol batch; on error rolls back the open transaction block. */
export async function runScript(client: pg.Client, sql: string): Promise<void> {
  try { await client.query(sql); } catch (error) { await client.query('ROLLBACK').catch(() => undefined); throw error; }
}

export async function rows<T = any>(client: pg.Client, sql: string, values: unknown[] = []): Promise<T[]> {
  return (await client.query(sql, values)).rows as T[];
}
export async function count(client: pg.Client, sql: string, values: unknown[] = []): Promise<number> {
  return Number((await client.query(sql, values)).rows[0].count);
}

/** Every text rendering of every row in every fsc_private table (for leak scans). */
export async function privateTableText(admin: pg.Client): Promise<string> {
  const tables = await rows<{ name: string }>(admin, `SELECT format('%I.%I', schemaname, tablename) AS name FROM pg_tables WHERE schemaname = 'fsc_private' ORDER BY 1`);
  if (!tables.length) throw new Error('fsc_private has no tables to scan');
  let text = '';
  for (const table of tables) for (const row of await rows<{ t: string }>(admin, `SELECT t::text AS t FROM ${table.name} t`)) text += `${table.name} ${row.t}\n`;
  return text;
}
