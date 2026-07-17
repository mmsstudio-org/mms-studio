'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import type { Blog } from '@/lib/types';
import { getBlogBySlug, updateBlog, deleteBlog, checkSlugUnique } from '@/lib/firestore-service';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import DOMPurify from 'isomorphic-dompurify';
import {
  Calendar, User, Pencil, Save, X, Trash2, ArrowLeft, Eye, ShieldAlert,
  Loader2, Globe, FileText, Tags
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import RichTextEditor from '@/components/rich-text-editor';

// Helper to convert unix ms timestamp to datetime-local string (local time)
function msToDateTimeLocal(ms: number): string {
  const date = new Date(ms);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

// Helper to convert datetime-local string to unix ms timestamp
function dateTimeLocalToMs(dateTimeStr: string): number {
  return new Date(dateTimeStr).getTime();
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [blogFound, setBlogFound] = useState<boolean | null>(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editStatus, setEditStatus] = useState<'draft' | 'published'>('draft');
  const [editPublishedAt, setEditPublishedAt] = useState('');
  const [editTags, setEditTags] = useState('');

  // Submit states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [slugError, setSlugError] = useState('');

  const fetchPost = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedBlog = await getBlogBySlug(slug);
      if (fetchedBlog) {
        // If not admin and it is a draft, treat as not found
        if (fetchedBlog.status === 'draft' && !user) {
          setBlogFound(false);
        } else {
          setBlog(fetchedBlog);
          setBlogFound(true);
          // Initialize edit form
          setEditTitle(fetchedBlog.title);
          setEditSlug(fetchedBlog.slug);
          setEditCoverUrl(fetchedBlog.coverImageUrl || '');
          setEditContent(fetchedBlog.content);
          setEditExcerpt(fetchedBlog.excerpt || '');
          setEditAuthor(fetchedBlog.author);
          setEditStatus(fetchedBlog.status);
          setEditPublishedAt(msToDateTimeLocal(fetchedBlog.publishedAt));
          setEditTags(fetchedBlog.tags?.join(', ') || '');
        }
      } else {
        setBlogFound(false);
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
      setBlogFound(false);
    } finally {
      setLoading(false);
    }
  }, [slug, user]);

  useEffect(() => {
    fetchPost();
  }, [slug, fetchPost]);

  // Handle title change to auto-suggest slug
  const handleTitleChange = (val: string) => {
    setEditTitle(val);
    if (!blog) return;
    // Suggest slug if we are editing and slug is empty or matches previous auto-slug
    const suggested = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setEditSlug(suggested);
  };

  const handleSave = async () => {
    if (!blog || !blog.id) return;
    setSlugError('');

    // Validations
    if (!editTitle.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Title is required.' });
      return;
    }
    if (!editSlug.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Slug is required.' });
      return;
    }
    if (!editContent.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Content is required.' });
      return;
    }
    if (!editAuthor.trim()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Author is required.' });
      return;
    }

    setIsSaving(true);
    try {
      // Validate slug uniqueness
      const isUnique = await checkSlugUnique(editSlug, blog.id);
      if (!isUnique) {
        setSlugError('This slug is already taken. Please enter a unique slug.');
        toast({ variant: 'destructive', title: 'Slug Conflict', description: 'Slug must be unique.' });
        setIsSaving(false);
        return;
      }

      const tagsArray = editTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const updateData: Partial<Omit<Blog, 'id'>> = {
        title: editTitle,
        slug: editSlug,
        coverImageUrl: editCoverUrl || '',
        content: editContent,
        excerpt: editExcerpt || '',
        author: editAuthor,
        status: editStatus,
        publishedAt: dateTimeLocalToMs(editPublishedAt),
        updatedAt: Date.now(),
        tags: tagsArray,
      };

      await updateBlog(blog.id, updateData);
      toast({ title: 'Success', description: 'Blog post updated successfully.' });

      // Refresh post
      setIsEditing(false);
      
      // If slug changed, redirect to new URL
      if (editSlug !== blog.slug) {
        router.push(`/blog/${editSlug}`);
      } else {
        fetchPost();
      }
    } catch (error) {
      console.error('Error updating blog:', error);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'An unexpected error occurred.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!blog || !blog.id) return;
    if (!window.confirm(`Are you sure you want to delete the blog post "${blog.title}"? This action is permanent.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBlog(blog.id);
      toast({ title: 'Success', description: 'Blog post deleted successfully.' });
      router.push('/blog');
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'An unexpected error occurred.' });
      setIsDeleting(false);
    }
  };

  if (blogFound === false) {
    notFound();
  }

  if (loading || !blog) {
    return (
      <div className="container mx-auto py-10 max-w-4xl px-4">
        <Skeleton className="h-6 w-24 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/4 mb-8" />
        <Skeleton className="w-full aspect-video rounded-lg mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  // Sanitized view content
  const sanitizedContent = DOMPurify.sanitize(blog.content, { ADD_ATTR: ['style'] });

  return (
    <div className="container mx-auto py-10 max-w-4xl px-4">
      {/* Admin Action Banner */}
      {user && (
        <div className="mb-8 p-4 rounded-lg bg-card/60 backdrop-blur-sm border border-primary/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-accent animate-pulse" />
            <span className="text-sm font-semibold">Admin Mode</span>
            {blog.status === 'draft' && (
              <Badge variant="destructive">Draft Mode (Hidden from public)</Badge>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit Post
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Editor View */}
      {isEditing ? (
        <div className="space-y-6 bg-card/40 border border-border/50 rounded-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold font-['Orbitron'] border-b border-border/50 pb-3">Edit Post Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Blog Title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Slug (URL Route)</label>
              <Input
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                placeholder="blog-slug-url"
              />
              {slugError && <p className="text-xs text-destructive mt-1">{slugError}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Cover Image URL</label>
              <Input
                value={editCoverUrl}
                onChange={(e) => setEditCoverUrl(e.target.value)}
                placeholder="https://example.com/cover-image.jpg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Author Name</label>
              <Input
                value={editAuthor}
                onChange={(e) => setEditAuthor(e.target.value)}
                placeholder="Author"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as 'draft' | 'published')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="draft">Draft (Admin Only)</option>
                <option value="published">Published (Public)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Publish Date/Time (BDT)</label>
              <Input
                type="datetime-local"
                value={editPublishedAt}
                onChange={(e) => setEditPublishedAt(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Excerpt (Short description for listing cards)</label>
            <Textarea
              value={editExcerpt}
              onChange={(e) => setEditExcerpt(e.target.value)}
              placeholder="Short summary of the article..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Tags (comma-separated)</label>
            <Input
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="nextjs, react, databases"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Article Content</label>
            <RichTextEditor value={editContent} onChange={setEditContent} />
          </div>

          <div className="pt-4 border-t border-border/50 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Post
            </Button>
          </div>
        </div>
      ) : (
        /* Static Public View */
        <article className="space-y-8">
          {/* Back Button */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to blog list
          </Link>

          {/* Title & Metadata */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-['Orbitron'] font-black leading-tight tracking-tight text-foreground">
              {blog.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-accent" />
                {format(new Date(blog.publishedAt), 'MMMM dd, yyyy')}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-accent" />
                {blog.author}
              </span>
            </div>
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {blog.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-primary/10 border-primary/20 text-accent-foreground text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Cover Image */}
          {blog.coverImageUrl && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border/50 shadow-md">
              <Image
                src={blog.coverImageUrl}
                alt={blog.title}
                fill
                sizes="(max-width: 1200px) 100vw, 800px"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Excerpt */}
          {blog.excerpt && (
            <div className="p-4 border-l-4 border-accent bg-accent/5 rounded-r-lg">
              <p className="text-base text-foreground font-medium leading-relaxed italic">{blog.excerpt}</p>
            </div>
          )}

          {/* Content */}
          <div
            className="blog-content w-full"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </article>
      )}
    </div>
  );
}
