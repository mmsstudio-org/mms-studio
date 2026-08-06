'use client';

import { useEffect, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { checkDynamicPageSlugUnique } from '@/lib/firestore-service';
import type { DynamicPage } from '@/lib/types';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/rich-text-editor';

const RESERVED_SLUGS = ['blog', 'dashboard', 'pages', 'shop', 'portfolio', 'login', 'api', 'admin'];

const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  slug: z
    .string()
    .min(2, { message: 'Slug must be at least 2 characters.' })
    .regex(/^[a-z0-9-]+$/, {
      message: 'Slug can only contain lowercase letters, numbers, and hyphens.',
    })
    .refine((slug) => !RESERVED_SLUGS.includes(slug), {
      message: 'This slug is reserved and cannot be used.',
    }),
  content: z.string().min(5, { message: 'Content must be at least 5 characters.' }),
  status: z.enum(['draft', 'published']),
  showInFooter: z.boolean(),
  order: z.coerce.number().min(0, { message: 'Order must be 0 or greater.' }),
  metaDescription: z.string().optional(),
});

export const RESERVED_DYNAMIC_PAGE_SLUGS = RESERVED_SLUGS;

type DynamicPageFormValues = z.infer<typeof formSchema>;

type DynamicPageFormProps = {
  initialData?: DynamicPage | null;
  onSubmit: (values: Omit<DynamicPage, 'id'>) => Promise<void>;
  isSubmitting: boolean;
  titleText: string;
  submitButtonText: string;
};

export default function DynamicPageForm({
  initialData,
  onSubmit,
  isSubmitting,
  titleText,
  submitButtonText,
}: DynamicPageFormProps) {
  const { toast } = useToast();
  const [slugConflict, setSlugConflict] = useState('');

  const form = useForm<DynamicPageFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      status: 'draft',
      showInFooter: false,
      order: 0,
      metaDescription: '',
    },
  });

  // Watch title to auto-generate slug (create mode only)
  const titleValue = form.watch('title');

  useEffect(() => {
    if (!initialData && titleValue) {
      const suggested = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      form.setValue('slug', suggested, { shouldValidate: true });
    }
  }, [titleValue, initialData, form]);

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        slug: initialData.slug,
        content: initialData.content,
        status: initialData.status,
        showInFooter: initialData.showInFooter,
        order: initialData.order,
        metaDescription: initialData.metaDescription || '',
      });
    }
  }, [initialData, form]);

  const handleFormSubmit = async (values: DynamicPageFormValues) => {
    setSlugConflict('');

    try {
      const isUnique = await checkDynamicPageSlugUnique(values.slug, initialData?.id);
      if (!isUnique) {
        setSlugConflict('This slug is already taken. Please enter a unique slug.');
        form.setError('slug', { type: 'manual', message: 'This slug is already taken.' });
        toast({ variant: 'destructive', title: 'Slug Conflict', description: 'Please use a unique slug.' });
        return;
      }

      const pagePayload: Omit<DynamicPage, 'id'> = {
        slug: values.slug,
        title: values.title,
        content: values.content,
        status: values.status,
        showInFooter: values.showInFooter,
        order: values.order,
        metaDescription: values.metaDescription || '',
        createdAt: initialData?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await onSubmit(pagePayload);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred saving the page.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard/dynamic-pages">
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
                  <FormLabel>Page Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Privacy Policy" {...field} />
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
                    <Input placeholder="e.g., privacy-policy" {...field} />
                  </FormControl>
                  <FormDescription>
                    Public URL: <code>/pages/privacy-policy</code>
                  </FormDescription>
                  {slugConflict && <p className="text-xs text-destructive mt-1">{slugConflict}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              name="showInFooter"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-2 pt-1">
                  <FormLabel>Show in Footer</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>Show link in the site footer.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Order</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormDescription>Lower numbers appear first.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="metaDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Description (SEO, Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="A short SEO description for this page..." {...field} />
                </FormControl>
                <FormDescription>Shown in search engine results and social shares.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page Content</FormLabel>
                <FormControl>
                  <RichTextEditor value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
            <Button asChild variant="outline" type="button" disabled={isSubmitting}>
              <Link href="/dashboard/dynamic-pages">Cancel</Link>
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
