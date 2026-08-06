'use client';
import { useEffect, useState } from 'react';
import { getPublishedDynamicPages } from '@/lib/firestore-service';
import type { DynamicPage } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { FileText, Home, ShoppingBag, BookOpen, Briefcase, ArrowUpRight, MapPin } from 'lucide-react';

const STATIC_ROUTES = [
  { href: '/', label: 'Home', description: 'Start here — overview of everything MMS Studio builds.', icon: Home },
  { href: '/shop', label: 'Shop', description: 'Browse and purchase apps, tools, and digital products.', icon: ShoppingBag },
  { href: '/blog', label: 'Blog', description: 'Articles, updates, and behind-the-scenes notes.', icon: BookOpen },
  { href: '/portfolio', label: 'Portfolio', description: 'A showcase of shipped apps and case studies.', icon: Briefcase },
];

export default function SitemapPage() {
  const [pages, setPages] = useState<DynamicPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublishedDynamicPages()
      .then(list => { setPages(list); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalPages = STATIC_ROUTES.length + pages.length + 1; // +1 for this page

  return (
    <div className="container mx-auto px-6 py-16 max-w-5xl">
      {/* Header */}
      <div className="mb-14 text-center md:text-left">
        <div className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-accent mb-4">
          <MapPin className="h-3.5 w-3.5" />
          Site Directory
        </div>
        <h1 className="text-4xl md:text-5xl font-['Orbitron'] font-black mb-3">Sitemap</h1>
        <p className="text-muted-foreground max-w-lg mx-auto md:mx-0">
          Every page on this site in one place — {loading ? '…' : totalPages} pages and counting.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Main Pages */}
        <section className="rounded-xl border border-border/50 bg-card/40 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
              Main Pages
            </h2>
            <span className="text-xs text-muted-foreground">{STATIC_ROUTES.length + 1}</span>
          </div>

          <ul className="divide-y divide-border/40">
            {STATIC_ROUTES.map((route) => {
              const Icon = route.icon;
              return (
                <li key={route.href}>
                  <Link
                    href={route.href}
                    className="group flex items-start gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    <span className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-accent">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                        {route.label}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {route.description}
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-accent transition-all -translate-x-1 group-hover:translate-x-0 shrink-0 mt-1.5" />
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/pages"
                className="group flex items-start gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-accent/5 transition-colors"
              >
                <span className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                    Sitemap
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    You're here — the full directory of this site.
                  </span>
                </span>
              </Link>
            </li>
          </ul>
        </section>

        {/* Dynamic Pages */}
        <section className="rounded-xl border border-border/50 bg-card/40 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
              Dynamic Pages
            </h2>
            {!loading && <span className="text-xs text-muted-foreground">{pages.length}</span>}
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : pages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No published pages yet.
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {pages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/pages/${page.slug}`}
                    className="group flex items-center gap-3 py-3 -mx-2 px-2 rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-accent">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                      {page.title}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-accent transition-all -translate-x-1 group-hover:translate-x-0 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}