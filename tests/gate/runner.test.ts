import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, copyFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync, spawn } from 'node:child_process';

const runner = resolve('scripts/verify.ps1');
const checks = ['lint', 'typecheck', 'test:unit', 'test:gate', 'build', 'test:e2e'];
type ReleaseOptions = { omit?: boolean; format?: 'playwright' | 'vitest'; report?: 'ok' | 'zero' | 'skipped' | 'flaky' | 'unexpected' | 'errors' | 'vitest' };
function fixture(options: { missing?: string; zero?: boolean; fail?: boolean; malformed?: boolean; skip?: boolean; noReport?: boolean; release?: ReleaseOptions } = {}) {
  mkdirSync('.fsc-test/fixtures', { recursive: true });
  const root = mkdtempSync(resolve('.fsc-test/fixtures/gate-'));
  mkdirSync(join(root, 'harness'), { recursive: true });
  mkdirSync(join(root, 'scripts'));
  copyFileSync(resolve('scripts/network-guard.cjs'), join(root, 'scripts/network-guard.cjs'));
  const release = options.release;
  const scripts = Object.fromEntries([...checks, ...(release && !release.omit ? ['test:release'] : [])].filter(c => c !== options.missing).map(c => [c, 'node child.cjs']));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ scripts }));
  const definitions: Record<string, unknown> = Object.fromEntries(checks.map(c => [c, {
    script: c, args: ['child.cjs', c],
    ...(c.startsWith('test:') ? { report: c === 'test:e2e' ? 'playwright' : 'vitest', reportEnv: c === 'test:e2e' ? 'FSC_E2E_REPORT' : c === 'test:gate' ? 'FSC_GATE_REPORT' : 'FSC_UNIT_REPORT' } : {}),
  }]));
  if (release && !release.omit) definitions['test:release'] = { script: 'test:release', args: ['child.cjs', 'test:release'], report: release.format || 'playwright', reportEnv: 'FSC_RELEASE_REPORT' };
  const sessions = { 'S-001': checks, ...(release ? { 'S-006': release.omit ? checks : [...checks, 'test:release'] } : {}) };
  writeFileSync(join(root, 'harness/verification.json'), options.malformed ? '{' : JSON.stringify({ sessions, checks: definitions, buildArtifact: '.next/BUILD_ID' }));
  const releaseReports: Record<string, unknown> = {
    ok: { stats: { expected: 3, unexpected: 0, skipped: 0, flaky: 0 }, errors: [] },
    zero: { stats: { expected: 0, unexpected: 0, skipped: 0, flaky: 0 }, errors: [] },
    skipped: { stats: { expected: 2, unexpected: 0, skipped: 1, flaky: 0 }, errors: [] },
    flaky: { stats: { expected: 2, unexpected: 0, skipped: 0, flaky: 1 }, errors: [] },
    unexpected: { stats: { expected: 2, unexpected: 1, skipped: 0, flaky: 0 }, errors: [] },
    errors: { stats: { expected: 3, unexpected: 0, skipped: 0, flaky: 0 }, errors: [{ message: 'Error in global setup' }] },
    vitest: { numTotalTests: 3, numPassedTests: 3, numFailedTests: 0, numPendingTests: 0, numTodoTests: 0, success: true },
  };
  writeFileSync(join(root, 'child.cjs'), `
const fs=require('node:fs'),path=require('node:path');
console.log('fixture stdout');console.error('fixture stderr');
const check=process.argv[2];
if(check==='build'){fs.mkdirSync('.next',{recursive:true});fs.writeFileSync('.next/BUILD_ID','fixture');}
for(const key of ['FSC_UNIT_REPORT','FSC_GATE_REPORT','FSC_E2E_REPORT']) if(process.env[key] && ${!options.noReport}) {
fs.mkdirSync(path.dirname(process.env[key]),{recursive:true});
fs.writeFileSync(process.env[key],JSON.stringify(key==='FSC_E2E_REPORT'?{stats:{expected:${options.zero ? 0 : 1},unexpected:0,skipped:0,flaky:0},errors:[]}:{numTotalTests:${options.zero ? 0 : 1},numPassedTests:${options.zero ? 0 : 1},numFailedTests:0,numPendingTests:${options.skip ? 1 : 0},numTodoTests:0,success:true}));}
if(check==='test:release' && process.env.FSC_RELEASE_REPORT){fs.mkdirSync(path.dirname(process.env.FSC_RELEASE_REPORT),{recursive:true});fs.writeFileSync(process.env.FSC_RELEASE_REPORT,${JSON.stringify(JSON.stringify(releaseReports[release?.report || 'ok']))});}
process.exit(${options.fail ? 7 : 0});
`);
  return root;
}
function run(root: string, session = 'S-001') {
  const output = spawnSync('pwsh', ['-NoProfile', '-File', runner, '-SessionId', session, '-ProjectRoot', root], { encoding: 'utf8', timeout: 45000 });
  expect(output.error, 'PowerShell gate must run as a real child process').toBeUndefined();
  return output;
}
describe('verification gate failure honesty', () => {
  it('rejects unknown session', () => expect(run(fixture(), 'S-999').status).not.toBe(0));
  it('rejects a missing package script', () => expect(run(fixture({ missing: 'test:unit' })).status).not.toBe(0));
  it('rejects empty passing report', () => expect(run(fixture({ zero: true })).status).not.toBe(0));
  it('rejects skipped tests', () => expect(run(fixture({ skip: true })).status).not.toBe(0));
  it('rejects missing reports', () => expect(run(fixture({ noReport: true })).status).not.toBe(0));
  it('propagates child failure', () => expect(run(fixture({ fail: true })).status).not.toBe(0));
  it('malformed manifest fails with visible diagnostic', () => {
    const result = run(fixture({ malformed: true }));
    expect(result.status).not.toBe(0); expect(result.stdout + result.stderr).toMatch(/json|manifest|parse|invalid/i);
  });
  it('runs valid checks and preserves both streams in unique raw logs', () => {
    const root = fixture();
    const first = run(root); expect(first.status, first.stdout + first.stderr).toBe(0);
    const second = run(root); expect(second.status, second.stdout + second.stderr).toBe(0);
    const logs = readdirSync(join(root, 'harness/evidence')).filter(s => s.endsWith('.log'));
    expect(logs).toHaveLength(2);
    for (const log of logs) {
      const text = readFileSync(join(root, 'harness/evidence', log), 'utf8');
      expect(text).toContain('fixture stdout'); expect(text).toContain('fixture stderr');
    }
  });
  describe('S-006 release report contract', () => {
    const output = (result: ReturnType<typeof run>) => result.stdout + result.stderr;
    it('S-006 fails when the manifest omits test:release', () => {
      const result = run(fixture({ release: { omit: true } }), 'S-006');
      expect(result.status).not.toBe(0);
      expect(output(result)).toContain('Missing required check: test:release');
    });
    it('S-006 passes with a Playwright-format test:release report (control for the rejections below)', () => {
      const result = run(fixture({ release: { report: 'ok' } }), 'S-006');
      expect(result.status, output(result)).toBe(0);
      expect(output(result)).toMatch(/TEST COUNTS test:release passed=3 rejected=0/);
    });
    it('rejects test:release registered with the vitest report contract even when the vitest report is green', () => {
      const result = run(fixture({ release: { format: 'vitest', report: 'vitest' } }), 'S-006');
      expect(result.status).not.toBe(0);
      expect(output(result)).toContain('Missing required report contract: test:release');
    });
    it('rejects a vitest-format report file produced for a playwright-contract test:release', () => {
      const result = run(fixture({ release: { report: 'vitest' } }), 'S-006');
      expect(result.status).not.toBe(0);
      expect(output(result)).toContain('Missing, zero, failed or skipped tests: test:release');
    });
    for (const report of ['zero', 'skipped', 'flaky', 'unexpected', 'errors'] as const) {
      it(`rejects a Playwright release report with ${report} results`, () => {
        const result = run(fixture({ release: { report } }), 'S-006');
        expect(result.status).not.toBe(0);
        expect(output(result)).toContain('Missing, zero, failed or skipped tests: test:release');
      });
    }
  });
  it('timeout stops only its owned process tree', async () => {
    const root = fixture();
    writeFileSync(join(root, 'child.cjs'), `const fs=require('node:fs');fs.writeFileSync('owned.pid',String(process.pid));setInterval(()=>{},1000);`);
    const unrelated = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { windowsHide: true, stdio: 'ignore' });
    try {
      const result = spawnSync('pwsh', ['-NoProfile', '-File', runner, '-SessionId', 'S-001', '-ProjectRoot', root, '-CheckTimeoutSeconds', '1'], { encoding: 'utf8', timeout: 15000 });
      expect(result.status).not.toBe(0);
      const owned = Number(readFileSync(join(root, 'owned.pid'), 'utf8'));
      expect(() => process.kill(owned, 0)).toThrow();
      expect(() => process.kill(unrelated.pid!, 0)).not.toThrow();
    } finally { unrelated.kill(); }
  });
});
