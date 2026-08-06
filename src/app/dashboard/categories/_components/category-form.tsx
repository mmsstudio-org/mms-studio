'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addApp, updateApp, checkCategorySlugUnique } from '@/lib/firestore-service';
import { convertDriveUrl } from '@/app/dashboard/blogs/_components/blog-form';
import type { AppDetail } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const youtubeIdOrUrlSchema = z.string().optional().refine(val => {
  if (!val) return true;
  if (youtubeRegex.test(val)) return true;
  if (val.length === 11 && /^[a-zA-Z0-9_-]+$/.test(val)) return true;
  return false;
}, {
  message: 'Please enter a valid YouTube video URL or Video ID.',
});

const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  slug: z.string().min(2, { message: 'Slug must be at least 2 characters.' }).regex(/^[a-z0-9-]+$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens.',
  }),
  description: z.string().optional(),
  icon: z.union([z.string().url(), z.string().length(0), z.string().refine(s => !s.startsWith('http'))]).optional(),
  youtubeVideoUrl: youtubeIdOrUrlSchema,
  pkg: z.string().optional(),
  // Optional App URL — must be a valid URL if provided
  appUrl: z.union([
    z.string().url({ message: 'Please enter a valid URL (e.g., https://play.google.com/store/apps/details?id=...).' }),
    z.string().length(0),
  ]).optional(),
});

type CategoryFormValues = z.infer<typeof formSchema>;

type CategoryFormProps = {
  mode: 'create' | 'edit';
  /** Category ID when editing (used for slug uniqueness check) */
  categoryId?: string;
  /** Initial data to populate the form (edit mode) */
  initialData?: Partial<AppDetail> | null;
  /** Called after successful save (e.g., to refetch data) */
  onSuccess?: () => void;
  submitLabel: string;
};

export default function CategoryForm({
  mode,
  categoryId,
  initialData,
  onSuccess,
  submitLabel,
}: CategoryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugConflict, setSlugConflict] = useState('');

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      icon: '',
      youtubeVideoUrl: '',
      pkg: '',
      appUrl: '',
    },
  });

  const nameValue = form.watch('name');
  const slugManuallyEdited = useRef(false);

  // Auto-generate slug from name on create mode (unless manually edited)
  useEffect(() => {
    if (mode === 'create' && nameValue && !slugManuallyEdited.current) {
      form.setValue('slug', generateSlug(nameValue), { shouldValidate: true });
    }
  }, [nameValue, form, mode]);

  // Populate form with initial data (edit mode)
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      form.reset({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        icon: initialData.icon || '',
        youtubeVideoUrl: initialData.youtubeVideoId || '',
        pkg: initialData.pkg || '',
        appUrl: initialData.appUrl || '',
      });
    }
  }, [mode, initialData, form]);

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function getYouTubeVideoId(urlOrId: string): string {
    if (!urlOrId) return '';
    const match = urlOrId.match(youtubeRegex);
    if (match && match[1]) {
      return match[1];
    }
    if (urlOrId.length === 11 && /^[a-zA-Z0-9_-]+$/.test(urlOrId)) {
      return urlOrId;
    }
    return '';
  }

  async function onSubmit(values: CategoryFormValues) {
    setIsSubmitting(true);
    setSlugConflict('');

    try {
      // Validate unique slug (skip current category when editing)
      const isUnique = await checkCategorySlugUnique(values.slug, categoryId);
      if (!isUnique) {
        setSlugConflict('This slug is already taken. Please enter a unique slug.');
        form.setError('slug', { type: 'manual', message: 'This slug is already taken.' });
        toast({ variant: 'destructive', title: 'Slug conflict', description: 'Please use a unique slug.' });
        setIsSubmitting(false);
        return;
      }

      const videoId = getYouTubeVideoId(values.youtubeVideoUrl || '');
      const appData = {
        name: values.name,
        slug: values.slug,
        description: values.description || '',
        icon: values.icon || '',
        youtubeVideoId: videoId,
        pkg: values.pkg || '',
        appUrl: values.appUrl || '',
      };

      if (mode === 'edit' && categoryId) {
        await updateApp(categoryId, appData);
        toast({ title: 'Success', description: 'Category updated successfully.' });
        onSuccess?.();
      } else {
        await addApp(appData);
        toast({ title: 'Success', description: 'Category created successfully.' });
        router.push('/dashboard/categories');
      }
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} category:`, error);
      toast({
        variant: 'destructive',
        title: mode === 'edit' ? 'Update Failed' : 'Create Failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., BNC Status App" {...field} />
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
                <Input
                  placeholder="e.g., bnc-status-app"
                  {...field}
                  onChange={(e) => {
                    slugManuallyEdited.current = true;
                    field.onChange(e);
                  }}
                />
              </FormControl>
              <FormDescription>
                The slug is used for the public URL path (e.g. <code>/shop/bnc-status-app</code>).
              </FormDescription>
              <FormMessage />
              {slugConflict && (
                <p className="text-sm font-medium text-destructive mt-1">{slugConflict}</p>
              )}
            </FormItem>
          )}
        />

        {/* NEW: App URL (Optional) */}
        <FormField
          control={form.control}
          name="appUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>App URL (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="e.g., https://play.google.com/store/apps/details?id=com.example.app"
                  {...field}
                  onChange={(e) => field.onChange(convertDriveUrl(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                If set, a "Visit App" button will appear on the shop page so users can directly visit the app.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe this category..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon (Lucide name or URL)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Smartphone or https://example.com/icon.png"
                  {...field}
                  onChange={(e) => field.onChange(convertDriveUrl(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pkg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Package Name (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., com.example.app" {...field} />
              </FormControl>
              <FormDescription>
                If set, coupons from this category will require this package name for redemption.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="youtubeVideoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tutorial Video (YouTube URL or ID)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., https://www.youtube.com/watch?v=..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}