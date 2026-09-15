import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

/**
 * Browser-ready fixture for the synthetic pa-*.js URL, built from the pinned official tracker.
 *
 * @plausible-analytics/tracker ships a single ES module (plausible.js, `export { init, track, ... }`);
 * it has no classic-script build. The hosted pa-*.js script is the same tracker core behind a loader
 * that reads the snippet's `plausible.o` (options passed to plausible.init) and replays `plausible.q`.
 * This adapter keeps the official core verbatim, removes only its trailing export statement, and adds
 * that loader contract. Two test-environment differences are neutralised and documented, not hidden:
 *  - the core drops events on 127.0.0.1 unless captureOnLocalhost is true (the release server is loopback);
 *  - the core drops events when navigator.webdriver is set unless window.__plausible is set (Playwright sets it).
 * Transport: the core's endpoint is pointed at the loopback release collector instead of https://plausible.io/api/event,
 * because Chromium sends keepalive POSTs issued during unload outside Playwright route interception (observed: they
 * reached the dead-end proxy). The endpoint the application declared is forwarded as `declared` and asserted.
 * Every other option supplied by the application (autoCapturePageviews, transformRequest, ...) is passed through
 * unchanged, so URL/referrer/property sanitization is exercised exactly as shipped.
 */
export const TRACKER_PACKAGE = '@plausible-analytics/tracker';
export const FIXTURE_DOMAIN = 'fsc-release-fixture.invalid';

/**
 * Tags each tracker send to the collector with a unique sequence value. Browsers may transparently retry a POST whose
 * connection was dropped (Firefox re-sent identical bodies about 2 ms apart in the event-failure scenario), so counts are
 * taken per logical send, not per HTTP attempt. Only URLs that start with the collector endpoint are touched.
 */
export function transportTaggerSource(collectorEndpoint: string): string {
  return `(function () {
  if (window.__fscTransportTagged) return;
  window.__fscTransportTagged = true;
  var prefix = ${JSON.stringify(collectorEndpoint)};
  var page = Math.random().toString(36).slice(2);
  var sequence = 0;
  var original = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.indexOf(prefix) === 0) input = input + '&seq=' + page + '-' + (++sequence);
    return original.call(this, input, init);
  };
})();`;
}

export function trackerInfo() {
  const require = createRequire(__filename);
  // The package's exports map exposes only ".", which resolves to the ES module file itself.
  const file = require.resolve(TRACKER_PACKAGE);
  const pkg = JSON.parse(readFileSync(join(dirname(file), 'package.json'), 'utf8')) as { name: string; version: string };
  if (pkg.name !== TRACKER_PACKAGE) throw new Error(`Resolved ${file} does not belong to ${TRACKER_PACKAGE}`);
  return { version: pkg.version, file };
}

let cachedCore: { core: string; version: string } | undefined;
function trackerCore() {
  if (cachedCore) return cachedCore;
  const { file, version } = trackerInfo();
  const source = readFileSync(file, 'utf8');
  const exportStatement = /export\s*\{\s*init\s*,\s*track\s*,\s*DEFAULT_FILE_TYPES\s*\}\s*;?\s*$/;
  if (!exportStatement.test(source)) throw new Error(`${TRACKER_PACKAGE}@${version} ${file} no longer ends with the expected export statement; re-verify the adapter`);
  cachedCore = { core: source.replace(exportStatement, ''), version };
  return cachedCore;
}

export function trackerAdapterSource(collectorEndpoint: string): string {
  const { core, version } = trackerCore();
  return `/* FSC release fixture: ${TRACKER_PACKAGE}@${version} core + pa-*.js loader emulation (tests only) */
${transportTaggerSource(collectorEndpoint)}
(function () {
${core}
;var stub = window.plausible;
if (stub && stub.l) return;
window.__plausible = true;
var started = false;
function start(options) {
  if (started) return;
  started = true;
  var queued = (window.plausible && window.plausible.q) || [];
  var declared = options && options.endpoint !== undefined ? String(options.endpoint) : '';
  var config = Object.assign({}, options || {}, { domain: ${JSON.stringify(FIXTURE_DOMAIN)}, captureOnLocalhost: true, bindToWindow: true });
  config.endpoint = ${JSON.stringify(collectorEndpoint)} + '&declared=' + encodeURIComponent(declared);
  window.__fscTrackerOptions = { autoCapturePageviews: config.autoCapturePageviews, transformRequest: typeof config.transformRequest, declaredEndpoint: declared };
  init(config);
  window.plausible.init = function () {};
  for (var index = 0; index < queued.length; index++) track(queued[index][0], queued[index][1]);
}
if (stub && stub.o) start(stub.o);
else {
  var queue = function () { (queue.q = queue.q || []).push(arguments); };
  if (stub && stub.q) queue.q = stub.q;
  queue.init = function (options) { start(options); };
  window.plausible = queue;
}
})();
`;
}
