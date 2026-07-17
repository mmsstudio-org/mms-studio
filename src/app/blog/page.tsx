'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getPublishedBlogs } from '@/lib/firestore-service';
import type { Blog } from '@/lib/types';
import { format } from 'date-fns';
import { BookOpen, Calendar, ArrowRight, User } from 'lucide-react';

export default function BlogListingPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const fetchedBlogs = await getPublishedBlogs();
        setBlogs(fetchedBlogs);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  const visibleBlogs = useMemo(() => {
    return blogs.slice(0, visibleCount);
  }, [blogs, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 9);
  };

  return (
    <div className="container mx-auto py-10 px-4">
      {/* Page Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-['Orbitron'] font-black mb-4">
          <span className="gradient-text">MMS Studio Blog</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Insights, updates, and tutorials on web & mobile development, digital assets, and next-gen tech.
        </p>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="flex flex-col h-[400px]">
              <Skeleton className="w-full aspect-video rounded-t-lg" />
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2 flex-grow">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-28" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        // Empty State
        <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card/20 border-border/50 max-w-lg mx-auto">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold">No articles found</h3>
          <p className="text-muted-foreground mt-2">
            Check back later for exciting new content.
          </p>
        </div>
      ) : (
        // Blog Grid
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {visibleBlogs.map((blog) => {
              const formattedDate = format(new Date(blog.publishedAt), 'MMM dd, yyyy');
              return (
                <Card
                  key={blog.id}
                  className="flex flex-col overflow-hidden transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1 h-full"
                >
                  {blog.coverImageUrl && (
                    <div className="relative w-full aspect-video">
                      <Image
                        src={blog.coverImageUrl}
                        alt={blog.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover animate-fade-in"
                        priority={false}
                      />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formattedDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {blog.author}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2 text-xl font-bold leading-snug hover:text-accent transition-colors">
                      <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow pb-4">
                    <CardDescription className="line-clamp-3 text-muted-foreground text-sm leading-relaxed">
                      {blog.excerpt || (blog.content ? blog.content.replace(/<[^>]*>/g, '').slice(0, 150) + '...' : '')}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button asChild variant="ghost" className="p-0 text-accent hover:text-accent/80 hover:bg-transparent">
                      <Link href={`/blog/${blog.slug}`} className="flex items-center gap-2 font-semibold">
                        Read Article
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Load More Button */}
          {blogs.length > visibleCount && (
            <div className="flex justify-center mt-12">
              <Button onClick={handleLoadMore} variant="outline" size="lg">
                Load More Articles
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
