import { notFound } from 'next/navigation';
import { getDynamicPageBySlug } from '@/lib/firestore-service';
import type { DynamicPage } from '@/lib/types';
import type { Metadata } from 'next';
import DynamicPageClient from './_components/dynamic-page-client';

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60; // ISR: revalidate at most once per minute

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const page = await getDynamicPageBySlug(slug);

  if (!page || page.status !== 'published') {
    return { title: 'Page Not Found' };
  }

  const title = page.title;
  const description = page.metaDescription || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mmsstudio-org.github.io';
  const url = `${appUrl}/pages/${slug}`;

  return {
    title: title,
    description: description || undefined,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      title: title,
      description: description || undefined,
      url: url,
      type: 'website',
      images: [{ url: '/og-image.png', alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description || undefined,
      images: ['/og-image.png'],
    },
  };
}

export default async function DynamicPagePublic({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const page = await getDynamicPageBySlug(slug);

  if (!page || page.status !== 'published') {
    notFound();
  }

  return <DynamicPageClient page={page} />;
}
