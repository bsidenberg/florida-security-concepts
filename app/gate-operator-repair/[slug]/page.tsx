import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OperatorAnswerPage } from '@/components/OperatorAnswerPage';
import { gateOperatorRepairPages, getOperatorPage } from '@/data/operatorPages';
import { buildPageMetadata } from '@/lib/seo/metadata';

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return gateOperatorRepairPages().map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const page = getOperatorPage(`/gate-operator-repair/${(await params).slug}`);
  if (!page) return {};
  return buildPageMetadata({
    title: page.title,
    description: page.metaDescription,
    path: page.path,
  });
}

export default async function GateOperatorRepairPage({ params }: Params) {
  const page = getOperatorPage(`/gate-operator-repair/${(await params).slug}`);
  if (!page) notFound();
  return <OperatorAnswerPage page={page} />;
}
