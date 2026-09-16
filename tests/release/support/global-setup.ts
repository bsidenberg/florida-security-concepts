import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createServer, createConnection, type Server } from 'node:net';
import { createServer as createHttpServer, type Server as HttpServer } from 'node:http';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { COLLECTOR_ENV, EVIDENCE_ENV, ORIGINS, PORTS, RUN_ID_ENV, SINKHOLE_ENV } from './constants';
import { deriveReleaseRun } from './evidence';

type Owned = { name: string; child: ChildProcess };
const owned: Owned[] = [];

function portOccupied(port: number): Promise<boolean> {
  return new Promise(done => {
    const socket = createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(1000);
    socket.once('connect', () => { socket.destroy(); done(true); });
    socket.once('timeout', () => { socket.destroy(); done(true); });
    socket.once('error', () => { socket.destroy(); done(false); });
  });
}

async function stopOwned(entry: Owned) {
  const { child } = entry;
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) return;
  const ended = new Promise<void>(r => child.once('exit', () => r()));
  // Stop only the process tree this setup started (the launcher may still own a `next build` child).
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
  else child.kill();
  await Promise.race([ended, delay(15000)]);
}

async function waitReady(entry: Owned, url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (entry.child.exitCode !== null) throw new Error(`Release server "${entry.name}" exited (code ${entry.child.exitCode}) before readiness; see .fsc-test/release/${entry.name}-server.log`);
    try { const response = await fetch(url, { signal: AbortSignal.timeout(2000) }); if (response.ok) return; } catch { /* readiness retry */ }
    await delay(500);
  }
  throw new Error(`Release server "${entry.name}" readiness timeout at ${url}`);
}

function start(name: string, args: string[], port: number, extraEnv: Record<string, string> = {}): Owned {
  const log = resolve(`.fsc-test/release/${name}-server.log`);
  const child = spawn(process.execPath, args, {
    shell: false, windowsHide: true, stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, FSC_TEST_PORT: String(port), FSC_SERVER_LOG: log, FSC_LOCAL_FAILURE: '', ...extraEnv },
  });
  const entry = { name, child };
  owned.push(entry);
  return entry;
}

async function html(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  return { status: response.status, text: await response.text() };
}

/** Next deletes its distDir at the start of a build; a later build into the same directory makes an earlier server's chunks 404. */
export async function staticChunksIntact(base: string): Promise<string[]> {
  const page = await html(`${base}/`);
  const chunks = [...page.text.matchAll(/\/_next\/static\/[^"'\s)]+\.js/g)].map(m => m[0]);
  const broken: string[] = [];
  if (chunks.length === 0) broken.push(`${base}: no static chunks referenced`);
  for (const chunk of [...new Set(chunks)].slice(0, 6)) {
    const response = await fetch(base + chunk, { signal: AbortSignal.timeout(10000) });
    if (response.status !== 200) broken.push(`${base}${chunk} -> ${response.status}`);
  }
  return broken;
}

function startSinkhole(logPath: string): Promise<Server> {
  const server = createServer(socket => {
    socket.once('data', chunk => {
      const line = chunk.toString('latin1').split('\r\n')[0].slice(0, 300);
      appendFileSync(logPath, JSON.stringify({ at: new Date().toISOString(), request: line }) + '\n');
      socket.destroy();
    });
    socket.on('error', () => undefined);
    socket.setTimeout(5000, () => socket.destroy());
  });
  return new Promise((done, fail) => { server.once('error', fail); server.listen(PORTS.sinkhole, '127.0.0.1', () => done(server)); });
}

/**
 * Loopback analytics collector. The test tracker adapter sends every payload here (see tracker-adapter.ts): Chromium
 * delivers keepalive POSTs issued during document unload outside Playwright route interception, so a browser-side
 * route cannot observe (or contain) every event. Each line records the per-test token, the requested failure mode,
 * the endpoint the application itself declared, and the raw body. mode=fail drops the connection without a response.
 */
function startCollector(logPath: string): Promise<HttpServer> {
  const server = createHttpServer((request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST' }); response.end(); return; }
    if (request.method !== 'POST' || url.pathname !== '/api/event') { response.writeHead(404); response.end(); return; }
    const chunks: Buffer[] = [];
    let size = 0;
    request.on('data', (chunk: Buffer) => { size += chunk.length; if (size <= 65536) chunks.push(chunk); });
    request.on('end', () => {
      const mode = url.searchParams.get('m') === 'fail' ? 'fail' : 'accept';
      appendFileSync(logPath, JSON.stringify({ at: Date.now(), token: url.searchParams.get('t') || '', mode, declared: url.searchParams.get('declared') ?? '', seq: url.searchParams.get('seq') ?? '', contentType: request.headers['content-type'] || '', raw: Buffer.concat(chunks).toString('utf8'), truncated: size > 65536 }) + '\n');
      if (mode === 'fail') { request.socket.destroy(); return; }
      response.writeHead(202, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
      response.end('ok');
    });
  });
  return new Promise((done, fail) => { server.once('error', fail); server.listen(PORTS.collector, '127.0.0.1', () => done(server)); });
}

export default async function globalSetup() {
  const run = deriveReleaseRun();
  const ports = Object.values(PORTS);
  if (ports.includes(3100 as never) || new Set(ports).size !== ports.length) throw new Error('Release ports must be distinct and must not use the e2e port 3100');
  for (const port of ports) if (await portOccupied(port)) throw new Error(`Release port ${port} is already occupied; refusing to reuse or stop an unrelated process`);

  mkdirSync(resolve('.fsc-test/release'), { recursive: true });
  mkdirSync(resolve(run.dir, '..'), { recursive: true });
  mkdirSync(run.dir); // Throws EEXIST: never overwrite a prior run's evidence.
  const sinkLog = join(run.dir, 'sinkhole-connections.jsonl');
  writeFileSync(sinkLog, '');
  process.env[EVIDENCE_ENV] = run.dir;
  process.env[RUN_ID_ENV] = run.runId;
  process.env[SINKHOLE_ENV] = sinkLog;
  const sinkhole = await startSinkhole(sinkLog);
  const collectorLog = join(run.dir, 'analytics-payloads.jsonl');
  writeFileSync(collectorLog, '');
  process.env[COLLECTOR_ENV] = collectorLog;
  const collector = await startCollector(collectorLog);

  const teardown = async () => {
    for (const entry of [...owned].reverse()) await stopOwned(entry);
    await new Promise<void>(r => sinkhole.close(() => r()));
    collector.closeAllConnections();
    await new Promise<void>(r => collector.close(() => r()));
  };
  try {
    const launcher = resolve('scripts/local-server.mjs');
    // Measurement builds first and one at a time: each launcher builds before it listens.
    const measure = start('measure', [launcher, '--compiled', '--measure'], PORTS.measure);
    await waitReady(measure, `${ORIGINS.measure}/`, 300000);
    const measureHome = await html(`${ORIGINS.measure}/`);
    if (measureHome.text.includes('fsc-preview-notice') || measureHome.text.includes('pa-fsc-release-fixture')) {
      throw new Error('Server started with --compiled --measure is not a production-equivalent measurement build (local preview notice or analytics fixture present)');
    }
    const analytics = start('analytics', [launcher, '--compiled', '--measure', '--analytics-fixture'], PORTS.analytics);
    await waitReady(analytics, `${ORIGINS.analytics}/`, 300000);
    const analyticsHome = await html(`${ORIGINS.analytics}/`);
    if (!analyticsHome.text.includes('pa-fsc-release-fixture.js') || analyticsHome.text.includes('fsc-preview-notice')) {
      throw new Error('Server started with --measure --analytics-fixture does not reference the synthetic analytics script URL');
    }
    const local = start('local', [launcher, '--compiled'], PORTS.local);
    await waitReady(local, `${ORIGINS.local}/`, 300000);
    if (!(await html(`${ORIGINS.local}/`)).text.includes('fsc-preview-notice')) throw new Error('Launcher --compiled server is not in local preview mode');
    const failure = start('local-failure', [resolve('tests/release/support/prebuilt-local-failure-server.mjs')], PORTS.localFailure);
    await waitReady(failure, `${ORIGINS.localFailure}/`, 120000);
    for (const base of Object.values(ORIGINS)) {
      const broken = await staticChunksIntact(base);
      if (broken.length) throw new Error(`A later build corrupted an earlier release server (shared distDir?): ${broken.join('; ')}`);
    }
  } catch (error) {
    await teardown();
    throw error;
  }
  return teardown;
}
