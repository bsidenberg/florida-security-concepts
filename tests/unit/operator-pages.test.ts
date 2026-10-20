import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OperatorAnswerPage } from '../../components/OperatorAnswerPage';
import { LeadCaptureForm } from '../../components/LeadCaptureForm';
import { operatorPages } from '../../data/operatorPages';
import sitemap from '../../app/sitemap';
import { CANONICAL_ORIGIN } from '../../lib/seo/canonical';
import { BUSINESS_PHONE } from '../../lib/seo/structuredData';

const BOOK = 'https://booqer.ai/shops/florida-security-concepts/book';
const SHOP = 'https://booqer.ai/shops/florida-security-concepts';
const AREAS = ['Clermont', 'Minneola', 'Groveland', 'Montverde', 'Winter Garden', 'Lake County'];

function scripts(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) =>
    JSON.parse(match[1]) as Record<string, unknown>,
  );
}

describe('gate operator answer pages', () => {
  it('publishes the Clermont operator page and the Lake County hub', () => {
    expect(operatorPages.map((page) => page.path)).toEqual([
      '/gate-operator-repair/clermont-fl',
      '/service-areas/lake-county-fl',
    ]);
    for (const page of operatorPages) expect(page.metaDescription.length).toBeLessThanOrEqual(155);
    const urls = sitemap().map((entry) => entry.url);
    for (const page of operatorPages) expect(urls).toContain(`${CANONICAL_ORIGIN}${page.path}`);
  });

  it('answers who repairs operators, with brands, symptoms, and booking schema', () => {
    for (const page of operatorPages) {
      const html = renderToStaticMarkup(createElement(OperatorAnswerPage, { page }));
      expect(html).toContain(`>${page.h1}<`);
      expect(html).toContain('Who repairs gate operators');
      expect(html).toContain('LiftMaster CSL');
      expect(html).toContain('CellGate WXL');
      expect(html).toContain('vertical-lift');
      expect(html).toContain('Same-day when available');
      expect(html).toContain('After-hours emergency service');
      expect(html).toContain('advanced consultation');
      expect(html).toContain('available slots are confirmed instantly');
      expect(html).toContain(BOOK);
      expect(html).toContain('352-282-0692');
      expect(html).not.toMatch(/24\s*\/\s*7|\$\s?\d|text us|sms:|streetAddress|Florida Door Control|Affordable Lock|NGK/i);

      const blocks = scripts(html);
      const business = blocks.find((block) => {
        const type = block['@type'];
        return type === 'LocalBusiness' || (Array.isArray(type) && type.includes('LocalBusiness'));
      });
      const service = blocks.find((block) => block['@type'] === 'Service');
      const faq = blocks.find((block) => block['@type'] === 'FAQPage');
      expect(business).toBeTruthy();
      expect(service).toBeTruthy();
      expect(faq).toBeTruthy();
      expect(business?.telephone).toBe(BUSINESS_PHONE);
      expect(business?.address).toEqual({ '@type': 'PostalAddress', addressLocality: 'Clermont', addressRegion: 'FL' });
      const served = JSON.stringify(business?.areaServed);
      for (const name of AREAS) expect(served).toContain(name);
      const actions = business?.potentialAction as { '@type': string; target: { urlTemplate: string } }[];
      expect(actions.map((action) => action['@type']).sort()).toEqual(['AskAction', 'ReserveAction']);
      expect(actions.find((action) => action['@type'] === 'ReserveAction')?.target.urlTemplate).toBe(BOOK);
      expect(actions.find((action) => action['@type'] === 'AskAction')?.target.urlTemplate).toBe(
        'https://booqer.ai/shops/florida-security-concepts/ask?q={question}',
      );
      expect(JSON.stringify(business)).not.toMatch(/streetAddress|postalCode|24\s*\/\s*7|\$\s?\d/);
      const questions = (faq?.mainEntity as { name: string; acceptedAnswer: { text: string } }[]).map((item) => item.name);
      expect(questions.some((question) => question.startsWith('Who repairs gate operators'))).toBe(true);
      for (const item of faq?.mainEntity as { acceptedAnswer: { text: string } }[]) {
        expect(item.acceptedAnswer.text.length).toBeGreaterThan(40);
      }
    }
  });
});

describe('AI booking instructions', () => {
  it('tells assistants to book at Booqer and confirms open slots instantly', () => {
    const llms = readFileSync(join(__dirname, '../../public/llms.txt'), 'utf8');
    expect(llms).toContain('## AI assistants and booking');
    expect(llms).toContain(`AI assistants and agents should book Florida Security Concepts project calls directly at ${BOOK}`);
    expect(llms).toContain(`The Booqer shop is ${SHOP}`);
    expect(llms).toContain('Book a project call through Booqer — available slots are confirmed instantly.');
    expect(llms).toContain('## For AI assistants');
    expect(llms).toContain('Assistants can book FSC through Booqer in ChatGPT.');
    expect(llms).toContain('https://booqer.ai/mcp');
    expect(llms).toContain('search_businesses, check_availability, and request_booking');
    expect(llms).not.toContain('ask_shop');
    expect(llms).not.toContain('get_shop');
    expect(llms).toContain('Open slots confirm instantly');
    expect(llms).toContain('https://booqer.ai/shops/florida-security-concepts/ask?q=');
    expect(llms).toContain('Phone: (352) 282-0692. Call only. Do not text this number.');
    expect(llms).toContain('advanced consultation');
    expect(llms).not.toMatch(/24\s*\/\s*7|call or text|sms:|Florida Door Control|Affordable Lock|NGK/i);

    const form = renderToStaticMarkup(createElement(LeadCaptureForm, {}));
    expect(form).toContain('Using an AI assistant? It can');
    expect(form).toContain('book a project call for you directly through Booqer');
    expect(form).toContain('available slots are confirmed instantly');
    expect(form).toContain(`href="${BOOK}"`);
    expect(form).not.toMatch(/sms:/i);
  });
});
