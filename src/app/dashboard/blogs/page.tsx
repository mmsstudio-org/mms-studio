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
import { getBlogs, deleteBlog, updateBlog } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Search, PlusCircle, Trash2, Pencil, Globe, FileText, Eye } from 'lucide-react';
import { ConfirmationDialog } from '../purchases/_components/confirmation-dialog';
import Link from 'next/link';

export default function DashboardBlogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirmation state
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);

  const fetchBlogs = useCallback(async () => {
    setLoadingData(true);
    try {
      const fetchedBlogs = await getBlogs();
      setBlogs(fetchedBlogs);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch blogs.' });
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchBlogs();
    }
  }, [user, authLoading, router, fetchBlogs]);

  const handleDeleteClick = (blog: Blog) => {
    setBlogToDelete(blog);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!blogToDelete || !blogToDelete.id) return;
    try {
      await deleteBlog(blogToDelete.id);
      toast({ title: 'Success', description: 'Blog post deleted successfully.' });
      fetchBlogs();
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
      fetchBlogs();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to toggle status.' });
    }
  };

  const filteredBlogs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return blogs;
    return blogs.filter(b => 
      b.title.toLowerCase().includes(query) || 
      b.author.toLowerCase().includes(query) ||
      (b.tags && b.tags.some(t => t.toLowerCase().includes(query)))
    );
  }, [blogs, searchQuery]);

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
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by title, author, or tags..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
          ) : filteredBlogs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No blog posts found.
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
                  {filteredBlogs.map((blog) => {
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
