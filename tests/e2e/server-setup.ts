import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
export default async function setup() {
  const url = `http://127.0.0.1:${process.env.FSC_TEST_PORT || 3100}`;
  try { await fetch(url, { signal: AbortSignal.timeout(1000) }); throw new Error('Test port already occupied; refusing to reuse or stop unrelated server'); }
  catch (error) { if (error instanceof Error && error.message.startsWith('Test port')) throw error; }
  const child = spawn(process.execPath, [resolve('scripts/local-server.mjs'), '--compiled'], { shell: false, windowsHide: true, stdio: 'inherit' });
  const stop = async () => {
    if (child.exitCode === null && !child.killed) {
      const ended = new Promise<void>(r => child.once('exit', () => r()));
      child.kill(); await ended;
    }
  };
  try {
    const deadline = Date.now() + 180000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error('Isolated server exited before readiness');
      try { const response = await fetch(url, { signal: AbortSignal.timeout(1000) }); if (response.ok) return stop; } catch { /* readiness retry */ }
      await delay(250);
    }
    throw new Error('Isolated server readiness timeout');
  } catch (error) { await stop(); throw error; }
}
