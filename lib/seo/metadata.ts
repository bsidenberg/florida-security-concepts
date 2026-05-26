import type { Metadata } from 'next';
import { site } from '@/data/site';

interface BuildPageMetadataParams {
  /** Page title — will receive the "| site.name" suffix from the root template. */
  title: string;
  /** Meta description. Keep ≤155 chars. */
  description: string;
  /** Canonical path, e.g. '/services/gate-automation'. Must start with '/'. */
  path: string;
  /** Optional keyword list. */
  keywords?: string[];
  /** Optional og:image path override. Omit to fall back to the root opengraph-image. */
  image?: string;
  /** og:type. Defaults to 'website'. Use 'article' for resource/guide pages. */
  ogType?: 'website' | 'article';
  /** ISO 8601 date string. Only emitted when ogType === 'article'. */
  publishedTime?: string;
  /** ISO 8601 date string. Only emitted when ogType === 'article'. */
  modifiedTime?: string;
}

/**
 * Builds a complete Next.js Metadata object with consistent openGraph AND
 * twitter fields on every page.
 *
 * Next.js merges metadata from the root layout down to the page — but it does
 * NOT deep-merge nested objects. A page that only sets `openGraph` leaves the
 * `twitter` object entirely owned by the root layout, so Twitter scrapers see
 * the homepage title/description on every subpage. This helper ensures both
 * objects are set together so per-page values always win.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  image,
  ogType = 'website',
  publishedTime,
  modifiedTime,
}: BuildPageMetadataParams): Metadata {
  const images = image ? [image] : undefined;

  const ogBase = {
    title,
    description,
    url: `${site.url}${path}`,
    ...(images && { images }),
  };

  const openGraph: Metadata['openGraph'] =
    ogType === 'article'
      ? {
          ...ogBase,
          type: 'article',
          ...(publishedTime && { publishedTime }),
          ...(modifiedTime && { modifiedTime }),
        }
      : {
          ...ogBase,
          type: 'website',
        };

  return {
    title,
    description,
    alternates: { canonical: path },
    ...(keywords && { keywords }),
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(images && { images }),
    },
  };
}
