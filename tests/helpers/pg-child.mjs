// Separate OS process for PostgreSQL contention tests. Protocol:
//   stdin = JSON { port, database, role, barrier, calls: [{ sql, values }] }
// Prints one JSON line {type:'ready', pid, backend} after connecting, blocks on a
// shared advisory lock the parent holds exclusively (start barrier), runs the
// calls in order and prints {type:'done', pid, backend, results}. Each result is
// { value } or { error, code }. Synthetic loopback database only.
import pg from 'pg';

let raw = '';
for await (const chunk of process.stdin) raw += chunk;
const input = JSON.parse(raw);
const client = new pg.Client({ host: '127.0.0.1', port: input.port, user: 'fsc_test', database: input.database });
client.on('error', () => undefined);
await client.connect();
if (input.role) await client.query(`SET ROLE ${pg.escapeIdentifier(input.role)}`);
const backend = (await client.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
process.stdout.write(JSON.stringify({ type: 'ready', pid: process.pid, backend }) + '\n');
await client.query('SELECT pg_advisory_lock_shared($1)', [input.barrier]);
await client.query('SELECT pg_advisory_unlock_shared($1)', [input.barrier]);
const results = [];
for (const call of input.calls) {
  try {
    const result = await client.query(call.sql, call.values);
    results.push({ value: result.rows[0] ? Object.values(result.rows[0])[0] : null });
  } catch (error) {
    results.push({ error: String(error.message), code: error.code });
  }
}
await client.end();
process.stdout.write(JSON.stringify({ type: 'done', pid: process.pid, backend, results }) + '\n');
