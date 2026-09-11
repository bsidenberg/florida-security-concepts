import { it, expect, beforeEach, vi } from 'vitest';
import { mkdtemp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { deliverLocalReceipt, canonicalFingerprint } from '../../lib/leads/localReceipt';
import { validLead } from '../fixtures/lead';
const lead = { ...validLead, submittedAt: '2026-09-11T00:00:00.000Z' };
let directory: string;
beforeEach(async () => { await mkdir('.fsc-test/receipts', { recursive: true }); directory = await mkdtemp(resolve('.fsc-test/receipts/run-')); });
it('persists a complete receipt then replays unchanged without writing again', async () => {
  const id = randomUUID();
  expect((await deliverLocalReceipt(lead, id, { directory })).ok).toBe(true);
  const original = await readFile(join(directory, `${id}.json`), 'utf8');
  expect((await deliverLocalReceipt(lead, id, { directory })).ok).toBe(true);
  expect(await readFile(join(directory, `${id}.json`), 'utf8')).toBe(original);
  expect(JSON.parse(original)).toMatchObject({ requestId: id, payload: { email: lead.email, message: lead.message } });
  expect((await readdir(directory)).filter(file => file.endsWith('.json'))).toHaveLength(1);
});
it('changed user data conflicts while attribution changes replay', async () => {
  const id = randomUUID(); await deliverLocalReceipt(lead, id, { directory });
  expect(await deliverLocalReceipt({ ...lead, message: 'Changed' }, id, { directory })).toMatchObject({ ok: false, code: 'CONFLICT', status: 409 });
  expect((await deliverLocalReceipt({ ...lead, sourcePage: '/other', submittedAt: '2030-01-01T00:00:00Z' }, id, { directory })).ok).toBe(true);
});
it('fingerprint covers user edits and excludes attribution', () => {
  expect(canonicalFingerprint(lead)).toBe(canonicalFingerprint({ ...lead, utmCampaign: 'other' }));
  expect(canonicalFingerprint(lead)).not.toBe(canonicalFingerprint({ ...lead, phone: '2025550199' }));
});
it('normalizes UUID case to one receipt', async () => {
  const id = randomUUID(); await deliverLocalReceipt(lead, id.toUpperCase(), { directory });
  expect((await deliverLocalReceipt(lead, id, { directory })).ok).toBe(true); expect((await readdir(directory)).filter(file => file.endsWith('.json'))).toEqual([`${id}.json`]);
});
it('expires at24hours without overwriting its tombstone', async () => {
  const id = randomUUID(), now = Date.parse(lead.submittedAt);
  await deliverLocalReceipt(lead, id, { directory, now: () => now });
  expect((await deliverLocalReceipt(lead, id, { directory, now: () => now + 86400000 - 1 })).ok).toBe(true);
  expect(await deliverLocalReceipt(lead, id, { directory, now: () => now + 86400000 })).toMatchObject({ ok: false, code: 'EXPIRED' });
  expect((await readdir(directory)).filter(file => file.endsWith('.json'))).toHaveLength(1);
});
it.each(['', '{', '{"requestId":"broken"}'])('leaves partial or corrupt receipt untouched %j', async content => {
  const id = randomUUID(); await writeFile(join(directory, `${id}.json`), content);
  expect(await deliverLocalReceipt(lead, id, { directory })).toMatchObject({ ok: false, code: 'PENDING' });
  expect(await readFile(join(directory, `${id}.json`), 'utf8')).toBe(content);
});
it('rejects path traversal and nonsynthetic email without receipt', async () => {
  expect((await deliverLocalReceipt(lead, '../outside', { directory })).ok).toBe(false);
  expect((await deliverLocalReceipt({ ...lead, email: 'someone@example.com' }, randomUUID(), { directory })).ok).toBe(false);
  expect((await readdir(directory)).filter(file => file.endsWith('.json'))).toHaveLength(0);
});
it('incomplete existing claim remains pending before quota check', async () => {
  const id = randomUUID(); await writeFile(join(directory, `${id}.claim`), '{');
  const beforeCreate = vi.fn(() => false);
  expect(await deliverLocalReceipt(lead, id, { directory, beforeCreate })).toMatchObject({ ok: false, code: 'PENDING', status: 409 });
  expect(beforeCreate).not.toHaveBeenCalled();
});
function child(id: string) {
  const script = `import {deliverLocalReceipt} from ${JSON.stringify(pathToFileURL(resolve('lib/leads/localReceipt.ts')).href)}; console.log(JSON.stringify(await deliverLocalReceipt(${JSON.stringify(lead)},${JSON.stringify(id)},{directory:${JSON.stringify(directory)}})));`;
  return new Promise<{ ok: boolean; code?: string }>((done, reject) => {
    const proc = spawn(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', script], { windowsHide: true, shell: false });
    let output = ''; let error = ''; proc.stdout.on('data', b => output += b); proc.stderr.on('data', b => error += b); proc.on('error', reject);
    proc.on('close', code => code === 0 ? done(JSON.parse(output)) : reject(new Error(error)));
  });
}
it('concurrent independent processes and a restarted process create only one receipt', async () => {
  const id = randomUUID(); const results = await Promise.all([child(id), child(id)]);
  expect(results.some(r => r.ok)).toBe(true);
  expect(results.every(r => r.ok || r.code === 'PENDING')).toBe(true);
  expect((await child(id)).ok).toBe(true); expect((await readdir(directory)).filter(file => file.endsWith('.json'))).toEqual([`${id}.json`]);
});
