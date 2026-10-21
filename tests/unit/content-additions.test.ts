import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import LocationPage from '../../app/service-areas/[slug]/page';
import { GateRepairProcess } from '../../components/GateRepairProcess';
import { LocalLandingView } from '../../components/LocalLandingPage';
import { OperatorAnswerPage } from '../../components/OperatorAnswerPage';
import { Reviews } from '../../components/Reviews';
import { HowToSchema } from '../../components/Schema';
import { gateRepairProcess } from '../../data/gateRepairProcess';
import { getLocalLanding } from '../../data/localLandings';
import { getLocation, locations } from '../../data/locations';
import { getOperatorPage } from '../../data/operatorPages';
import { googleReviewsUrl, reviews } from '../../data/reviews';

const NEW_SLUGS = ['montverde', 'minneola', 'groveland', 'orange-county'] as const;
const FORBIDDEN = /24\s*\/\s*7|free estimate|call or text|sms:|\$\s?\d|division of|license plate|\bLPR\b|AI-enabled|AI camera/i;

function scripts(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) =>
    JSON.parse(match[1]) as Record<string, unknown>,
  );
}

describe('gate repair process', () => {
  it('covers the call-to-finished-repair sequence without prices or anytime claims', () => {
    const text = gateRepairProcess.steps.map((step) => `${step.name} ${step.text}`).join('\n');
    expect(text).toMatch(/Call and scheduling/);
    expect(text).toMatch(/On-site diagnosis/);
    expect(text).toMatch(/photo eyes/);
    expect(text).toMatch(/edges/);
    expect(text).toMatch(/loop detector/);
    expect(text).toMatch(/open-close/);
    expect(text).toMatch(/safety reversal/);
    expect(text).toMatch(/Walkthrough and maintenance recommendation/);
    expect(text).toMatch(/advanced consultation/);
    expect(text).not.toMatch(FORBIDDEN);

    const html = renderToStaticMarkup(createElement(GateRepairProcess));
    expect(html).toContain('What happens from your first call to a finished gate repair');
    expect(html).not.toMatch(FORBIDDEN);
    expect(html).not.toContain('application/ld+json');

    const schemaHtml = renderToStaticMarkup(
      createElement(HowToSchema, {
        name: gateRepairProcess.name,
        description: gateRepairProcess.description,
        steps: gateRepairProcess.steps.map((step) => ({ name: step.name, text: step.text })),
      }),
    );
    const schema = scripts(schemaHtml)[0];
    expect(schema['@type']).toBe('HowTo');
    expect(schema.step).toHaveLength(5);
    expect(schema).not.toHaveProperty('estimatedCost');
    expect(schema).not.toHaveProperty('totalTime');
    expect(JSON.stringify(schema)).not.toMatch(/AggregateRating|streetAddress/);
  });

  it('is on the Clermont gate repair page, the Lake County pages, and not on Orlando', () => {
    for (const slug of ['clermont-fl', 'minneola-fl', 'groveland-fl'] as const) {
      const landing = getLocalLanding('gate-repair', slug);
      const html = renderToStaticMarkup(createElement(LocalLandingView, { landing: landing! }));
      expect(html).toContain('What happens from your first call to a finished gate repair');
      const blocks = scripts(html);
      expect(blocks[0]['@type']).toBe('Service');
      expect(blocks.some((block) => block['@type'] === 'HowTo')).toBe(true);
      expect(html).not.toMatch(FORBIDDEN);
    }

    const orlando = getLocalLanding('gate-repair', 'orlando-fl');
    const orlandoHtml = renderToStaticMarkup(createElement(LocalLandingView, { landing: orlando! }));
    expect(orlandoHtml).not.toContain('id="repair-process"');

    const lake = getOperatorPage('/service-areas/lake-county-fl');
    const clermontOperator = getOperatorPage('/gate-operator-repair/clermont-fl');
    for (const page of [lake, clermontOperator]) {
      const html = renderToStaticMarkup(createElement(OperatorAnswerPage, { page: page! }));
      expect(html).toContain('What happens from your first call to a finished gate repair');
      expect(scripts(html).some((block) => block['@type'] === 'HowTo')).toBe(true);
      expect(html).not.toMatch(FORBIDDEN);
    }
  });
});

describe('reviews', () => {
  it('renders nothing and emits no rating schema when no real reviews are on file', () => {
    expect(reviews).toEqual([]);
    expect(googleReviewsUrl).toBe('');
    const html = renderToStaticMarkup(createElement(Reviews));
    expect(html).toBe('');
    expect(html).not.toMatch(/AggregateRating|Review/);
  });
});

describe('Lake County and west Orange service areas', () => {
  it('publishes four distinct pages with local facts, FAQs, and area schema', async () => {
    for (const slug of NEW_SLUGS) {
      const loc = getLocation(slug);
      expect(loc, slug).toBeTruthy();
      expect(loc!.faqs!.length).toBeGreaterThanOrEqual(4);
      expect(loc!.faqs!.length).toBeLessThanOrEqual(6);
      expect(loc!.metaDescription.length).toBeLessThanOrEqual(170);
      expect(loc!.areaServed!.length).toBeGreaterThan(0);
      expect(JSON.stringify(loc)).not.toMatch(FORBIDDEN);

      const element = await LocationPage({ params: Promise.resolve({ slug }) });
      const html = renderToStaticMarkup(element);
      expect(html).toContain(loc!.intro.slice(0, 40));
      const blocks = scripts(html);
      expect(blocks.some((block) => block['@type'] === 'FAQPage')).toBe(true);
      expect(blocks.some((block) => block['@type'] === 'LocalBusiness')).toBe(true);
      expect(blocks.some((block) => block['@type'] === 'Service')).toBe(true);
      const faq = blocks.find((block) => block['@type'] === 'FAQPage');
      expect(faq?.mainEntity).toHaveLength(loc!.faqs!.length);
      expect(JSON.stringify(blocks)).not.toMatch(/AggregateRating|streetAddress|postalCode|24\s*\/\s*7/);
      expect(html).not.toMatch(FORBIDDEN);
    }

    expect(getLocation('montverde')!.localContext).toMatch(/Lake Apopka/);
    expect(getLocation('montverde')!.localContext).toMatch(/455/);
    expect(getLocation('minneola')!.localContext).toMatch(/US 27/);
    expect(getLocation('minneola')!.localContext).toMatch(/Hancock Road/);
    expect(getLocation('groveland')!.localContext).toMatch(/State Road 50/);
    expect(getLocation('groveland')!.localContext).toMatch(/State Road 19/);
    const orange = `${getLocation('orange-county')!.intro} ${getLocation('orange-county')!.localContext}`;
    expect(orange).toMatch(/Winter Garden/);
    expect(orange).toMatch(/Windermere/);
    expect(orange).toMatch(/Ocoee/);

    const bodies = NEW_SLUGS.map((slug) => {
      const loc = getLocation(slug)!;
      return [loc.intro, loc.localContext, ...(loc.details ?? []).map((detail) => detail.body)].join('\n');
    });
    expect(new Set(bodies).size).toBe(bodies.length);
    expect(getLocation('clermont')!.nearby).toEqual(expect.arrayContaining([...NEW_SLUGS]));
    expect(locations.map((loc) => loc.slug)).toEqual(expect.arrayContaining([...NEW_SLUGS]));
  });
});
