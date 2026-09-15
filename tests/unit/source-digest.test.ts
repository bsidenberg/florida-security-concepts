// AM-004 / AM-004a trusted source digest (lib/leads/admission.ts). Expected
// digests are computed independently here from the contract:
// lowercase hex HMAC-SHA-256(key, "fsc-admission-v1\0" + canonical bytes), where
// canonical bytes are the 4 IPv4 bytes (also for ::ffff:a.b.c.d) or the first 8
// bytes (/64 prefix) of an IPv6 address.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { trustedSourceDigest } from '../../lib/leads/admission';

const KEY = '0f1e2d3c4b5a69788796a5b4c3d2e1f00112233445566778899aabbccddeeff0';
const asEnv = (values: Record<string, string | undefined>) => values as unknown as NodeJS.ProcessEnv;
const PROD = asEnv({ VERCEL: '1', VERCEL_ENV: 'production', FSC_ADMISSION_HMAC_KEY: KEY });
const reference = (bytes: number[], key = KEY) => createHmac('sha256', Buffer.from(key, 'hex')).update(Buffer.concat([Buffer.from('fsc-admission-v1\0', 'utf8'), Buffer.from(bytes)])).digest('hex');
const digest = (value: string, env: NodeJS.ProcessEnv = PROD) => trustedSourceDigest(new Headers({ 'x-vercel-forwarded-for': value }), env);

afterEach(() => { vi.restoreAllMocks(); });

describe('production-only activation', () => {
  it.each([
    ['local (no Vercel variables)', {}],
    ['VERCEL without VERCEL_ENV', { VERCEL: '1' }],
    ['VERCEL_ENV=production without VERCEL', { VERCEL_ENV: 'production' }],
    ['preview deployment', { VERCEL: '1', VERCEL_ENV: 'preview' }],
    ['development deployment', { VERCEL: '1', VERCEL_ENV: 'development' }],
    ['production env targeting preview', { VERCEL: '1', VERCEL_ENV: 'production', VERCEL_TARGET_ENV: 'preview' }],
  ])('returns null for %s even with a valid key and header', (_label, env) => {
    expect(digest('203.0.113.9', asEnv({ ...env, FSC_ADMISSION_HMAC_KEY: KEY }))).toBeNull();
    expect(digest('203.0.113.9')).toBe(reference([203, 0, 113, 9]));
  });

  it('accepts VERCEL_TARGET_ENV=production alongside production', () => {
    expect(digest('203.0.113.9', { ...PROD, VERCEL_TARGET_ENV: 'production' })).toBe(reference([203, 0, 113, 9]));
  });
});

describe('address canonicalization', () => {
  it('IPv4 digest is the HMAC over the 4 address bytes, lowercase 64-hex and stable', () => {
    const value = digest('198.51.100.200');
    expect(value).toBe(reference([198, 51, 100, 200]));
    expect(value).toMatch(/^[0-9a-f]{64}$/);
    expect(digest('198.51.100.200')).toBe(value);
    expect(digest('198.51.100.201')).not.toBe(value);
  });

  it.each(['::ffff:203.0.113.9', '::FFFF:203.0.113.9', '0:0:0:0:0:ffff:203.0.113.9', '::ffff:cb00:7109'])('IPv4-mapped form %s equals the plain IPv4 digest', mapped => {
    expect(digest(mapped)).toBe(reference([203, 0, 113, 9]));
  });

  it('IPv6 digest is the HMAC over the /64 prefix (first 8 bytes)', () => {
    expect(digest('2001:db8:1234:5678:abcd:ef01:2345:6789')).toBe(reference([0x20, 0x01, 0x0d, 0xb8, 0x12, 0x34, 0x56, 0x78]));
  });

  it.each(['2001:db8:1234:5678::1', '2001:0DB8:1234:5678:ffff:ffff:ffff:fffe', '2001:db8:1234:5678:0:0:0:0', '2001:db8:1234:5678::203.0.113.9'])('addresses in the same /64 share one digest (%s)', address => {
    expect(digest(address)).toBe(digest('2001:db8:1234:5678:abcd:ef01:2345:6789'));
  });

  it('different /64 prefixes produce different digests, and IPv6 never collides with an IPv4 digest', () => {
    const base = digest('2001:db8:1234:5678::1');
    expect(digest('2001:db8:1234:5679::1')).not.toBe(base);
    expect(digest('2001:db9:1234:5678::1')).not.toBe(base);
    expect(digest('::1')).toBe(reference([0, 0, 0, 0, 0, 0, 0, 0]));
    expect(digest('::203.0.113.9')).not.toBe(reference([203, 0, 113, 9]));
  });

  it('the raw address never appears in the output and nothing is logged', () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(method => vi.spyOn(console, method).mockImplementation(() => undefined));
    const values = ['203.0.113.9', '2001:db8::1', 'garbage', '203.0.113.9, 198.51.100.1'].map(value => digest(value));
    expect(values[0]).not.toContain('203.0.113.9');
    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});

describe('header rejection', () => {
  it.each([
    ['comma list', '203.0.113.9, 198.51.100.1'],
    ['trailing comma', '203.0.113.9,'],
    ['zone id', 'fe80::1%eth0'],
    ['encoded zone id', 'fe80::1%25eth0'],
    ['octet out of range', '203.0.113.256'],
    ['three octets', '203.0.113'],
    ['five octets', '1.2.3.4.5'],
    ['bracketed IPv6', '[2001:db8::1]'],
    ['CIDR suffix', '2001:db8::1/64'],
    ['address with port', '203.0.113.9:443'],
    ['hostname', 'localhost'],
    ['garbage', 'not-an-address'],
    ['empty', ''],
    ['whitespace only', '   '],
  ])('rejects %s', (_label, value) => {
    expect(digest(value)).toBeNull();
  });

  it('rejects multiple header values', () => {
    const headers = new Headers();
    headers.append('x-vercel-forwarded-for', '203.0.113.9');
    headers.append('x-vercel-forwarded-for', '198.51.100.1');
    expect(trustedSourceDigest(headers, PROD)).toBeNull();
  });

  it('ignores spoofable x-forwarded-for and x-real-ip entirely', () => {
    expect(trustedSourceDigest(new Headers({ 'x-forwarded-for': '203.0.113.9', 'x-real-ip': '203.0.113.9' }), PROD)).toBeNull();
    expect(trustedSourceDigest(new Headers(), PROD)).toBeNull();
    const withSpoof = trustedSourceDigest(new Headers({ 'x-vercel-forwarded-for': '198.51.100.7', 'x-forwarded-for': '203.0.113.9', 'x-real-ip': '192.0.2.1' }), PROD);
    expect(withSpoof).toBe(reference([198, 51, 100, 7]));
  });
});

describe('HMAC key validation', () => {
  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['62 hex characters', 'ab'.repeat(31)],
    ['65 hex characters', `${'ab'.repeat(32)}a`],
    ['non-hex characters', 'zz'.repeat(32)],
    ['base64 of 32 bytes', Buffer.alloc(32, 7).toString('base64')],
  ])('%s key yields null', (_label, key) => {
    expect(digest('203.0.113.9', { ...PROD, FSC_ADMISSION_HMAC_KEY: key })).toBeNull();
  });

  it('uses the decoded 32-byte key: uppercase hex is the same key, a different key gives a different digest', () => {
    expect(digest('203.0.113.9', { ...PROD, FSC_ADMISSION_HMAC_KEY: KEY.toUpperCase() })).toBe(reference([203, 0, 113, 9]));
    const other = 'ab'.repeat(32);
    expect(digest('203.0.113.9', { ...PROD, FSC_ADMISSION_HMAC_KEY: other })).toBe(reference([203, 0, 113, 9], other));
    expect(reference([203, 0, 113, 9], other)).not.toBe(reference([203, 0, 113, 9]));
  });
});
