import { notFound } from 'next/navigation';
import { getBlogBySlug } from '@/lib/firestore-service';
import BlogPostClient from './_components/blog-post-client';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return {
      title: 'Post Not Found',
    };
  }

  const title = blog.title;
  const cleanExcerpt = blog.excerpt || (blog.content ? blog.content.replace(/<[^>]*>/g, '').substring(0, 160) : '');
  const description = cleanExcerpt || 'Blog post on MMS Studio';
  
  // Clean cover image url (or fallback)
  const imageUrl = blog.coverImageUrl || '/og-image.png';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mms-studio.org';
  const url = `${appUrl}/blog/${slug}`;

  // If draft, prevent search engine indexing
  const isDraft = blog.status === 'draft';

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
      type: 'article',
      publishedTime: new Date(blog.publishedAt).toISOString(),
      modifiedTime: new Date(blog.updatedAt || blog.publishedAt).toISOString(),
      authors: [blog.author],
      tags: blog.tags || [],
      images: [
        {
          url: imageUrl,
          alt: title,
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

export default async function BlogPostPage({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  return <BlogPostClient initialBlog={blog} />;
}
