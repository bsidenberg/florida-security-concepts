import { createHash } from 'node:crypto';
import { access, link, mkdir, open, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { DeliveryResult, ValidatedLead } from './types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function canonicalPayload(lead: ValidatedLead) {
  return { fullName: lead.fullName, phone: lead.phone, email: lead.email, propertyType: lead.propertyType, service: lead.service, city: lead.city || '', company: lead.company || '', urgency: lead.urgency || 'Not specified', contactMethod: lead.contactMethod || 'Email', message: lead.message || '' };
}
export function canonicalFingerprint(lead: ValidatedLead): string {
  return createHash('sha256').update(JSON.stringify(canonicalPayload(lead))).digest('hex');
}
function failure(code: string, status: number): DeliveryResult { return { ok: false, mode: 'local', reason: code, code, status }; }
export async function deliverLocalReceipt(lead: ValidatedLead, requestId: string, options: { directory?: string; now?: () => number; beforeCreate?: () => boolean } = {}): Promise<DeliveryResult> {
  if (!UUID.test(requestId)) return failure('INVALID', 400);
  if (!/^[^@\s]+@example\.invalid$/i.test(lead.email)) return failure('LOCAL_ONLY', 400);
  const id = requestId.toLowerCase();
  const directory = options.directory || path.join(process.cwd(), '.fsc-local', 'receipts');
  const now = options.now || Date.now;
  const file = path.join(directory, `${id}.json`);
  const claim = path.join(directory, `${id}.claim`);
  const digest = canonicalFingerprint(lead);
  let created = false;
  async function existing(): Promise<DeliveryResult> {
    try {
      const record = JSON.parse(await readFile(file, 'utf8'));
      if (record.requestId !== id || typeof record.digest !== 'string' || !record.payload || record.digest !== createHash('sha256').update(JSON.stringify(record.payload)).digest('hex') || typeof record.acceptedAt !== 'string' || !Number.isFinite(Date.parse(record.acceptedAt))) return failure('PENDING', 409);
      if (now() - Date.parse(record.acceptedAt) >= 24 * 60 * 60 * 1000) return failure('EXPIRED', 409);
      if (record.digest !== digest) return failure('CONFLICT', 409);
      return { ok: true, mode: 'local', deliveryId: id };
    } catch { return failure('PENDING', 409); }
  }
  try {
    await mkdir(directory, { recursive: true });
    try { await access(file); return existing(); } catch { /* Exclusive create below is the concurrency authority. */ }
    try { await access(claim); return existing(); } catch { /* An unfinished claim is a retry too, never a new quota charge. */ }
    if (options.beforeCreate && !options.beforeCreate()) return { ok: false, mode: 'local', reason: 'RATE_LIMIT', code: 'RATE_LIMIT', status: 429, retryAfter: 600 };
    let handle;
    try { handle = await open(claim, 'wx', 0o600); created = true; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'EEXIST') return existing(); throw error; }
    try {
      await handle.writeFile(JSON.stringify({ requestId: id, digest, payload: canonicalPayload(lead), acceptedAt: new Date(now()).toISOString() }), 'utf8');
      await handle.sync();
    } finally { await handle.close(); }
    // Publish only after flush+close. The permanent claim prevents takeover on
    // crashes; both names refer to the same receipt inode, not duplicate data.
    await link(claim, file);
    return existing();
  } catch { return created ? failure('RECEIPT_UNKNOWN', 504) : failure('DELIVERY_FAILED', 503); }
}
