'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/hooks/use-toast';
import { addApp, checkCategorySlugUnique } from '@/lib/firestore-service';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const youtubeIdOrUrlSchema = z.string().optional().refine(val => {
    if (!val) return true;
    if (youtubeRegex.test(val)) return true;
    if (val.length === 11 && /^[a-zA-Z0-9_-]+$/.test(val)) return true;
    return false;
}, {
    message: "Please enter a valid YouTube video URL or Video ID."
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
});

export default function NewCategoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugConflict, setSlugConflict] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      icon: '',
      youtubeVideoUrl: '',
      pkg: '',
    },
  });

  const nameValue = form.watch('name');

  const slugManuallyEdited = useRef(false);

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // Auto-generate slug from name (unless manually edited)
  useEffect(() => {
    if (nameValue && !slugManuallyEdited.current) {
      form.setValue('slug', generateSlug(nameValue), { shouldValidate: true });
    }
  }, [nameValue, form]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  function getYouTubeVideoId(urlOrId: string): string {
    if (!urlOrId) return "";
    const match = urlOrId.match(youtubeRegex);
    if (match && match[1]) {
      return match[1];
    }
    if (urlOrId.length === 11 && /^[a-zA-Z0-9_-]+$/.test(urlOrId)) {
        return urlOrId;
    }
    return "";
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setSlugConflict('');

    try {
      // Validate unique slug
      const isUnique = await checkCategorySlugUnique(values.slug);
      if (!isUnique) {
        setSlugConflict('This slug is already taken. Please enter a unique slug.');
        form.setError('slug', { type: 'manual', message: 'This slug is already taken.' });
        toast({ variant: 'destructive', title: 'Slug conflict', description: 'Please use a unique slug.' });
        setIsSubmitting(false);
        return;
      }

      const videoId = getYouTubeVideoId(values.youtubeVideoUrl || "");
      const appData = {
        name: values.name,
        slug: values.slug,
        description: values.description || "",
        icon: values.icon || "",
        youtubeVideoId: videoId,
        pkg: values.pkg || "",
      };

      await addApp(appData);
      toast({ title: 'Success', description: 'Category created successfully.' });
      router.push('/dashboard/categories');
    } catch (error) {
      console.error("Error creating category:", error);
      toast({ variant: 'destructive', title: 'Create Failed', description: 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="container py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="container py-10 px-4 max-w-2xl">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/categories" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Categories
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-['Orbitron']">Create New Category</CardTitle>
          <CardDescription>Add a new app category and set up its global configurations.</CardDescription>
        </CardHeader>
        <CardContent>
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
                      <Input placeholder="e.g., bnc-status-app" {...field} onChange={(e) => {
                        slugManuallyEdited.current = true;
                        field.onChange(e);
                      }} />
                    </FormControl>
                    <FormDescription>
                      The slug is used for the public URL path (e.g. <code>/shop/bnc-status-app</code>).
                    </FormDescription>
                    <FormMessage />
                    {slugConflict && <p className="text-sm font-medium text-destructive mt-1">{slugConflict}</p>}
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
                      <Input placeholder="e.g., Smartphone or https://example.com/icon.png" {...field} />
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
                  Create Category
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
