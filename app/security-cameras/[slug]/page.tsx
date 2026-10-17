import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LocalLandingView } from '@/components/LocalLandingPage';
import { getLocalLanding, landingsFor } from '@/data/localLandings';
import { buildPageMetadata } from '@/lib/seo/metadata';

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return landingsFor('security-cameras').map((landing) => ({ slug: landing.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const landing = getLocalLanding('security-cameras', (await params).slug);
  if (!landing) return {};
  return buildPageMetadata({
    title: landing.title,
    description: landing.metaDescription,
    path: landing.path,
  });
}

export default async function SecurityCamerasAreaPage({ params }: Params) {
  const landing = getLocalLanding('security-cameras', (await params).slug);
  if (!landing) notFound();
  return <LocalLandingView landing={landing} />;
}
