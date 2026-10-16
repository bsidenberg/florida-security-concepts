import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BooqerBlock, BooqerDiscovery } from '../../components/BooqerKit';
import { apexLlmsDecision } from '../../middleware';

const BOOK = 'https://booqer.ai/shops/florida-security-concepts/book';
const ASK = 'https://booqer.ai/shops/florida-security-concepts/ask';

describe('Booqer kit', () => {
  it('renders the visible book-or-ask block without prices, hours, or texting', () => {
    const html = renderToStaticMarkup(createElement(BooqerBlock));
    expect(html).toContain('id="booqer"');
    expect(html).toContain('Book instantly or ask a question');
    expect(html).toContain('advanced consultation');
    expect(html).toContain(`href="${BOOK}"`);
    expect(html).toContain('rel="booqer-book"');
    expect(html).toContain(`href="${ASK}"`);
    expect(html).toContain('rel="booqer-ask"');
    expect(html).toContain('Ask a question');
    expect(html).toContain('shop id "florida-security-concepts"');
    expect(html).toContain('https://booqer.ai/mcp');
    expect(html).not.toMatch(/24\s*\/\s*7|\$\s?\d|call or text|sms:|streetAddress/i);
  });

  it('emits the shop agent card, MCP link, and shop meta', () => {
    const html = renderToStaticMarkup(createElement(BooqerDiscovery));
    expect(html).toContain('rel="alternate"');
    expect(html).toContain('type="application/json"');
    expect(html).toContain('href="https://booqer.ai/shops/florida-security-concepts/agent-card.json"');
    expect(html).toContain('title="Booqer agent card"');
    expect(html).toContain('rel="mcp"');
    expect(html).toContain('href="https://booqer.ai/mcp"');
    expect(html).toContain('rel="service-desc"');
    expect(html).toContain('name="booqer:shop"');
    expect(html).toContain('content="florida-security-concepts"');
  });

  it('serves /llms.txt on the apex and redirects every other apex path to www', () => {
    expect(apexLlmsDecision('floridasecurityconcepts.com', '/llms.txt')).toBe('serve');
    expect(apexLlmsDecision('floridasecurityconcepts.com:443', '/llms.txt')).toBe('serve');
    expect(apexLlmsDecision('floridasecurityconcepts.com', '/')).toBe('redirect-www');
    expect(apexLlmsDecision('floridasecurityconcepts.com', '/contact')).toBe('redirect-www');
    expect(apexLlmsDecision('www.floridasecurityconcepts.com', '/llms.txt')).toBe('pass');
    expect(apexLlmsDecision('www.floridasecurityconcepts.com', '/')).toBe('pass');
    expect(apexLlmsDecision('localhost', '/llms.txt')).toBe('pass');
  });
});