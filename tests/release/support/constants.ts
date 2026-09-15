// Release-suite constants. Ports are dedicated loopback ports; 3100 belongs to test:e2e and is never used here.
export const PORTS = {
  local: 3161, // scripts/local-server.mjs --compiled (local preview, synthetic receipt sink)
  localFailure: 3162, // same local-preview build, FSC_LOCAL_FAILURE=1 (known delivery failure)
  measure: 3163, // scripts/local-server.mjs --compiled --measure (production-equivalent, delivery disabled)
  analytics: 3164, // scripts/local-server.mjs --compiled --measure --analytics-fixture
  lighthouseCdp: 3167, // loopback Chrome DevTools Protocol port for the Lighthouse browser
  collector: 3168, // loopback analytics collector: the test tracker adapter posts every payload here instead of plausible.io
  sinkhole: 3169, // dead-end proxy: any browser connection that escapes route interception is recorded and dropped
} as const;
export const origin = (port: number) => `http://127.0.0.1:${port}`;
export const ORIGINS = {
  local: origin(PORTS.local),
  localFailure: origin(PORTS.localFailure),
  measure: origin(PORTS.measure),
  analytics: origin(PORTS.analytics),
};
export const SERVER_ORIGINS = new Set(Object.values(ORIGINS));

// Contract (S-006 addendum item 2): synthetic script URL and the Plausible event endpoint.
export const FIXTURE_SCRIPT_URL = 'https://plausible.io/js/pa-fsc-release-fixture.js';
export const EVENT_ENDPOINT = 'https://plausible.io/api/event';
// Contract (S-006 analytics design): sanitized pageview URL = production origin + canonical path.
export const PRODUCTION_ORIGIN = 'https://www.floridasecurityconcepts.com';

// Representative route families, chosen from tests/fixtures/routes.ts (asserted present in routes.spec).
export const REPRESENTATIVE = {
  home: '/',
  contact: '/contact',
  services: '/services',
  serviceDetail: '/services/access-control',
  industry: '/industries/hoa-gated-communities',
  area: '/service-areas/orlando',
  article: '/resources/how-much-does-an-automatic-gate-cost',
} as const;

export const SINKHOLE_ENV = 'FSC_RELEASE_SINKHOLE_LOG';
export const COLLECTOR_ENV = 'FSC_RELEASE_ANALYTICS_LOG';
export const COLLECTOR_ORIGIN = origin(PORTS.collector);
export const EVIDENCE_ENV = 'FSC_RELEASE_EVIDENCE_DIR';
export const RUN_ID_ENV = 'FSC_RELEASE_RUN_ID';
