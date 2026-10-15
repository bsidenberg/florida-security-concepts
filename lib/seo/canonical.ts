// Public canonical origin. The apex host 308-redirects to www, so every
// canonical, sitemap URL, and JSON-LD URL uses this host — never a preview
// host and never NEXT_PUBLIC_SITE_URL.
export const CANONICAL_ORIGIN = 'https://www.floridasecurityconcepts.com';

/**
 * Absolute, self-referencing canonical URL for a site path.
 * `/` is the bare origin (no trailing slash), matching the sitemap loc.
 * Other paths have no trailing slash, matching the site's 308 from `/path/`.
 */
export function canonicalUrl(path: string): string {
  if (path.includes('?') || path.includes('#')) {
    throw new Error(`Canonical path cannot include a query or hash: ${path}`);
  }
  const withLeadingSlash = path === '' || path.startsWith('/') ? path : `/${path}`;
  const normalized = withLeadingSlash === '/' ? '' : withLeadingSlash.replace(/\/+$/, '');
  return `${CANONICAL_ORIGIN}${normalized}`;
}
