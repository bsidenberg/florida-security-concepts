// Region category (lib/analytics/region.ts): hardcoded city table must match data/locations.ts, and the module must not
// pull location page content into client bundles.
import { describe, expect, it, vi } from 'vitest';
import { locations } from '../../data/locations';

describe('region table', () => {
  it('matches every location in data/locations.ts (Central Florida → orlando, Tampa Bay → tampa) with no extras', async () => {
    const { CITY_REGIONS } = await import('../../lib/analytics/region');
    const expected = locations.map(location => [location.city, location.region === 'Tampa Bay' ? 'tampa' : 'orlando'] as const);
    expect(locations.every(location => ['Central Florida', 'Tampa Bay'].includes(location.region))).toBe(true);
    expect([...CITY_REGIONS].map(([city, region]) => `${city}:${region}`).sort()).toEqual(expected.map(([city, region]) => `${city}:${region}`).sort());
  });

  it('maps each service-area city, including punctuation, case and state suffix variants', async () => {
    const { regionFromCity } = await import('../../lib/analytics/region');
    for (const location of locations) {
      const region = location.region === 'Tampa Bay' ? 'tampa' : 'orlando';
      for (const variant of [location.city, location.city.toUpperCase(), `  ${location.city.toLowerCase()} `, `${location.city}, FL`, `${location.city} Florida`]) {
        expect(regionFromCity(variant), variant).toBe(region);
      }
    }
    expect(regionFromCity('St Petersburg')).toBe('tampa');
  });

  it('returns only the four categories and never echoes typed text', async () => {
    const { regionFromCity } = await import('../../lib/analytics/region');
    for (const value of ['Ocala Estates', 'West Orlando', 'Orlandoo', 'Miami', 'jane.doe@example.com', '4075551234', 'Gate code 4417', 'Orlando; DROP TABLE', 'Tampa Bay area near my house at 12 Oak St']) {
      expect(regionFromCity(value), value).toBe('other');
    }
    for (const value of ['', '   ', undefined, null, 32801, ['Orlando'], { city: 'Orlando' }]) expect(regionFromCity(value)).toBe('unknown');
  });
});

describe('client bundle independence', () => {
  it('loads and maps regions without importing data/locations (import-level check)', async () => {
    vi.resetModules();
    vi.doMock('@/data/locations', () => { throw new Error('lib/analytics/region.ts must not import @/data/locations'); });
    vi.doMock('../../data/locations', () => { throw new Error('lib/analytics/region.ts must not import data/locations'); });
    try {
      const { regionFromCity } = await import('../../lib/analytics/region');
      expect(regionFromCity('Clearwater')).toBe('tampa');
      const events = await import('../../lib/analytics/events');
      expect(events.buildEvent('assessment_submit_attempt', { region: regionFromCity('Kissimmee') })?.props.region).toBe('orlando');
    } finally {
      vi.doUnmock('@/data/locations');
      vi.doUnmock('../../data/locations');
      vi.resetModules();
    }
  });

  it('control: the import-level check does detect a module that imports location data', async () => {
    vi.resetModules();
    vi.doMock('@/data/locations', () => { throw new Error('location data imported'); });
    try {
      await expect(import('../../lib/leads/query')).rejects.toThrow(/location data imported|error when mocking a module/);
    } finally {
      vi.doUnmock('@/data/locations');
      vi.resetModules();
    }
  });
});
