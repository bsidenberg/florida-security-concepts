import { createRequire } from 'node:module';
import { createWriteStream, mkdirSync } from 'node:fs';
import path from 'node:path';
const root = process.cwd();
for (const marker of ['VERCEL','VERCEL_ENV','VERCEL_TARGET_ENV','NETLIFY','RENDER','AWS_LAMBDA_FUNCTION_NAME']) {
  if (process.env[marker]) throw new Error('Local launcher refuses a hosted environment');
}
const logPath = process.env.FSC_SERVER_LOG || path.join(root, '.fsc-test/server.log');
mkdirSync(path.dirname(logPath), { recursive: true });
const log = createWriteStream(logPath, { flags: 'w' });
const env = {};
const essentials = /^(PATH|SYSTEMROOT|WINDIR|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA|PATHEXT|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE|PLAYWRIGHT_BROWSERS_PATH)$/i;
for (const [key, value] of Object.entries(process.env)) if (essentials.test(key)) env[key] = value;
Object.assign(env, {
  NODE_ENV: 'development', CI: 'true', NEXT_TELEMETRY_DISABLED: '1',
  LEAD_DELIVERY_MODE: 'console', NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL: '',
  // next dev compiles next/font on demand; this is the same exact-host build allowance.
  LEAD_CONFIRMATION_ENABLED: 'false', FSC_ALLOW_FONT_NETWORK: '1',
  NODE_OPTIONS: `--require="${path.join(root, 'scripts/network-guard.cjs').replaceAll('\\', '/')}"`,
});
if (process.env.FSC_NETWORK_VIOLATION) env.FSC_NETWORK_VIOLATION = process.env.FSC_NETWORK_VIOLATION;
for (const key of ['RESEND_API_KEY','LEAD_NOTIFICATION_TO','LEAD_NOTIFICATION_FROM','LEAD_CONFIRMATION_FROM','LEAD_CONFIRMATION_REPLY_TO','LEADS_WEBHOOK_URL','LEADS_WEBHOOK_SECRET','PRIME_SUPABASE_URL','PRIME_SUPABASE_SERVICE_ROLE_KEY','PRIME_ACCOUNT_SLUG']) env[key] = '';
const port = process.env.FSC_TEST_PORT || '3100';
if (!/^\d+$/.test(port) || Number(port) < 1024 || Number(port) > 65535) throw new Error('Invalid local port');
for (const key of Object.keys(process.env)) delete process.env[key];
Object.assign(process.env, env);
for (const stream of [process.stdout, process.stderr]) {
  const write = stream.write.bind(stream);
  stream.write = (chunk, ...args) => { log.write(chunk); return write(chunk, ...args); };
}
// Run in the owned launcher process; no shell or detached Next CLI child.
const require = createRequire(import.meta.url);
require('./network-guard.cjs');
const { startServer } = require('next/dist/server/lib/start-server');
await startServer({ dir: root, isDev: true, hostname: '127.0.0.1', port: Number(port), allowRetry: false });
