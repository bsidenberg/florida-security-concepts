import type { MetadataRoute } from 'next';
import { services } from '@/data/services';
import { industries } from '@/data/industries';
import { locations } from '@/data/locations';
import { resources } from '@/data/resources';
import { site } from '@/data/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    '',
    '/services',
    '/industries',
    '/service-areas',
    '/resources',
    '/contact',
  ];

  const entries: MetadataRoute.Sitemap = [
    ...staticRoutes.map((path) => ({
      url: `${site.url}${path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.8,
    })),
    ...services.map((s) => ({
      url: `${site.url}/services/${s.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    })),
    ...industries.map((i) => ({
      url: `${site.url}/industries/${i.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
    ...locations.map((l) => ({
      url: `${site.url}/service-areas/${l.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...resources.map((r) => ({
      url: `${site.url}/resources/${r.slug}`,
      lastModified: new Date(r.updatedDate),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  return entries;
}
