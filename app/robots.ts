import { isHostedPreview } from '@/lib/leads/environment';
import type { MetadataRoute } from 'next';
import { CANONICAL_ORIGIN } from '@/lib/seo/canonical';

export default function robots(): MetadataRoute.Robots {
  if (process.env.FSC_LOCAL_PREVIEW === '1' || isHostedPreview()) return { rules: [{userAgent:'*', disallow:'/'}] };
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
    host: CANONICAL_ORIGIN,
  };
}
