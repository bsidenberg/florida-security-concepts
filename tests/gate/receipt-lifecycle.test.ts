// AM-003 receipt SQL contract against real PostgreSQL 17 (synthetic data only).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import { callRpc, count, FSC_ACCOUNT, OTHER_ACCOUNT, rows, startCluster, type Cluster, type TestDatabase } from '../helpers/postgres';
import { digestFor, receiptArgs } from '../helpers/receipt-fixtures';
import { setReceiptAge } from '../helpers/receipt-time';

let cluster: Cluster;
let db: TestDatabase;
beforeAll(async () => { cluster = await startCluster(); db = await cluster.database(); }, 120_000);
afterAll(async () => { await cluster?.stop('fast'); }, 60_000);

const claim = (client: pg.Client, request: string, effect: string) => callRpc(client, 'fsc_effect_claim_draft', { p_slug: 'fsc', p_request: request, p_effect: effect });
const finish = (client: pg.Client, request: string, effect: string, token: string, state: string, provider: string | null = null, error: string | null = null) =>
  callRpc(client, 'fsc_effect_finish_draft', { p_slug: 'fsc', p_request: request, p_effect: effect, p_token: token, p_state: state, p_provider_id: provider, p_error: error });
const receiptText = async (client: pg.Client, request: string) => (await rows<{ t: string }>(client, `SELECT r::text AS t FROM fsc_private.assessment_receipts r WHERE request_id = $1`, [request])).map(r => r.t);
const effectsText = async (client: pg.Client, request: string) => (await rows<{ t: string }>(client, `SELECT e::text AS t FROM fsc_private.assessment_effects e WHERE request_id = $1 ORDER BY effect`, [request])).map(r => r.t);
async function acceptCompany(client: pg.Client, request: string) {
  const lease = await claim(client, request, 'company_email');
  expect(lease.code).toBe('CLAIMED');
  expect((await finish(client, request, 'company_email', lease.lease_token, 'succeeded', 'synthetic-provider-id')).code).toBe('SUCCEEDED');
}

describe('receipt create and replay', { timeout: 60_000 }, () => {
  it('creates one receipt with three effects and an unchanged replay returns the same receipt_id without new rows', async () => {
    const args = receiptArgs({ source: digestFor('create-replay') });
    const created = await callRpc(db.service, 'fsc_receipt_create_draft', args);
    expect(created).toEqual({ code: 'READY', receipt_id: expect.stringMatching(/^[0-9a-f-]{36}$/) });
    const effects = await rows(db.admin, `SELECT effect, state, idempotency_key FROM fsc_private.assessment_effects WHERE request_id = $1 ORDER BY effect`, [args.p_request]);
    expect(effects.map(e => [e.effect, e.state])).toEqual([['company_email', 'pending'], ['customer_email', 'pending'], ['prime_lead', 'pending']]);
    expect(effects[0].idempotency_key).toContain(created.receipt_id);
    expect(effects[1].idempotency_key).toContain(created.receipt_id);
    expect(effects[0].idempotency_key).not.toBe(effects[1].idempotency_key);
    expect(effects[2].idempotency_key).toBeNull();
    const before = [await receiptText(db.admin, args.p_request), await effectsText(db.admin, args.p_request)];

    expect(await callRpc(db.service, 'fsc_receipt_create_draft', args)).toEqual({ code: 'READY', receipt_id: created.receipt_id });
    expect([await receiptText(db.admin, args.p_request), await effectsText(db.admin, args.p_request)]).toEqual(before);
    await acceptCompany(db.service, args.p_request);
    expect(await callRpc(db.service, 'fsc_receipt_create_draft', args)).toEqual({ code: 'RECEIVED', receipt_id: created.receipt_id });
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_receipts WHERE request_id = $1`, [args.p_request])).toBe(1);
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_effects WHERE request_id = $1`, [args.p_request])).toBe(3);
  });

  it('marks the customer effect skipped when no customer envelope was snapshotted', async () => {
    const args = receiptArgs({ customer: false, source: digestFor('skip-customer') });
    expect((await callRpc(db.service, 'fsc_receipt_create_draft', args)).code).toBe('READY');
    const [customer] = await rows(db.admin, `SELECT state, idempotency_key FROM fsc_private.assessment_effects WHERE request_id = $1 AND effect = 'customer_email'`, [args.p_request]);
    expect(customer.state).toBe('skipped');
    expect((await claim(db.service, args.p_request, 'customer_email')).code).toBe('SKIPPED');
  });

  it('changed payload under the same ID returns CONFLICT and changes no receipt or effect row', async () => {
    const args = receiptArgs({ source: digestFor('conflict') });
    const created = await callRpc(db.service, 'fsc_receipt_create_draft', args);
    const before = [await receiptText(db.admin, args.p_request), await effectsText(db.admin, args.p_request)];
    const changed = receiptArgs({ requestId: args.p_request, message: 'Different synthetic message', email: args.p_payload.email, source: digestFor('conflict') });
    expect(changed.p_fingerprint).not.toBe(args.p_fingerprint);
    expect(await callRpc(db.service, 'fsc_receipt_create_draft', changed)).toEqual({ code: 'CONFLICT' });
    expect([await receiptText(db.admin, args.p_request), await effectsText(db.admin, args.p_request)]).toEqual(before);
    expect(await callRpc(db.service, 'fsc_receipt_create_draft', args)).toEqual({ code: 'READY', receipt_id: created.receipt_id });
  });

  it.each([
    ['company recipient is not the approved inbox', (a: ReturnType<typeof receiptArgs>) => ({ ...a, p_envelopes: { ...a.p_envelopes, company_email: { ...(a.p_envelopes.company_email as object), to: 'someone@example.invalid' } } })],
    ['fingerprint is not 64 lowercase hex', (a: ReturnType<typeof receiptArgs>) => ({ ...a, p_fingerprint: a.p_fingerprint.toUpperCase() })],
    ['payload is not an object', (a: ReturnType<typeof receiptArgs>) => ({ ...a, p_payload: ['not', 'object'] })],
    ['company envelope is missing', (a: ReturnType<typeof receiptArgs>) => ({ ...a, p_envelopes: { customer_email: a.p_envelopes.customer_email } })],
  ])('rejects invalid input (%s) without writing any row', async (_label, mutate) => {
    const args = mutate(receiptArgs({ source: digestFor('invalid-input') }));
    const before = await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_receipts`);
    await expect(callRpc(db.service, 'fsc_receipt_create_draft', args)).rejects.toThrow(/FSC_INVALID_RECEIPT/);
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_receipts`)).toBe(before);
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_receipts WHERE request_id = $1`, [args.p_request])).toBe(0);
  });
});

describe('24 hour expiry boundary (synthetic DB time)', { timeout: 60_000 }, () => {
  it('replays just before 24 h, refuses claims inside the 15 s cutoff margin, and returns EXPIRED at 24 h with no new effects', async () => {
    const args = receiptArgs({ source: digestFor('expiry') });
    const created = await callRpc(db.service, 'fsc_receipt_create_draft', args);
    await setReceiptAge(db.admin, args.p_request, '23 hours 59 minutes 50 seconds');
    expect(await callRpc(db.service, 'fsc_receipt_create_draft', args)).toEqual({ code: 'READY', receipt_id: created.receipt_id });
    expect((await claim(db.service, args.p_request, 'company_email')).code).toBe('CUTOFF');
    const effectsBefore = await effectsText(db.admin, args.p_request);

    await setReceiptAge(db.admin, args.p_request, '24 hours');
    expect(await callRpc(db.service, 'fsc_receipt_create_draft', args)).toEqual({ code: 'EXPIRED', receipt_id: created.receipt_id });
    const changed = receiptArgs({ requestId: args.p_request, message: 'changed after expiry', source: digestFor('expiry') });
    expect((await callRpc(db.service, 'fsc_receipt_create_draft', changed)).code).toBe('EXPIRED');
    expect((await claim(db.service, args.p_request, 'company_email')).code).toBe('EXPIRED');
    expect(await effectsText(db.admin, args.p_request)).toEqual(effectsBefore);
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_receipts WHERE request_id = $1`, [args.p_request])).toBe(1);
  });

  it('an already-successful receipt still returns EXPIRED after 24 h', async () => {
    const args = receiptArgs({ source: digestFor('expired-success') });
    const created = await callRpc(db.service, 'fsc_receipt_create_draft', args);
    await acceptCompany(db.service, args.p_request);
    await setReceiptAge(db.admin, args.p_request, '24 hours 1 second');
    expect(await callRpc(db.service, 'fsc_receipt_create_draft', args)).toEqual({ code: 'EXPIRED', receipt_id: created.receipt_id });
  });
});

describe('purge and erase tombstones', { timeout: 60_000 }, () => {
  it('seven-day purge clears the private copy, keeps a minimal tombstone, is idempotent and the ID cannot be recreated', async () => {
    const old = receiptArgs({ source: digestFor('purge-old') });
    const fresh = receiptArgs({ source: digestFor('purge-fresh') });
    const oldReceipt = await callRpc(db.service, 'fsc_receipt_create_draft', old);
    await callRpc(db.service, 'fsc_receipt_create_draft', fresh);
    const lease = await claim(db.service, old.p_request, 'company_email');
    expect(lease.code).toBe('CLAIMED');
    const [identity] = await rows(db.admin, `SELECT receipt_id, prime_lead_id FROM fsc_private.assessment_receipts WHERE request_id = $1`, [old.p_request]);
    // Age: the old receipt passes its purge deadline; the fresh one does not.
    await db.admin.query('BEGIN');
    await db.admin.query('SET LOCAL session_replication_role = replica');
    await db.admin.query(`UPDATE fsc_private.assessment_effects SET first_attempt_at = first_attempt_at - interval '7 days 1 second', retry_cutoff = retry_cutoff - interval '7 days 1 second', lease_until = lease_until - interval '7 days 1 second' WHERE request_id = $1 AND effect = 'company_email'`, [old.p_request]);
    await db.admin.query('COMMIT');
    await setReceiptAge(db.admin, old.p_request, '7 days 1 second');

    const purged = await callRpc(db.service, 'fsc_receipt_purge_draft', { p_slug: 'fsc' });
    expect(purged).toBe(1); // only the aged receipt in this database is past its purge deadline
    const [tomb] = await rows(db.admin, `SELECT receipt_id, prime_lead_id, fingerprint, payload, envelopes, template_version, purged_at IS NOT NULL AS purged FROM fsc_private.assessment_receipts WHERE request_id = $1`, [old.p_request]);
    expect(tomb).toEqual({ receipt_id: identity.receipt_id, prime_lead_id: identity.prime_lead_id, fingerprint: null, payload: null, envelopes: null, template_version: null, purged: true });
    const effects = await rows(db.admin, `SELECT effect, state, idempotency_key, provider_id, first_attempt_at, retry_cutoff, lease_token, lease_until, error_category FROM fsc_private.assessment_effects WHERE request_id = $1 ORDER BY effect`, [old.p_request]);
    expect(effects).toEqual([
      { effect: 'company_email', state: 'uncertain', idempotency_key: null, provider_id: null, first_attempt_at: null, retry_cutoff: null, lease_token: null, lease_until: null, error_category: null },
      { effect: 'customer_email', state: 'pending', idempotency_key: null, provider_id: null, first_attempt_at: null, retry_cutoff: null, lease_token: null, lease_until: null, error_category: null },
      { effect: 'prime_lead', state: 'pending', idempotency_key: null, provider_id: null, first_attempt_at: null, retry_cutoff: null, lease_token: null, lease_until: null, error_category: null },
    ]);
    const [freshRow] = await rows(db.admin, `SELECT payload IS NOT NULL AS has_payload, purged_at FROM fsc_private.assessment_receipts WHERE request_id = $1`, [fresh.p_request]);
    expect(freshRow).toEqual({ has_payload: true, purged_at: null });

    expect(await callRpc(db.service, 'fsc_receipt_purge_draft', { p_slug: 'fsc' })).toBe(0);
    expect(await callRpc(db.service, 'fsc_receipt_create_draft', old)).toEqual({ code: 'EXPIRED', receipt_id: oldReceipt.receipt_id });
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_receipts WHERE request_id = $1`, [old.p_request])).toBe(1);
    expect((await claim(db.service, old.p_request, 'company_email')).code).toBe('EXPIRED');
  });

  it('erase clears an unexpired receipt immediately; the ID is then unrecreatable and unknown IDs return false', async () => {
    const args = receiptArgs({ source: digestFor('erase') });
    const created = await callRpc(db.service, 'fsc_receipt_create_draft', args);
    await acceptCompany(db.service, args.p_request);
    expect(await callRpc(db.service, 'fsc_receipt_erase_draft', { p_slug: 'fsc', p_request: args.p_request })).toBe(true);
    const [row] = await rows(db.admin, `SELECT payload, envelopes, fingerprint, template_version, purged_at IS NOT NULL AS purged FROM fsc_private.assessment_receipts WHERE request_id = $1`, [args.p_request]);
    expect(row).toEqual({ payload: null, envelopes: null, fingerprint: null, template_version: null, purged: true });
    expect(await count(db.admin, `SELECT count(*) FROM fsc_private.assessment_effects WHERE request_id = $1 AND (provider_id IS NOT NULL OR idempotency_key IS NOT NULL)`, [args.p_request])).toBe(0);
    expect(await callRpc(db.service, 'fsc_receipt_create_draft', args)).toEqual({ code: 'EXPIRED', receipt_id: created.receipt_id });
    expect((await claim(db.service, args.p_request, 'prime_lead')).code).toBe('EXPIRED');
    expect(await callRpc(db.service, 'fsc_receipt_erase_draft', { p_slug: 'fsc', p_request: randomUUID() })).toBe(false);
  });
});

describe('immutability triggers', { timeout: 60_000 }, () => {
  const receiptUpdates: [string, string, RegExp][] = [
    ['payload', `payload = jsonb_set(payload, '{message}', '"tampered"')`, /FSC_IMMUTABLE_PAYLOAD/],
    ['envelopes', `envelopes = jsonb_set(envelopes, '{company_email,to}', '"attacker@example.invalid"')`, /FSC_IMMUTABLE_PAYLOAD/],
    ['fingerprint', `fingerprint = repeat('a', 64)`, /FSC_IMMUTABLE_PAYLOAD/],
    ['template_version', `template_version = 'other-template'`, /FSC_IMMUTABLE_PAYLOAD/],
    ['partial purge (payload only)', `payload = NULL`, /FSC_IMMUTABLE_PAYLOAD/],
    ['request_id', `request_id = gen_random_uuid()`, /FSC_IMMUTABLE_IDENTITY/],
    ['receipt_id', `receipt_id = gen_random_uuid()`, /FSC_IMMUTABLE_IDENTITY/],
    ['prime_lead_id', `prime_lead_id = gen_random_uuid()`, /FSC_IMMUTABLE_IDENTITY/],
    ['account_id', `account_id = '${OTHER_ACCOUNT}'`, /FSC_IMMUTABLE_IDENTITY/],
    ['created/expiry/purge timestamps', `created_at = created_at - interval '1 hour', expires_at = expires_at - interval '1 hour', purge_after = purge_after - interval '1 hour'`, /FSC_IMMUTABLE_IDENTITY/],
  ];
  it.each(receiptUpdates)('service_role cannot change receipt %s', async (_label, assignment, error) => {
    const args = receiptArgs({ source: digestFor('immutable') });
    await callRpc(db.service, 'fsc_receipt_create_draft', args);
    const before = await receiptText(db.admin, args.p_request);
    await expect(db.service.query(`UPDATE fsc_private.assessment_receipts SET ${assignment} WHERE request_id = $1`, [args.p_request])).rejects.toThrow(error);
    expect(await receiptText(db.admin, args.p_request)).toEqual(before);
  });

  it('first acceptance time cannot be rewritten once set', async () => {
    const args = receiptArgs({ source: digestFor('immutable-accept') });
    await callRpc(db.service, 'fsc_receipt_create_draft', args);
    await acceptCompany(db.service, args.p_request);
    const before = await receiptText(db.admin, args.p_request);
    await expect(db.service.query(`UPDATE fsc_private.assessment_receipts SET accepted_at = accepted_at + interval '1 second' WHERE request_id = $1`, [args.p_request])).rejects.toThrow(/FSC_IMMUTABLE_ACCEPTANCE/);
    await expect(db.service.query(`UPDATE fsc_private.assessment_receipts SET accepted_at = NULL WHERE request_id = $1`, [args.p_request])).rejects.toThrow(/FSC_IMMUTABLE_ACCEPTANCE/);
    expect(await receiptText(db.admin, args.p_request)).toEqual(before);
  });

  it('claims return no payload for any effect (D-023 N-2)', async () => {
    const args = receiptArgs({ source: digestFor('claim-payload') });
    await callRpc(db.service, 'fsc_receipt_create_draft', args);
    const company = await claim(db.service, args.p_request, 'company_email');
    expect(company.code).toBe('CLAIMED');
    expect(company.payload ?? null).toBeNull();
    expect((await finish(db.service, args.p_request, 'company_email', company.lease_token, 'succeeded', 'synthetic')).code).toBe('SUCCEEDED');
    for (const effect of ['customer_email', 'prime_lead']) {
      const lease = await claim(db.service, args.p_request, effect);
      expect({ effect, code: lease.code, payload: lease.payload ?? null }).toEqual({ effect, code: 'CLAIMED', payload: null });
    }
  });

  it('an uncertain effect can never be rewritten to failed (D-023)', async () => {
    const args = receiptArgs({ source: digestFor('uncertain-to-failed') });
    await callRpc(db.service, 'fsc_receipt_create_draft', args);
    const lease = await claim(db.service, args.p_request, 'company_email');
    expect((await finish(db.service, args.p_request, 'company_email', lease.lease_token, 'uncertain', null, 'ambiguous')).code).toBe('UNCERTAIN');
    const before = await effectsText(db.admin, args.p_request);
    await expect(db.service.query(`UPDATE fsc_private.assessment_effects SET state = 'failed', error_category = 'configuration' WHERE request_id = $1 AND effect = 'company_email'`, [args.p_request])).rejects.toThrow(/FSC_/);
    expect(await effectsText(db.admin, args.p_request)).toEqual(before);
  });

  it('effect idempotency key, first attempt/cutoff and final states cannot be rewritten', async () => {
    const args = receiptArgs({ source: digestFor('immutable-effect') });
    await callRpc(db.service, 'fsc_receipt_create_draft', args);
    await acceptCompany(db.service, args.p_request);
    const before = await effectsText(db.admin, args.p_request);
    for (const assignment of [`idempotency_key = 'fsc/regenerated'`, `first_attempt_at = first_attempt_at + interval '1 second'`, `retry_cutoff = retry_cutoff - interval '1 second'`, `state = 'pending'`]) {
      await expect(db.service.query(`UPDATE fsc_private.assessment_effects SET ${assignment} WHERE request_id = $1 AND effect = 'company_email'`, [args.p_request])).rejects.toThrow(/FSC_IMMUTABLE_EFFECT/);
    }
    expect(await effectsText(db.admin, args.p_request)).toEqual(before);
  });
});

describe('Prime lead effect', { timeout: 60_000 }, () => {
  it('waits for company acceptance, inserts exactly one lead with the stable UUID and marks the effect; repeats never insert again', async () => {
    const args = receiptArgs({ source: digestFor('prime'), utmSource: 'google' });
    await callRpc(db.service, 'fsc_receipt_create_draft', args);
    expect((await claim(db.service, args.p_request, 'prime_lead')).code).toBe('PRIMARY_PENDING');
    expect((await callRpc(db.service, 'fsc_prime_record_draft', { p_slug: 'fsc', p_request: args.p_request, p_token: randomUUID() })).code).toBe('PRIMARY_PENDING');
    const [{ prime_lead_id: leadId }] = await rows(db.admin, `SELECT prime_lead_id FROM fsc_private.assessment_receipts WHERE request_id = $1`, [args.p_request]);
    expect(await count(db.admin, `SELECT count(*) FROM public.leads WHERE id = $1`, [leadId])).toBe(0);

    await acceptCompany(db.service, args.p_request);
    const lease = await claim(db.service, args.p_request, 'prime_lead');
    expect(lease).toMatchObject({ code: 'CLAIMED', prime_lead_id: leadId });
    expect(lease.payload ?? null).toBeNull(); // D-023 N-2: claims never return the private payload
    expect((await callRpc(db.service, 'fsc_prime_record_draft', { p_slug: 'fsc', p_request: args.p_request, p_token: randomUUID() })).code).toBe('STALE_LEASE');
    expect(await count(db.admin, `SELECT count(*) FROM public.leads WHERE id = $1`, [leadId])).toBe(0);
    const totalBefore = await count(db.admin, `SELECT count(*) FROM public.leads`);

    expect(await callRpc(db.service, 'fsc_prime_record_draft', { p_slug: 'fsc', p_request: args.p_request, p_token: lease.lease_token })).toEqual({ code: 'SUCCEEDED', lead_id: leadId });
    const leads = await rows(db.admin, `SELECT account_id, client_key, contact_email, contact_name, lead_type, ingest_source, source_platform FROM public.leads WHERE id = $1`, [leadId]);
    expect(leads).toEqual([{ account_id: FSC_ACCOUNT, client_key: 'fsc', contact_email: args.p_payload.email, contact_name: args.p_payload.fullName, lead_type: 'form', ingest_source: 'fsc-website', source_platform: 'google' }]);
    const [effect] = await rows(db.admin, `SELECT state, lease_token FROM fsc_private.assessment_effects WHERE request_id = $1 AND effect = 'prime_lead'`, [args.p_request]);
    expect(effect).toEqual({ state: 'succeeded', lease_token: null });

    expect(await callRpc(db.service, 'fsc_prime_record_draft', { p_slug: 'fsc', p_request: args.p_request, p_token: lease.lease_token })).toEqual({ code: 'SUCCEEDED', lead_id: leadId });
    expect((await claim(db.service, args.p_request, 'prime_lead')).code).toBe('SUCCEEDED');
    expect(await count(db.admin, `SELECT count(*) FROM public.leads`)).toBe(totalBefore + 1);
  });

  it('a UUID collision with an unrelated lead fails closed: the unrelated lead is untouched and the effect is not marked', async () => {
    const args = receiptArgs({ source: digestFor('prime-collision') });
    await callRpc(db.service, 'fsc_receipt_create_draft', args);
    await acceptCompany(db.service, args.p_request);
    const [{ prime_lead_id: leadId }] = await rows(db.admin, `SELECT prime_lead_id FROM fsc_private.assessment_receipts WHERE request_id = $1`, [args.p_request]);
    await db.admin.query(`INSERT INTO public.leads (id, account_id, client_key, contact_email, notes) VALUES ($1, $2, 'fpb', 'unrelated@example.invalid', 'unrelated synthetic lead')`, [leadId, OTHER_ACCOUNT]);
    const lease = await claim(db.service, args.p_request, 'prime_lead');
    await expect(callRpc(db.service, 'fsc_prime_record_draft', { p_slug: 'fsc', p_request: args.p_request, p_token: lease.lease_token })).rejects.toMatchObject({ code: '23505' });
    expect(await rows(db.admin, `SELECT account_id, contact_email, notes FROM public.leads WHERE id = $1`, [leadId])).toEqual([{ account_id: OTHER_ACCOUNT, contact_email: 'unrelated@example.invalid', notes: 'unrelated synthetic lead' }]);
    const [effect] = await rows(db.admin, `SELECT state, lease_token::text AS token FROM fsc_private.assessment_effects WHERE request_id = $1 AND effect = 'prime_lead'`, [args.p_request]);
    expect(effect).toEqual({ state: 'inflight', token: lease.lease_token });
  });

  it('lead insert and effect update commit together (fault injection: effect update fails after the insert)', async () => {
    const faulty = await cluster.database();
    const args = receiptArgs({ source: digestFor('prime-atomic') });
    await callRpc(faulty.service, 'fsc_receipt_create_draft', args);
    await acceptCompany(faulty.service, args.p_request);
    const lease = await claim(faulty.service, args.p_request, 'prime_lead');
    await faulty.admin.query(`CREATE FUNCTION public.synthetic_fault() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYNTHETIC_EFFECT_WRITE_FAILURE'; END $$;
      CREATE TRIGGER zz_synthetic_fault BEFORE UPDATE ON fsc_private.assessment_effects FOR EACH ROW WHEN (NEW.effect = 'prime_lead' AND NEW.state = 'succeeded') EXECUTE FUNCTION public.synthetic_fault();`);
    await expect(callRpc(faulty.service, 'fsc_prime_record_draft', { p_slug: 'fsc', p_request: args.p_request, p_token: lease.lease_token })).rejects.toThrow(/SYNTHETIC_EFFECT_WRITE_FAILURE/);
    const [{ prime_lead_id: leadId }] = await rows(faulty.admin, `SELECT prime_lead_id FROM fsc_private.assessment_receipts WHERE request_id = $1`, [args.p_request]);
    expect(await count(faulty.admin, `SELECT count(*) FROM public.leads WHERE id = $1`, [leadId])).toBe(0);
    await faulty.admin.query(`DROP TRIGGER zz_synthetic_fault ON fsc_private.assessment_effects`);
    expect((await callRpc(faulty.service, 'fsc_prime_record_draft', { p_slug: 'fsc', p_request: args.p_request, p_token: lease.lease_token })).code).toBe('SUCCEEDED');
    expect(await count(faulty.admin, `SELECT count(*) FROM public.leads WHERE id = $1`, [leadId])).toBe(1);
  });
});

describe('account refusal', { timeout: 60_000 }, () => {
  let accounts: TestDatabase;
  let existing: ReturnType<typeof receiptArgs>;
  beforeAll(async () => {
    accounts = await cluster.database();
    existing = receiptArgs({ source: digestFor('account-existing') });
    expect((await callRpc(accounts.service, 'fsc_receipt_create_draft', existing)).code).toBe('READY');
  }, 60_000);

  it.each([
    ['inactive', `status = 'inactive'`],
    ['archived', `status = 'archived'`],
    ['domain mismatch', `website_domain = 'https://floridasecurityconcepts.com.attacker.example.invalid'`],
    ['missing domain', `website_domain = NULL`],
  ])('%s FSC account refuses create, claim and finish before any write', async (_label, assignment) => {
    await accounts.admin.query(`UPDATE public.accounts SET ${assignment} WHERE slug = 'fsc'`);
    try {
      const snapshot = async () => [await count(accounts.admin, `SELECT count(*) FROM fsc_private.assessment_receipts`), await count(accounts.admin, `SELECT count(*) FROM fsc_private.assessment_effects`), await count(accounts.admin, `SELECT count(*) FROM fsc_private.admission_counters`), await effectsText(accounts.admin, existing.p_request)];
      const before = await snapshot();
      await expect(callRpc(accounts.service, 'fsc_receipt_create_draft', receiptArgs({ source: digestFor('account-new') }))).rejects.toThrow(/FSC_ACCOUNT_REFUSED/);
      await expect(callRpc(accounts.service, 'fsc_receipt_create_draft', existing)).rejects.toThrow(/FSC_ACCOUNT_REFUSED/);
      await expect(claim(accounts.service, existing.p_request, 'company_email')).rejects.toThrow(/FSC_ACCOUNT_REFUSED/);
      await expect(finish(accounts.service, existing.p_request, 'company_email', randomUUID(), 'succeeded')).rejects.toThrow(/FSC_ACCOUNT_REFUSED/);
      expect(await snapshot()).toEqual(before);
    } finally {
      await accounts.admin.query(`UPDATE public.accounts SET status = 'active', website_domain = 'https://www.floridasecurityconcepts.com/' WHERE slug = 'fsc'`);
    }
  });

  it('refuses any slug other than fsc even for an active account', async () => {
    await expect(callRpc(accounts.service, 'fsc_receipt_create_draft', { ...receiptArgs({ source: digestFor('slug') }), p_slug: 'fpb' })).rejects.toThrow(/FSC_ACCOUNT_REFUSED/);
    await expect(callRpc(accounts.service, 'fsc_receipt_purge_draft', { p_slug: 'fpb' })).rejects.toThrow(/FSC_ACCOUNT_REFUSED/);
  });

  it.each(['floridasecurityconcepts.com', 'http://floridasecurityconcepts.com', 'HTTPS://WWW.FloridaSecurityConcepts.com/'])('accepts equivalent FSC domain form %s', async domain => {
    await accounts.admin.query(`UPDATE public.accounts SET website_domain = $1 WHERE slug = 'fsc'`, [domain]);
    try {
      expect((await callRpc(accounts.service, 'fsc_receipt_create_draft', receiptArgs({ source: digestFor(`domain-${domain}`) }))).code).toBe('READY');
    } finally {
      await accounts.admin.query(`UPDATE public.accounts SET website_domain = 'https://www.floridasecurityconcepts.com/' WHERE slug = 'fsc'`);
    }
  });

  it('purge and erase still work for an inactive account so deletion is never blocked', async () => {
    await accounts.admin.query(`UPDATE public.accounts SET status = 'inactive' WHERE slug = 'fsc'`);
    try {
      expect(await callRpc(accounts.service, 'fsc_receipt_erase_draft', { p_slug: 'fsc', p_request: existing.p_request })).toBe(true);
      expect(typeof await callRpc(accounts.service, 'fsc_receipt_purge_draft', { p_slug: 'fsc' })).toBe('number');
      const [row] = await rows(accounts.admin, `SELECT payload, purged_at IS NOT NULL AS purged FROM fsc_private.assessment_receipts WHERE request_id = $1`, [existing.p_request]);
      expect(row).toEqual({ payload: null, purged: true });
    } finally {
      await accounts.admin.query(`UPDATE public.accounts SET status = 'active' WHERE slug = 'fsc'`);
    }
  });
});
