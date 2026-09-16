// Synthetic DB-time manipulation for expiry/cutoff/purge boundaries. Runs as the
// test superuser with session_replication_role=replica so the immutability
// triggers do not fire; CHECK constraints still apply, so created/expiry/purge
// are always shifted together exactly as the schema requires.
import type pg from 'pg';

export async function setReceiptAge(admin: pg.Client, requestId: string, age: string): Promise<void> {
  await admin.query('BEGIN');
  try {
    await admin.query('SET LOCAL session_replication_role = replica');
    const result = await admin.query(
      `WITH t AS (SELECT clock_timestamp() - $2::interval AS c)
       UPDATE fsc_private.assessment_receipts r SET created_at = t.c, expires_at = t.c + interval '24 hours', purge_after = t.c + interval '7 days'
       FROM t WHERE r.request_id = $1`, [requestId, age]);
    if (result.rowCount !== 1) throw new Error(`setReceiptAge matched ${result.rowCount} rows`);
    await admin.query('COMMIT');
  } catch (error) { await admin.query('ROLLBACK'); throw error; }
}

export async function expireLease(admin: pg.Client, requestId: string, effect: string): Promise<void> {
  const result = await admin.query(`UPDATE fsc_private.assessment_effects SET lease_until = clock_timestamp() - interval '1 second' WHERE request_id = $1 AND effect = $2 AND state = 'inflight'`, [requestId, effect]);
  if (result.rowCount !== 1) throw new Error(`expireLease matched ${result.rowCount} rows`);
}
