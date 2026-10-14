import type { MetadataRoute } from 'next';
import { services } from '@/data/services';
import { industries } from '@/data/industries';
import { locations } from '@/data/locations';
import { resources } from '@/data/resources';
import { localLandings } from '@/data/localLandings';
import { canonicalUrl } from '@/lib/seo/canonical';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    '',
    '/services',
    '/industries',
    '/service-areas',
    '/resources',
    '/contact',
    '/privacy',
    '/terms',
    '/sms-consent',
  ];

  const entries: MetadataRoute.Sitemap = [
    ...staticRoutes.map((path) => ({
      url: canonicalUrl(path || '/'),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.8,
    })),
    ...services.map((s) => ({
      url: canonicalUrl(`/services/${s.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    })),
    ...industries.map((i) => ({
      url: canonicalUrl(`/industries/${i.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    ...locations.map((l) => ({
      url: canonicalUrl(`/service-areas/${l.slug}`),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...localLandings.map((landing) => ({
      url: canonicalUrl(landing.path),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...resources.map((r) => ({
      url: canonicalUrl(`/resources/${r.slug}`),
      lastModified: new Date(r.updatedDate),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  return entries;
}
