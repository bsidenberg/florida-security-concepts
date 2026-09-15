import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * The exact hosted Plausible site script published for www.floridasecurityconcepts.com, saved read-only by the
 * orchestrator (S-006 privacy review M-1 follow-up). It is served byte-for-byte at the synthetic pa- URL; the only
 * test-environment differences are injected before the application runs (see guard.ts liveInitScript):
 * captureOnLocalhost (loopback host), window.__plausible (Playwright sets navigator.webdriver) and the transport
 * endpoint (loopback collector; the endpoint the application declared is recorded and asserted).
 */
export const LIVE_TRACKER = {
  path: '.fsc-test/plausible/pa-live-699a3759.js',
  sha256: '699a37594f53cf5fd1026e3e442d29119c6901cfd3a696dd5cec20d7cc52a8a4',
  bytes: 6040,
};

export function liveTrackerBytes(): Buffer {
  const file = resolve(LIVE_TRACKER.path);
  if (!existsSync(file)) throw new Error(`Missing saved hosted Plausible script ${LIVE_TRACKER.path} (SHA-256 ${LIVE_TRACKER.sha256}); the release analytics suite cannot verify the published loader without it`);
  const bytes = readFileSync(file);
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== LIVE_TRACKER.sha256 || bytes.length !== LIVE_TRACKER.bytes) throw new Error(`Saved hosted Plausible script changed: SHA-256 ${digest} (${bytes.length} bytes), expected ${LIVE_TRACKER.sha256} (${LIVE_TRACKER.bytes} bytes)`);
  return bytes;
}
