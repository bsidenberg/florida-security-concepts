import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LocalLandingView } from '@/components/LocalLandingPage';
import { getLocalLanding, landingsFor } from '@/data/localLandings';
import { buildPageMetadata } from '@/lib/seo/metadata';

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return landingsFor('gate-repair').map((landing) => ({ slug: landing.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const landing = getLocalLanding('gate-repair', (await params).slug);
  if (!landing) return {};
  return buildPageMetadata({
    title: landing.title,
    description: landing.metaDescription,
    path: landing.path,
  });
}

export default async function GateRepairAreaPage({ params }: Params) {
  const landing = getLocalLanding('gate-repair', (await params).slug);
  if (!landing) notFound();
  return <LocalLandingView landing={landing} />;
}
