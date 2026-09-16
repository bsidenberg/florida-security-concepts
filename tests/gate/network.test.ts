import { it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
it('blocks forbidden server fetch before connection and records categorical evidence', () => {
  mkdirSync('.fsc-test/fixtures', { recursive: true });
  const marker = resolve(mkdtempSync(resolve('.fsc-test/fixtures/network-')), 'violations.log');
  const result = spawnSync(process.execPath, ['--require', resolve('scripts/network-guard.cjs'), '-e', "try{fetch('https://example.invalid/no-network');process.exitCode=9}catch(e){console.log(e.message)}"], {
    encoding: 'utf8', env: { ...process.env, FSC_NETWORK_VIOLATION: marker, FSC_ALLOW_FONT_NETWORK: '0' },
  });
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('FSC_NETWORK_BLOCKED');
  expect(readFileSync(marker, 'utf8')).not.toContain('example.invalid');
});
