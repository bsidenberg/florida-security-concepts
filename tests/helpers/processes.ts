import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import type pg from 'pg';
import { rows } from './postgres';

export type ChildCall = { sql: string; values: unknown[] };
export type ChildResult = { value?: any; error?: string; code?: string };
export type ChildReport = { pid: number; backend: number; results: ChildResult[] };

const CHILD = resolve('tests/helpers/pg-child.mjs');

/** Only what a Node child needs, passed explicitly; keeps the gate's network guard preload. */
function childEnvironment(): NodeJS.ProcessEnv {
  const env: Record<string, string | undefined> = {};
  for (const key of ['PATH', 'Path', 'SystemRoot', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'NODE_OPTIONS', 'FSC_NETWORK_VIOLATION', 'FSC_ALLOW_FONT_NETWORK']) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  return env as unknown as NodeJS.ProcessEnv;
}

/**
 * Starts one separate `node` OS process per call list, waits until every child
 * is connected and blocked on the barrier advisory lock held by `admin`, then
 * releases them simultaneously. Resolves with each child's report.
 */
export async function raceProcesses(admin: pg.Client, connection: { port: number; database: string; role?: string | null }, callLists: ChildCall[][]): Promise<ChildReport[]> {
  const barrier = 700000 + Math.floor(Math.random() * 100000);
  await admin.query('SELECT pg_advisory_lock($1)', [barrier]);
  let released = false;
  try {
    const children = callLists.map(calls => {
      const payload = JSON.stringify({ port: connection.port, database: connection.database, role: connection.role ?? 'service_role', barrier, calls });
      const child = spawn(process.execPath, [CHILD], { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], env: childEnvironment(), cwd: resolve('.') });
      child.stdin.end(payload);
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', chunk => { stdout += chunk; });
      child.stderr.on('data', chunk => { stderr += chunk; });
      const finished = new Promise<ChildReport>((done, reject) => {
        child.on('error', reject);
        child.on('close', code => {
          const done_ = stdout.split('\n').filter(Boolean).map(line => JSON.parse(line)).find(message => message.type === 'done');
          if (code !== 0 || !done_) reject(new Error(`child exited ${code}: ${stderr}`));
          else done({ pid: done_.pid, backend: done_.backend, results: done_.results });
        });
      });
      return { child, finished };
    });
    // Wait until every child is blocked on the barrier (proves they are all live and contending).
    const deadline = Date.now() + 30000;
    for (;;) {
      const waiting = await rows<{ n: string }>(admin, `SELECT count(*) AS n FROM pg_locks WHERE locktype = 'advisory' AND objid = $1 AND NOT granted`, [barrier]);
      if (Number(waiting[0].n) === callLists.length) break;
      if (Date.now() > deadline) throw new Error('children never reached the barrier');
      await new Promise(done => setTimeout(done, 25));
    }
    await admin.query('SELECT pg_advisory_unlock($1)', [barrier]);
    released = true;
    return await Promise.all(children.map(item => item.finished));
  } finally {
    if (!released) await admin.query('SELECT pg_advisory_unlock($1)', [barrier]).catch(() => undefined);
  }
}

export function rpcCall(name: string, args: Record<string, unknown>): ChildCall {
  const keys = Object.keys(args);
  return {
    sql: `SELECT public.${name}(${keys.map((key, index) => `${key} => $${index + 1}`).join(', ')}) AS result`,
    values: keys.map(key => { const value = args[key]; return value !== null && typeof value === 'object' ? JSON.stringify(value) : value; }),
  };
}
