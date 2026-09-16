// Independent public route contract: deliberately not derived from application data.
export const routes = [
  '/', '/contact', '/services', '/industries', '/service-areas', '/resources',
  ...['security-gate-systems', 'gate-automation', 'access-control', 'video-surveillance', 'security-system-integration', 'emergency-service'].map(s => `/services/${s}`),
  ...['hoa-gated-communities', 'multifamily-apartments-condos', 'storage-facilities', 'commercial-properties', 'industrial-warehouses', 'property-managers', 'residential-estates'].map(s => `/industries/${s}`),
  ...['orlando', 'tampa', 'lakeland', 'kissimmee', 'winter-garden', 'clermont', 'lake-mary', 'sanford', 'ocala', 'the-villages', 'st-petersburg', 'clearwater', 'brandon', 'wesley-chapel'].map(s => `/service-areas/${s}`),
  ...['how-much-does-an-automatic-gate-cost', 'best-access-control-system-for-hoa', 'storage-facility-security-camera-guide', 'gate-automation-vs-access-control', 'property-manager-security-system-checklist'].map(s => `/resources/${s}`),
];
