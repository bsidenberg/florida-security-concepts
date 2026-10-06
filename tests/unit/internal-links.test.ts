import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { industries } from '../../data/industries';
import { locations } from '../../data/locations';
import { resources } from '../../data/resources';
import { services } from '../../data/services';

const ROOT = join(__dirname, '../..');
const ALLOWED = new Set<string>([
  '/',
  '/contact',
  '/services',
  '/industries',
  '/service-areas',
  '/resources',
  ...services.map((item) => `/services/${item.slug}`),
  ...industries.map((item) => `/industries/${item.slug}`),
  ...locations.map((item) => `/service-areas/${item.slug}`),
  ...resources.map((item) => `/resources/${item.slug}`),
]);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return path.endsWith('.tsx') ? [path] : [];
  });
}

describe('internal links', () => {
  it('points every static href in app and components at a real route', () => {
    const broken: string[] = [];
    const pattern = /(?:href\s*=\s*|href:\s*)([`'"])([\s\S]*?)\1/g;
    for (const file of [...files(join(ROOT, 'app')), ...files(join(ROOT, 'components'))]) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(pattern)) {
        const href = match[2].trim();
        if (!href || href.includes('${') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('http')) continue;
        const pathname = new URL(href, 'https://www.floridasecurityconcepts.com').pathname.replace(/\/$/, '') || '/';
        if (!ALLOWED.has(pathname)) broken.push(`${file.replace(ROOT, '')} -> ${href}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('links each homepage capability card to its service page', () => {
    const source = readFileSync(join(ROOT, 'app/page.tsx'), 'utf8');
    for (const slug of ['gate-automation', 'access-control', 'video-surveillance', 'security-system-integration']) {
      expect(source).toContain(`'/services/${slug}'`);
    }
  });
});
