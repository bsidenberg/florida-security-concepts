import { test, expect, type Page } from '@playwright/test';

// Owner-approved form privacy disclosure (OD-07 / D-027, approved 2026-09-15; P2 analytics sentence
// amended by owner 2026-09-15 to "to measure page visits and form steps").
// Independent contract: typed here from the approved wording, deliberately not imported from the component.
// P2 contains an em dash (U+2014); P1 uses a straight apostrophe (U+0027) in "don't".
const APPROVED_DISCLOSURE = [
  "We use the details you submit, plus the page and campaign that brought you here, to respond to your request. Submissions are emailed to us via Resend and stored in our private business system. Please don't include gate codes, passwords, or other sensitive information.",
  'We keep a short-lived copy of each submission for seven days to prevent duplicates and troubleshoot delivery, then minimal records after that. To limit repeat submissions we use a protected identifier derived from your network address; the address itself is not stored. We use Plausible, a cookie-free analytics service, to measure page visits and form steps by general category only — never your contact details or message.',
  'Questions about your information: info@floridasecurityconcepts.com.',
];

// Phrases unique to the superseded disclosure; none may be rendered anywhere on the page.
const SUPERSEDED_PHRASES = [
  'additional private copy of your request',
  'this check does not store the address itself',
  'We use your contact and property details',
  'other sensitive security information',
  'before scheduled cleanup',
  // Intermediate approved P2 wording, superseded by the 2026-09-15 amendment.
  'to measure form steps',
];

// /  (homepage) does not render LeadCaptureForm; it links to /contact. These real routes do render it.
const FORM_ROUTES = ['/contact', '/services/access-control', '/industries/hoa-gated-communities', '/service-areas/orlando'];

let blockedExternal = false;
test.beforeEach(async ({ context, baseURL }) => {
  blockedExternal = false;
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === baseURL || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    blockedExternal = true;
    return route.abort('blockedbyclient');
  });
});
test.afterEach(async ({ page }) => {
  expect(blockedExternal, 'No browser request may attempt an external destination').toBe(false);
  await expect(page.locator('script[src*="plausible"]')).toHaveCount(0);
});

async function disclosureBlock(page: Page) {
  const form = page.locator('form[aria-label="Site assessment request form"]');
  await expect(form, 'Route must render exactly one assessment form').toHaveCount(1);
  // The disclosure is the form's direct-child block that carries the privacy contact address.
  const block = form.locator(':scope > div').filter({ hasText: 'info@floridasecurityconcepts.com' });
  await expect(block, 'Assessment form must render exactly one privacy disclosure block').toHaveCount(1);
  return { form, block };
}

for (const path of FORM_ROUTES) {
  test(`privacy disclosure renders the approved wording exactly: ${path}`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    const { form, block } = await disclosureBlock(page);

    const paragraphs = await block.locator(':scope > p').evaluateAll(nodes =>
      nodes.map(node => (node.textContent ?? '').replace(/\s+/g, ' ').trim()));
    expect(paragraphs, 'Disclosure paragraphs must equal the owner-approved text, in order').toEqual(APPROVED_DISCLOSURE);

    const pageText = await page.locator('body').evaluate(body => (body.textContent ?? '').replace(/\s+/g, ' '));
    for (const phrase of SUPERSEDED_PHRASES) {
      expect(pageText, `Superseded disclosure phrase must not render: "${phrase}"`).not.toContain(phrase);
    }

    // Visible without opening the optional "Add details" section, and not nested inside it.
    const details = form.locator('details.fsc-form-details');
    await expect(details).toHaveCount(1);
    expect(await details.evaluate((el: HTMLDetailsElement) => el.open), 'Optional details must start closed').toBe(false);
    expect(await block.evaluate(el => el.closest('details') === null), 'Disclosure must sit outside <details>').toBe(true);
    await block.scrollIntoViewIfNeeded();
    for (const p of await block.locator(':scope > p').all()) await expect(p).toBeVisible();
    expect(await details.evaluate((el: HTMLDetailsElement) => el.open), 'Checking visibility must not open details').toBe(false);
  });
}
