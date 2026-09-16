// Test-owned process for the known-failure local-preview variant (FSC_LOCAL_FAILURE=1).
//
// Why this exists: scripts/local-server.mjs --compiled always runs `next build` into the shared
// local-preview distDir (.fsc-local/build). Starting a second launcher for the failure variant would
// rebuild that directory underneath the already-running local-preview server and corrupt it.
// FSC_LOCAL_FAILURE is read at request time (lib/leads/leadDelivery.ts), so this process serves the
// build the launcher has just produced, read-only, with the launcher's local-preview isolation
// environment. The release global setup starts it only after the launcher server is ready.
import { createRequire } from 'node:module';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
for (const marker of ['VERCEL', 'VERCEL_ENV', 'VERCEL_TARGET_ENV', 'NETLIFY', 'RENDER', 'AWS_LAMBDA_FUNCTION_NAME']) {
  if (process.env[marker]) throw new Error('Release failure server refuses a hosted environment');
}
const port = process.env.FSC_TEST_PORT || '';
if (!/^\d+$/.test(port) || Number(port) < 1024 || Number(port) > 65535 || port === '3100') throw new Error('Invalid release failure-server port');
if (!existsSync(path.join(root, '.fsc-local/build/BUILD_ID'))) throw new Error('Local preview build is missing; start the launcher preview server first');
const logPath = process.env.FSC_SERVER_LOG || path.join(root, '.fsc-test/release/local-failure-server.log');
mkdirSync(path.dirname(logPath), { recursive: true });
const log = createWriteStream(logPath, { flags: 'w' });
const essentials = /^(PATH|SYSTEMROOT|SYSTEMDRIVE|WINDIR|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA|PATHEXT|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE)$/i;
const env = {};
for (const [key, value] of Object.entries(process.env)) if (essentials.test(key)) env[key] = value;
const guard = path.join(root, 'scripts/network-guard.cjs').replaceAll('\\', '/');
Object.assign(env, {
  NODE_ENV: 'production', CI: 'true', NEXT_TELEMETRY_DISABLED: '1',
  FSC_LOCAL_PREVIEW: '1', LEAD_DELIVERY_MODE: 'local', FSC_LOCAL_FAILURE: '1', NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL: '',
  LEAD_CONFIRMATION_ENABLED: 'false', FSC_ALLOW_FONT_NETWORK: '0', NODE_OPTIONS: `--require="${guard}"`,
});
if (process.env.FSC_NETWORK_VIOLATION) env.FSC_NETWORK_VIOLATION = process.env.FSC_NETWORK_VIOLATION;
for (const key of ['RESEND_API_KEY', 'LEAD_NOTIFICATION_TO', 'LEAD_NOTIFICATION_FROM', 'LEAD_CONFIRMATION_FROM', 'LEAD_CONFIRMATION_REPLY_TO', 'LEADS_WEBHOOK_URL', 'LEADS_WEBHOOK_SECRET', 'PRIME_SUPABASE_URL', 'PRIME_SUPABASE_SERVICE_ROLE_KEY', 'PRIME_ACCOUNT_SLUG']) env[key] = '';
for (const key of Object.keys(process.env)) delete process.env[key];
Object.assign(process.env, env);
for (const stream of [process.stdout, process.stderr]) {
  const write = stream.write.bind(stream);
  stream.write = (chunk, ...args) => { log.write(chunk); return write(chunk, ...args); };
}
const require = createRequire(import.meta.url);
require(path.join(root, 'scripts/network-guard.cjs'));
const { startServer } = require(path.join(root, 'node_modules/next/dist/server/lib/start-server'));
await startServer({ dir: root, isDev: false, hostname: '127.0.0.1', port: Number(port), allowRetry: false });
