import { notFound } from 'next/navigation';
import { getPortfolioProjectBySlug } from '@/lib/firestore-service';
import PortfolioDetailClient from './_components/portfolio-detail-client';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const project = await getPortfolioProjectBySlug(slug);

  if (!project) {
    return {
      title: 'Project Not Found',
    };
  }

  const title = `${project.title} | Portfolio | MMS Studio`;
  const description = project.shortDescription || 'Portfolio project on MMS Studio';
  const imageUrl = project.coverImageUrl || '/og-image.png';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mms-studio.org';
  const url = `${appUrl}/portfolio/${slug}`;

  const isDraft = project.status === 'draft';

  return {
    title: title,
    description: description,
    alternates: {
      canonical: url,
    },
    robots: {
      index: !isDraft,
      follow: !isDraft,
      googleBot: {
        index: !isDraft,
        follow: !isDraft,
      },
    },
    openGraph: {
      title: title,
      description: description,
      url: url,
      type: 'website',
      siteName: 'MMS Studio Portfolio',
      images: [
        {
          url: imageUrl,
          alt: project.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
  };
}

export default async function PortfolioDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const project = await getPortfolioProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mms-studio.org';
  const canonicalUrl = `${appUrl}/portfolio/${slug}`;

  // Structured Data (JSON-LD)
  const isApp = project.projectType === 'app';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': isApp ? 'SoftwareApplication' : 'CreativeWork',
    name: project.title,
    description: project.shortDescription || '',
    image: project.coverImageUrl,
    url: canonicalUrl,
    dateCreated: new Date(project.createdAt).toISOString(),
    datePublished: new Date(project.publishedAt).toISOString(),
    ...(isApp ? {
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Android, iOS, Web',
    } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PortfolioDetailClient project={project} />
    </>
  );
}
