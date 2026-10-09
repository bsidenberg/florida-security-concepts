import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { photos } from '../../data/photos';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  imageObjectJsonLd,
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
    expect(data.image).toContain('central-florida-commercial-slide-gate-lpr-camera.webp');
    expect(data.address).toMatchObject({ addressLocality: 'Clermont', addressRegion: 'FL' });
    expect(data.address).not.toHaveProperty('streetAddress');
    const served = JSON.stringify(data.areaServed);
    expect(served).not.toContain('Ocala');
    expect(served).not.toContain('The Villages');
    expect(served).not.toContain('Lake Mary');
    expect(served).not.toContain('Sanford');
    expect(() => JSON.parse(JSON.stringify(data))).not.toThrow();
  });

  it('builds service, FAQ, breadcrumb, and image objects', () => {
    const photo = photos.commercialLpr;
    const image = imageObjectJsonLd(photo);
    expect(image['@type']).toBe('ImageObject');
    expect(image.contentUrl).toBe(`https://www.floridasecurityconcepts.com${photo.src}`);
    expect(image.width).toBe(photo.width);
    expect(image.height).toBe(photo.height);
    expect(String(image.caption).length).toBeGreaterThan(20);

    const service = serviceJsonLd({
      name: 'Gate automation',
      description: 'Operators and safety devices for Florida properties.',
      url: 'https://www.floridasecurityconcepts.com/services/gate-automation',
      serviceType: 'Gate Automation',
      image: photo.src,
    });
    expect(service['@type']).toBe('Service');
    expect(service.image).toContain(photo.src);

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

  it('keeps captions in schema only and leaves the hero map clear of photos', () => {
    const root = join(__dirname, '../..');
    const figure = readFileSync(join(root, 'components/PhotoFigure.tsx'), 'utf8');
    const hero = readFileSync(join(root, 'components/home/HomeHero.tsx'), 'utf8');
    expect(figure).not.toContain('figcaption');
    expect(hero).not.toContain('PhotoFigure');
    expect(hero).toContain('fsc-hero-map-slot');
    expect(photos.storageSlideKeypad.src).toContain('clermont-fl-self-storage-slide-gate-keypad.webp');
    expect(photos.gateCamera.src).toContain('orlando-fl-security-camera-monitoring-vehicle-gate-entry.webp');
    for (const photo of Object.values(photos)) {
      expect(`${photo.alt} ${photo.caption} ${photo.placeName}`).not.toMatch(/Clermont|Orlando|Tampa|Lake County|license plate|\bLPR\b|job/i);
    }
    expect(imageObjectJsonLd(photos.gateCamera).contentUrl).toContain('orlando-fl-security-camera-monitoring-vehicle-gate-entry.webp');
    expect(JSON.stringify(photos)).not.toContain('orlando-fl-technician-servicing-slide-gate-operator');
    const slide = imageObjectJsonLd(photos.storageSlideKeypad);
    expect(slide.caption).toBe(photos.storageSlideKeypad.caption);
    expect(slide.contentUrl).toContain('clermont-fl-self-storage-slide-gate-keypad.webp');
    expect(JSON.stringify(photos)).not.toContain('clermont-fl-self-storage-swing-gate-keypad-bollard');
    expect(JSON.stringify(photos)).not.toContain('orlando-fl-gate-post-wireless-receiver-operator-cabinet');
    expect(JSON.stringify(photos)).not.toContain('florida-self-storage-keypad-bollard-swing-gate');
    expect(JSON.stringify(photos)).not.toContain('florida-gate-post-wireless-receiver.webp');
    expect(JSON.stringify(photos)).not.toContain('florida-self-storage-keypad-pedestal');
    expect(JSON.stringify(photos)).not.toContain('florida-self-storage-ornamental-gate-bollard');
    const home = readFileSync(join(root, 'app/page.tsx'), 'utf8');
    expect(home).not.toContain('Equipment on service visits');
  });
});
