'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Blog } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/rich-text-editor';
import { checkSlugUnique } from '@/lib/firestore-service';

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

const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  slug: z.string().min(3, { message: 'Slug must be at least 3 characters.' }),
  coverImageUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  content: z.string().min(5, { message: 'Content must be at least 5 characters.' }),
  excerpt: z.string().optional(),
  author: z.string().min(1, { message: 'Author is required.' }),
  status: z.enum(['draft', 'published']),
  publishedAt: z.string().min(1, { message: 'Publish date is required.' }),
  tags: z.string().optional(),
});

type BlogFormProps = {
  initialData?: Blog | null;
  onSubmit: (values: Blog) => Promise<void>;
  isSubmitting: boolean;
  titleText: string;
  submitButtonText: string;
  defaultAuthor?: string;
};

export default function BlogForm({
  initialData,
  onSubmit,
  isSubmitting,
  titleText,
  submitButtonText,
  defaultAuthor = 'Admin',
}: BlogFormProps) {
  const { toast } = useToast();
  const [slugConflict, setSlugConflict] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      coverImageUrl: '',
      content: '',
      excerpt: '',
      author: defaultAuthor,
      status: 'draft',
      publishedAt: msToDateTimeLocal(Date.now()),
      tags: '',
    },
  });

  // Watch title to generate slug
  const titleValue = form.watch('title');
  const slugValue = form.watch('slug');

  // Trigger slug auto-generation on title change
  useEffect(() => {
    if (!initialData && titleValue) {
      const suggested = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      form.setValue('slug', suggested, { shouldValidate: true });
    }
  }, [titleValue, initialData, form]);

  // Load initialData when editing
  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        slug: initialData.slug,
        coverImageUrl: initialData.coverImageUrl || '',
        content: initialData.content,
        excerpt: initialData.excerpt || '',
        author: initialData.author,
        status: initialData.status,
        publishedAt: msToDateTimeLocal(initialData.publishedAt),
        tags: initialData.tags?.join(', ') || '',
      });
    }
  }, [initialData, form]);

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    setSlugConflict('');
    
    // Check unique slug
    try {
      const isUnique = await checkSlugUnique(values.slug, initialData?.id);
      if (!isUnique) {
        setSlugConflict('This slug is already taken. Please enter a unique slug.');
        form.setError('slug', { type: 'manual', message: 'This slug is already taken.' });
        toast({ variant: 'destructive', title: 'Slug conflict', description: 'Please use a unique slug.' });
        return;
      }

      const tagsArray = values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
        : [];

      const blogPayload: Blog = {
        ...(initialData ? { id: initialData.id } : {}),
        title: values.title,
        slug: values.slug,
        coverImageUrl: values.coverImageUrl || '',
        content: values.content,
        excerpt: values.excerpt || '',
        author: values.author,
        status: values.status,
        publishedAt: dateTimeLocalToMs(values.publishedAt),
        createdAt: initialData?.createdAt || Date.now(),
        updatedAt: Date.now(),
        tags: tagsArray,
      };

      await onSubmit(blogPayload);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred saving the blog post.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard/blogs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold font-['Orbitron']">{titleText}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 bg-card border border-border/50 rounded-xl p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Post title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL Path)</FormLabel>
                  <FormControl>
                    <Input placeholder="url-slug-here" {...field} />
                  </FormControl>
                  {slugConflict && <p className="text-xs text-destructive mt-1">{slugConflict}</p>}
                  <FormDescription>Must be unique, url-friendly characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="coverImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/cover.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Author..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="draft">Draft (Admin Only)</option>
                    <option value="published">Published (Public)</option>
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publishedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Publish Date/Time (BDT)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>Set a date/time to control display order or scheduling.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="excerpt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Excerpt (Summary for cards)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Short overview..." rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (Comma-separated)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. nextjs, react, database" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Article Content</FormLabel>
                <FormControl>
                  <RichTextEditor value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
            <Button asChild variant="outline" type="button" disabled={isSubmitting}>
              <Link href="/dashboard/blogs">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> {submitButtonText}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
