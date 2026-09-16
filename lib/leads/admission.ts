// AM-004 — production-only abuse admission. Computes a private, non-reversible
// keyed digest of the trusted platform source address so the database RPC can
// enforce "20 new logical requests per source per rolling 10 minutes" without
// ever storing, logging or returning the raw address. See
// harness/ABUSE-AND-PRIVACY-PROPOSAL.md.
//
// AM-004a (safety review M-3): non-mapped IPv6 addresses are grouped by
// their /64 prefix (first 8 canonical bytes) before hashing, not the full
// /128 address — a single client commonly controls an entire /64, making
// per-/128 counting trivially bypassable. IPv4 and IPv4-mapped IPv6
// addresses (::ffff:a.b.c.d) are unaffected and remain full 4-byte
// addresses.
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { isHostedPreview } from './environment';

const NAMESPACE = Buffer.from('fsc-admission-v1\0', 'utf8');
const KEY_HEX_LENGTH = 64; // 32 bytes

function ipv4Bytes(address: string): Buffer | null {
  const parts = address.split('.');
  if (parts.length !== 4) return null;
  const bytes = parts.map(Number);
  if (bytes.some((b) => !Number.isInteger(b) || b < 0 || b > 255)) return null;
  return Buffer.from(bytes);
}

/** address is already confirmed by node:net.isIP to be a valid, zone-id-free IPv6 literal. */
function ipv6Bytes(address: string): Buffer | null {
  let text = address;
  const v4Tail = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(text);
  if (v4Tail) {
    const v4 = ipv4Bytes(v4Tail[1]);
    if (!v4) return null;
    const hi = ((v4[0] << 8) | v4[1]).toString(16);
    const lo = ((v4[2] << 8) | v4[3]).toString(16);
    text = `${text.slice(0, v4Tail.index)}${hi}:${lo}`;
  }
  const halves = text.split('::');
  if (halves.length > 2) return null;
  let groups: string[];
  if (halves.length === 1) {
    groups = text.split(':');
  } else {
    const head = halves[0] ? halves[0].split(':') : [];
    const tail = halves[1] ? halves[1].split(':') : [];
    const fill = 8 - head.length - tail.length;
    if (fill < 0) return null;
    groups = [...head, ...Array(fill).fill('0'), ...tail];
  }
  if (groups.length !== 8) return null;
  const out = Buffer.alloc(16);
  for (let i = 0; i < 8; i += 1) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(groups[i])) return null;
    out.writeUInt16BE(parseInt(groups[i], 16), i * 2);
  }
  return out;
}

/**
 * Canonicalizes to address bytes: IPv4 stays 4 bytes; ::ffff:a.b.c.d (any
 * textual IPv6 form) maps to the same plain IPv4 4 bytes; any other IPv6
 * address is truncated to its /64 prefix (first 8 bytes) per AM-004a.
 */
function canonicalAddressBytes(address: string): Buffer | null {
  if (address.includes('%')) return null; // no zone id
  const version = isIP(address);
  if (version === 4) return ipv4Bytes(address);
  if (version === 6) {
    const bytes = ipv6Bytes(address);
    if (!bytes) return null;
    const mapped = bytes.subarray(0, 10).every((b) => b === 0) && bytes[10] === 0xff && bytes[11] === 0xff;
    if (mapped) return Buffer.from(bytes.subarray(12, 16));
    return Buffer.from(bytes.subarray(0, 8)); // /64 prefix only (AM-004a)
  }
  return null;
}

function admissionKey(env: NodeJS.ProcessEnv): Buffer | null {
  const raw = env.FSC_ADMISSION_HMAC_KEY?.trim();
  if (!raw || raw.length !== KEY_HEX_LENGTH || !/^[0-9a-f]{64}$/i.test(raw)) return null;
  return Buffer.from(raw, 'hex');
}

/**
 * Returns a lowercase hex HMAC-SHA-256 digest of the trusted platform source
 * address, or null when the request/environment cannot support admission
 * (non-production, hosted preview, missing/malformed header, missing/bad
 * key). Non-mapped IPv6 addresses are grouped by /64 (AM-004a) before
 * hashing. The raw address is never logged, stored or returned by this
 * function — only its keyed digest.
 */
export function trustedSourceDigest(headers: Headers, env: NodeJS.ProcessEnv = process.env): string | null {
  if (!env.VERCEL || env.VERCEL_ENV !== 'production' || isHostedPreview(env)) return null;
  const key = admissionKey(env);
  if (!key) return null;
  const header = headers.get('x-vercel-forwarded-for');
  if (!header || header.includes(',')) return null;
  const address = header.trim();
  if (!address) return null;
  const bytes = canonicalAddressBytes(address);
  if (!bytes) return null;
  return createHmac('sha256', key).update(NAMESPACE).update(bytes).digest('hex');
}
