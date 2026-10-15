import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { concepts } from '../../data/concepts';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  organizationJsonLd,
  serviceJsonLd,
} from '../../lib/seo/jsonld';

function walk(value: unknown, path: string, problems: string[]) {
  if (typeof value === 'string') {
    if (value.length === 0) problems.push(`${path} is empty`);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) problems.push(`${path} is an empty array`);
    value.forEach((item, index) => walk(item, `${path}[${index}]`, problems));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, inner] of Object.entries(value)) walk(inner, `${path}.${key}`, problems);
  }
}

describe('JSON-LD', () => {
  it('describes the Clermont business without a street address, 24/7 hours, or plate-reader claims', () => {
    const data = organizationJsonLd();
    const problems: string[] = [];
    walk(data, '$', problems);
    expect(problems).toEqual([]);
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toEqual(expect.arrayContaining(['ProfessionalService', 'HomeAndConstructionBusiness']));
    expect(JSON.stringify(data)).toContain('Clermont');
    expect(JSON.stringify(data)).toContain('+13522820692');
    expect(JSON.stringify(data)).toContain('Orlando');
    expect(JSON.stringify(data)).not.toMatch(/24\/7|license plate|Managed Entry/i);
    expect(data).not.toHaveProperty('openingHoursSpecification');
    expect(data.image).toContain('/brand/fsc-logo-primary.png');
    expect(data.logo).toContain('/brand/fsc-logo-primary.png');
    expect(JSON.stringify(data)).not.toMatch(/\.webp|license plate/i);
    expect(data.address).toMatchObject({ addressLocality: 'Clermont', addressRegion: 'FL' });
    expect(data.address).not.toHaveProperty('streetAddress');
    const served = JSON.stringify(data.areaServed);
    expect(served).toContain('Ocala'); // Ocala added per Jeff Hicks review 2026-10-15
    expect(served).not.toContain('The Villages');
    expect(served).not.toContain('Lake Mary');
    expect(served).not.toContain('Sanford');
    expect(() => JSON.parse(JSON.stringify(data))).not.toThrow();
  });

  it('builds service, FAQ, and breadcrumb objects without a fake equipment photo', () => {
    const service = serviceJsonLd({
      name: 'Gate automation',
      description: 'Operators and safety devices for Florida properties.',
      url: 'https://www.floridasecurityconcepts.com/services/gate-automation',
      serviceType: 'Gate Automation',
    });
    expect(service['@type']).toBe('Service');
    expect(service).not.toHaveProperty('image');

    const faq = faqJsonLd([{ q: 'Where are you based?', a: 'Clermont, Lake County, Florida.' }]);
    expect(faq?.['@type']).toBe('FAQPage');

    const crumbs = breadcrumbJsonLd([
      { name: 'Home', url: 'https://www.floridasecurityconcepts.com/' },
      { name: 'Services', url: 'https://www.floridasecurityconcepts.com/services' },
    ]);
    const items = crumbs?.itemListElement as { position: number }[];
    expect(items.map((item) => item.position)).toEqual([1, 2]);
    expect(faqJsonLd([])).toBeNull();
  });

  it('uses line diagrams instead of equipment photos and leaves the hero map clear', () => {
    const root = join(__dirname, '../..');
    const grid = readFileSync(join(root, 'components/ConceptGrid.tsx'), 'utf8');
    const hero = readFileSync(join(root, 'components/home/HomeHero.tsx'), 'utf8');
    const home = readFileSync(join(root, 'app/page.tsx'), 'utf8');
    expect(grid).not.toContain('<img');
    expect(grid).not.toContain('figcaption');
    expect(grid).toContain('concept.alt');
    expect(hero).not.toContain('PhotoFigure');
    expect(hero).not.toContain('ConceptGrid');
    expect(hero).toContain('fsc-hero-map-slot');
    expect(home).toContain('EquipmentGrid');
    expect(home).not.toContain('ConceptGrid');
    expect(home).not.toContain('/photos/');
    expect(home).not.toContain('Equipment on service visits');
    expect(existsSync(join(root, 'public/photos'))).toBe(false);
    expect(existsSync(join(root, 'data/photos.ts'))).toBe(false);
    expect(existsSync(join(root, 'app/opengraph-image.jpg'))).toBe(false);
    expect(existsSync(join(root, 'public/brand/fsc-logo-primary.png'))).toBe(true);
    expect(existsSync(join(root, 'public/manufacturers/liftmaster.png'))).toBe(true);
    const equip = readFileSync(join(root, 'components/home/EquipmentGrid.tsx'), 'utf8');
    expect(equip).not.toMatch(/<img|figcaption|24\/7|free estimate|license plate|\bLPR\b|AI camera|\$\d|division of/i);
    expect(equip).toContain('Install');
    expect(equip).toContain('Repair');
    expect(equip).toContain('Maintenance');
    expect(equip).toContain('/services/security-gate-systems');
    expect(equip).toContain('/services/gate-automation');
    expect(equip).toContain('/services/access-control');
    expect(equip).toContain('/services/video-surveillance');
    expect(equip).toContain('/manufacturers/');
    for (const name of ['FDC', 'Kings Access', 'Gate Tech', 'KMG', 'Xpress Gates', 'cfgateservices']) {
      expect(`${home}\n${equip}`).not.toContain(name);
    }
    for (const file of ['components/Footer.tsx', 'app/privacy/page.tsx', 'app/terms/page.tsx', 'data/site.ts', 'app/page.tsx']) {
      expect(readFileSync(join(root, file), 'utf8')).not.toMatch(/division of/i);
    }
    expect(readFileSync(join(root, 'data/site.ts'), 'utf8')).toContain("legalName: 'Florida Security Concepts LLC'");
    for (const concept of Object.values(concepts)) {
      expect(concept.alt.length).toBeGreaterThan(20);
      expect(concept.caption.length).toBeGreaterThan(20);
      expect(`${concept.alt} ${concept.caption} ${concept.title} ${concept.kicker}`).not.toMatch(/Clermont|Orlando|Tampa|Lake County|license plate|\bLPR\b|\bjob\b|24\/7|\$\d/i);
    }
    const packed = JSON.stringify(concepts);
    for (const banned of [
      '.webp',
      'orlando-fl-technician-servicing-slide-gate-operator',
      'clermont-fl-self-storage-swing-gate-keypad-bollard',
      'orlando-fl-gate-post-wireless-receiver-operator-cabinet',
      'florida-self-storage-keypad-bollard-swing-gate',
      'florida-gate-post-wireless-receiver.webp',
      'florida-self-storage-keypad-pedestal',
      'florida-self-storage-ornamental-gate-bollard',
      'central-florida-commercial-slide-gate-lpr-camera',
    ]) {
      expect(packed).not.toContain(banned);
    }
  });
});
