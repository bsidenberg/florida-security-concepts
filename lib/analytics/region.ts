// Region category from a fixed copy of the existing location data (city → region).
// Hardcoded so client bundles do not carry location page content; must match
// data/locations.ts (Central Florida → orlando, Tampa Bay → tampa). The typed city
// string is compared locally and never leaves this function.
import type { Region } from './events';

export const CITY_REGIONS: readonly (readonly [city: string, region: 'orlando' | 'tampa'])[] = [
  ['Orlando', 'orlando'], ['Tampa', 'tampa'], ['Lakeland', 'orlando'], ['Kissimmee', 'orlando'],
  ['Winter Garden', 'orlando'], ['Clermont', 'orlando'], ['Lake Mary', 'orlando'], ['Sanford', 'orlando'],
  ['Ocala', 'orlando'], ['The Villages', 'orlando'], ['St. Petersburg', 'tampa'], ['Clearwater', 'tampa'],
  ['Brandon', 'tampa'], ['Wesley Chapel', 'tampa'],
];

export function normalizeCity(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+(fl|florida)$/, '').trim();
}

const REGION_BY_CITY = new Map<string, Region>(CITY_REGIONS.map(([city, region]) => [normalizeCity(city), region]));

/** Central Florida service areas → `orlando`, Tampa Bay → `tampa`, other text → `other`, blank → `unknown`. */
export function regionFromCity(city: unknown): Region {
  if (typeof city !== 'string' || !city.trim()) return 'unknown';
  return REGION_BY_CITY.get(normalizeCity(city)) ?? 'other';
}
