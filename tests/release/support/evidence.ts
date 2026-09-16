import { basename, dirname, join, resolve } from 'node:path';
import { EVIDENCE_ENV, RUN_ID_ENV } from './constants';

export type ReleaseRun = { session: string; runId: string; gate: boolean; dir: string };

/**
 * Derive the evidence folder from FSC_RELEASE_REPORT. verify.ps1 names the report
 * `<session>-test-release-<runId>.json` inside harness/evidence, so the folder is
 * `<session>-release-<runId>` next to it. Outside the gate (FSC_RELEASE_REPORT unset) evidence goes to the ignored
 * .fsc-test/release/ folder under an explicit ad-hoc timestamp, never into harness/evidence.
 * A report path that does not follow the gate's naming is a configuration error, never silently renamed.
 */
export function deriveReleaseRun(env: NodeJS.ProcessEnv = process.env, now = new Date()): ReleaseRun {
  const report = env.FSC_RELEASE_REPORT;
  if (report) {
    const match = /^(S-[A-Za-z0-9_-]+?)-test-release-([A-Za-z0-9_-]+)\.json$/.exec(basename(report));
    if (!match) throw new Error(`FSC_RELEASE_REPORT must be named <session>-test-release-<runId>.json; got "${basename(report)}"`);
    return { session: match[1], runId: match[2], gate: true, dir: join(dirname(resolve(report)), `${match[1]}-release-${match[2]}`) };
  }
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  return { session: 'S-006', runId: `adhoc-${stamp}`, gate: false, dir: resolve('.fsc-test/release', `S-006-release-adhoc-${stamp}`) };
}

export function currentEvidenceDir(): string {
  const dir = process.env[EVIDENCE_ENV];
  if (!dir) throw new Error(`${EVIDENCE_ENV} is not set; the release global setup did not run`);
  return dir;
}
export function currentRunId(): string {
  const id = process.env[RUN_ID_ENV];
  if (!id) throw new Error(`${RUN_ID_ENV} is not set; the release global setup did not run`);
  return id;
}
