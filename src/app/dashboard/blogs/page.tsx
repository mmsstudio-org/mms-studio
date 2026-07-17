'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Blog } from '@/lib/types';
import { getBlogsPaginated, deleteBlog, updateBlog } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Search, PlusCircle, Trash2, Pencil, Globe, FileText, Eye, Loader2 } from 'lucide-react';
import { ConfirmationDialog } from '../purchases/_components/confirmation-dialog';
import Link from 'next/link';

export default function DashboardBlogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Delete confirmation state
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);

  const loadInitialBlogs = useCallback(async (queryStr: string) => {
    setLoadingData(true);
    try {
      const { blogs: initialBlogs, lastDoc: cursor } = await getBlogsPaginated(50, null, queryStr);
      setBlogs(initialBlogs);
      setLastDoc(cursor);
      setHasMore(initialBlogs.length === 50);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch blogs.' });
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, [toast]);

  const loadMoreBlogs = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      const { blogs: nextBlogs, lastDoc: cursor } = await getBlogsPaginated(50, lastDoc, activeSearch);
      if (nextBlogs.length > 0) {
        setBlogs((prev) => [...prev, ...nextBlogs]);
        setLastDoc(cursor);
        setHasMore(nextBlogs.length === 50);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more blogs:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc, activeSearch]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      loadInitialBlogs('');
    }
  }, [user, authLoading, router, loadInitialBlogs]);

  // Infinite Scroll event handler
  useEffect(() => {
    const handleScroll = () => {
      if (authLoading || !user || loadingData || loadingMore || !hasMore) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      if (docHeight - (scrollTop + windowHeight) < 200) {
        loadMoreBlogs();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [authLoading, user, loadingData, loadingMore, hasMore, loadMoreBlogs]);

  const handleDeleteClick = (blog: Blog) => {
    setBlogToDelete(blog);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!blogToDelete || !blogToDelete.id) return;
    try {
      await deleteBlog(blogToDelete.id);
      toast({ title: 'Success', description: 'Blog post deleted successfully.' });
      loadInitialBlogs(activeSearch);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete blog post.' });
    }
    setBlogToDelete(null);
  };

  const toggleStatus = async (blog: Blog) => {
    if (!blog.id) return;
    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    try {
      await updateBlog(blog.id, { status: newStatus, updatedAt: Date.now() });
      toast({ title: 'Success', description: `Blog post changed to ${newStatus}.` });
      loadInitialBlogs(activeSearch);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to toggle status.' });
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    await loadInitialBlogs(searchQuery);
  };

  const handleClearSearch = async () => {
    setSearchQuery('');
    setActiveSearch('');
    await loadInitialBlogs('');
  };

  if (authLoading || !user) {
    return (
      <div className="container py-10 text-center">
        <Skeleton className="h-10 w-48 mx-auto mb-4" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
    );
  }

  return (
    <div className="container py-10 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold font-['Orbitron']">Manage Blogs</h1>
          <p className="text-muted-foreground">Publish and manage news, tutorials, and posts.</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/blogs/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Post
          </Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full max-w-md">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search article titles..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm">Search</Button>
            {activeSearch && (
              <Button type="button" variant="outline" size="sm" onClick={handleClearSearch}>Clear</Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loadingData ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {activeSearch ? `No search results for "${activeSearch}".` : "No blog posts found."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Publish Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogs.map((blog) => {
                    const formattedDate = format(new Date(blog.publishedAt), 'dd MMM yyyy, hh:mm a');
                    return (
                      <TableRow key={blog.id}>
                        <TableCell className="font-semibold max-w-[300px] truncate">
                          {blog.title}
                        </TableCell>
                        <TableCell>{blog.author}</TableCell>
                        <TableCell>
                          <Badge
                            variant={blog.status === 'published' ? 'default' : 'secondary'}
                            className="cursor-pointer hover:opacity-80"
                            onClick={() => toggleStatus(blog)}
                          >
                            {blog.status === 'published' ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formattedDate}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="outline" size="icon" title="View Article">
                              <Link href={`/blog/${blog.slug}`} target="_blank">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button asChild variant="outline" size="icon" title="Edit Post">
                              <Link href={`/dashboard/blogs/${blog.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(blog)} title="Delete Post">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading More Spinner for Infinite Scroll */}
      {loadingMore && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 text-accent animate-spin" />
        </div>
      )}

      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="Delete Blog Post"
        description={
          blogToDelete ? (
            <span>
              Are you sure you want to delete <strong>"{blogToDelete.title}"</strong>? This will permanently remove this post and cannot be undone.
            </span>
          ) : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
