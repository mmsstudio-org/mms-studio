'use client';
import { useAuth } from '@/hooks/use-auth';
import DOMPurify from 'isomorphic-dompurify';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3, Pencil } from 'lucide-react';
import Link from 'next/link';
import type { DynamicPage } from '@/lib/types';

interface Props { page: DynamicPage; }

export default function DynamicPageClient({ page }: Props) {
  const { user } = useAuth();
  const sanitized = DOMPurify.sanitize(page.content, { ADD_ATTR: ['style'] });
  return (
    <div className="container mx-auto py-12 px-4">
      {user && (
        <div className="mb-8 p-4 rounded-lg bg-card/60 backdrop-blur-sm border border-primary/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-accent" />
            <span className="text-sm font-semibold">Admin Mode</span>
            {page.status === 'draft' && <Badge variant="destructive">Draft Mode</Badge>}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/dynamic-pages/${page.id}`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit in Dashboard
            </Link>
          </Button>
        </div>
      )}
      <article className="prose dark:prose-invert max-w-none blog-content">
        <h1 className="text-4xl md:text-5xl font-['Orbitron'] font-black leading-tight tracking-tight text-foreground mb-6">{page.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: sanitized }} />
      </article>
    </div>
  );
}
