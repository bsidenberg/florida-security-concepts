import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OperatorAnswerPage } from '@/components/OperatorAnswerPage';
import { getOperatorPage } from '@/data/operatorPages';
import { buildPageMetadata } from '@/lib/seo/metadata';

const PATH = '/service-areas/lake-county-fl';

export function generateMetadata(): Metadata {
  const page = getOperatorPage(PATH);
  if (!page) return {};
  return buildPageMetadata({
    title: page.title,
    description: page.metaDescription,
    path: page.path,
  });
}

export default function LakeCountyGateOperatorPage() {
  const page = getOperatorPage(PATH);
  if (!page) notFound();
  return <OperatorAnswerPage page={page} />;
}
