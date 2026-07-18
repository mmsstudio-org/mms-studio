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
import type { PortfolioProject } from '@/lib/types';
import { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowLeft, Save, Plus, Trash } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/rich-text-editor';
import { checkPortfolioSlugUnique } from '@/lib/firestore-service';
import { convertDriveUrl } from '@/app/dashboard/blogs/_components/blog-form';

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

// Helper to generate shortDescription by stripping HTML and truncating at nearest whole word
function generateShortDescription(htmlDescription: string): string {
  // Strip all HTML tags
  let plainText = htmlDescription.replace(/<[^>]*>/g, '');
  // Collapse whitespace/newlines into single spaces
  plainText = plainText.replace(/\s+/g, ' ').trim();
  
  if (plainText.length <= 155) {
    return plainText;
  }
  
  // Truncate to ~155 characters
  let truncated = plainText.substring(0, 155);
  
  // Cut at nearest whole word
  const lastSpaceIdx = truncated.lastIndexOf(' ');
  if (lastSpaceIdx > 0) {
    truncated = truncated.substring(0, lastSpaceIdx);
  }
  
  return truncated.trim() + '…';
}

const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  slug: z.string().min(3, { message: 'Slug must be at least 3 characters.' }),
  shortDescription: z.string()
    .optional()
    .or(z.literal('')),
  coverImageUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  description: z.string().min(5, { message: 'Description must be at least 5 characters.' }),
  projectType: z.enum(['app', 'web', 'both', 'other']),
  techStack: z.string().optional(),
  client: z.string().optional(),
  role: z.string().optional(),
  timeline: z.string().optional(),
  liveUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  githubUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  storeUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  status: z.enum(['draft', 'published']),
  featured: z.boolean().default(false),
  publishedAt: z.string().min(1, { message: 'Publish date is required.' }),
});

type PortfolioFormProps = {
  initialData?: PortfolioProject | null;
  onSubmit: (values: PortfolioProject) => Promise<void>;
  isSubmitting: boolean;
  titleText: string;
  submitButtonText: string;
};

export default function PortfolioForm({
  initialData,
  onSubmit,
  isSubmitting,
  titleText,
  submitButtonText,
}: PortfolioFormProps) {
  const { toast } = useToast();
  const [slugConflict, setSlugConflict] = useState('');
  
  // Gallery Image URLs as state of repeatable inputs
  const [galleryUrls, setGalleryUrls] = useState<string[]>(
    initialData?.galleryImageUrls && initialData.galleryImageUrls.length > 0
      ? initialData.galleryImageUrls
      : []
  );

  const isEditMode = !!initialData;
  const isSlugEdited = useRef(isEditMode);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      shortDescription: initialData?.shortDescription || '',
      coverImageUrl: initialData?.coverImageUrl || '',
      description: initialData?.description || '',
      projectType: initialData?.projectType || 'web',
      techStack: initialData?.techStack?.join(', ') || '',
      client: initialData?.client || '',
      role: initialData?.role || '',
      timeline: initialData?.timeline || '',
      liveUrl: initialData?.liveUrl || '',
      githubUrl: initialData?.githubUrl || '',
      storeUrl: initialData?.storeUrl || '',
      status: initialData?.status || 'draft',
      featured: initialData?.featured || false,
      publishedAt: initialData?.publishedAt
        ? msToDateTimeLocal(initialData.publishedAt)
        : msToDateTimeLocal(Date.now()),
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    form.setValue('title', val);
    
    if (!isSlugEdited.current) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      form.setValue('slug', generatedSlug, { shouldValidate: true });
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isSlugEdited.current = true;
    form.setValue('slug', e.target.value, { shouldValidate: true });
  };

  const handleUrlChange = (index: number, val: string) => {
    const updated = [...galleryUrls];
    updated[index] = convertDriveUrl(val);
    setGalleryUrls(updated);
  };

  const addUrlRow = () => {
    setGalleryUrls([...galleryUrls, '']);
  };

  const removeUrlRow = (index: number) => {
    setGalleryUrls(galleryUrls.filter((_, i) => i !== index));
  };

  const onFormSubmit = async (values: z.infer<typeof formSchema>) => {
    setSlugConflict('');

    // Check slug uniqueness
    const isUnique = await checkPortfolioSlugUnique(values.slug, initialData?.id);
    if (!isUnique) {
      setSlugConflict('This slug is already in use by another project.');
      form.setError('slug', { message: 'Slug must be unique.' });
      toast({ variant: 'destructive', title: 'Slug Conflict', description: 'The project slug must be unique.' });
      return;
    }

    // Process tech stack (comma-separated to string array)
    const techArray = values.techStack
      ? values.techStack.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    // Filter empty gallery URLs
    const cleanGalleryUrls = galleryUrls.map(url => url.trim()).filter(Boolean);

    const finalTitle = values.title.trim().substring(0, 80);
    const finalShortDescription = values.shortDescription?.trim()
      ? values.shortDescription.trim().substring(0, 200)
      : generateShortDescription(values.description);

    const payload: PortfolioProject = {
      ...initialData,
      title: finalTitle,
      slug: values.slug,
      shortDescription: finalShortDescription,
      coverImageUrl: values.coverImageUrl,
      description: values.description,
      projectType: values.projectType,
      techStack: techArray,
      client: values.client || '',
      role: values.role || '',
      timeline: values.timeline || '',
      liveUrl: values.liveUrl || '',
      githubUrl: values.githubUrl || '',
      storeUrl: values.storeUrl || '',
      status: values.status,
      featured: values.featured,
      publishedAt: dateTimeLocalToMs(values.publishedAt),
      galleryImageUrls: cleanGalleryUrls,
      order: initialData?.order ?? 0, // Firestore service overrides 0 for creations
      createdAt: initialData?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    await onSubmit(payload);
  };

  return (
    <div className="bg-card/30 border border-border/50 rounded-2xl p-6 md:p-8 backdrop-blur-md">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/portfolio" className="text-muted-foreground hover:text-accent p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-2xl font-bold font-['Orbitron']">{titleText}</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-semibold text-sm">Project Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. MMS Wallet, E-Commerce Platform"
                      {...field}
                      onChange={handleTitleChange}
                      onPaste={(e) => {
                        const pastedText = e.clipboardData.getData('text');
                        if (pastedText.length > 80) {
                          toast({
                            title: 'Title Truncated',
                            description: 'Pasted title was automatically truncated to the 80 character limit.',
                          });
                        }
                      }}
                      maxLength={80}
                      className="bg-card border-border/80 focus-visible:ring-accent"
                    />
                  </FormControl>
                  <FormDescription className="text-[11px] text-muted-foreground flex justify-between">
                    <span>Used as the display name of this project.</span>
                    <span>{field.value?.length || 0}/80 chars</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-semibold text-sm">Slug (URL Path)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. mms-wallet"
                      {...field}
                      onChange={handleSlugChange}
                      className="bg-card border-border/80 focus-visible:ring-accent"
                    />
                  </FormControl>
                  {slugConflict && <p className="text-xs text-destructive mt-1">{slugConflict}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Type */}
            <FormField
              control={form.control}
              name="projectType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-semibold text-sm">Project Type</FormLabel>
                  <FormControl>
                    <select
                      value={field.value}
                      onChange={field.onChange}
                      className="flex h-10 w-full rounded-md border border-border/80 bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                    >
                      <option value="web" className="bg-card">Web Application</option>
                      <option value="app" className="bg-card">Mobile App</option>
                      <option value="both" className="bg-card">Web & App</option>
                      <option value="other" className="bg-card">Other Project</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cover Image */}
            <FormField
              control={form.control}
              name="coverImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-semibold text-sm">Cover Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/cover.jpg"
                      {...field}
                      onChange={(e) => field.onChange(convertDriveUrl(e.target.value))}
                      className="bg-card border-border/80 focus-visible:ring-accent"
                    />
                  </FormControl>
                  <FormDescription className="text-[11px] text-muted-foreground">
                    Google Drive share links will convert to direct download addresses automatically.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Repeatable Image Gallery Input List */}
          <div className="space-y-3 p-4 rounded-xl border border-border/40 bg-card/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-foreground/80 font-semibold text-sm">Gallery Image URLs</span>
              <Button type="button" variant="outline" size="sm" onClick={addUrlRow} className="h-8 border-primary/40 hover:bg-primary/10 hover:text-none">
                <Plus className="h-4 w-4 mr-1" /> Add Row
              </Button>
            </div>
            
            {galleryUrls.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No gallery images added yet. Click Add Row to include additional screenshots.</p>
            ) : (
              <div className="space-y-2">
                {galleryUrls.map((url, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      placeholder={`Gallery Image #${idx + 1} URL`}
                      value={url}
                      onChange={(e) => handleUrlChange(idx, e.target.value)}
                      className="bg-card border-border/80 focus-visible:ring-accent"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUrlRow(idx)}
                      className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Short Description */}
          <FormField
            control={form.control}
            name="shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80 font-semibold text-sm">Short Description (Optional - Auto-generates if empty)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Leave empty to auto-generate from project details, or write a custom 150-160 character preview..."
                    rows={2}
                    {...field}
                    onPaste={(e) => {
                      const pastedText = e.clipboardData.getData('text');
                      if (pastedText.length > 200) {
                        toast({
                          title: 'Description Truncated',
                          description: 'Pasted short description was automatically truncated to the 200 character limit.',
                        });
                      }
                    }}
                    maxLength={200}
                    className="bg-card border-border/80 focus-visible:ring-accent font-body text-sm"
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-muted-foreground flex justify-between">
                  <span>Used as the Google/Metadata description for this project.</span>
                  <span>{field.value?.length || 0}/200 chars</span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Client */}
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-semibold text-sm">Client Name (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Acme Corp, Personal Project"
                      {...field}
                      className="bg-card border-border/80 focus-visible:ring-accent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-semibold text-sm">Role (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Lead Fullstack Developer"
                      {...field}
                      className="bg-card border-border/80 focus-visible:ring-accent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Timeline */}
            <FormField
              control={form.control}
              name="timeline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-semibold text-sm">Timeline (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Jan 2025 - Mar 2025"
                      {...field}
                      className="bg-card border-border/80 focus-visible:ring-accent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Live Preview URL */}
            <FormField
              control={form.control}
              name="liveUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-semibold text-sm">Live Demo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      {...field}
                      className="bg-card border-border/80 focus-visible:ring-accent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* GitHub Repository URL */}
            <FormField
              control={form.control}
              name="githubUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-semibold text-sm">GitHub Repo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://github.com/username/project"
                      {...field}
                      className="bg-card border-border/80 focus-visible:ring-accent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Store URL */}
            <FormField
              control={form.control}
              name="storeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-semibold text-sm">App Store / Play Store URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://play.google.com/..."
                      {...field}
                      className="bg-card border-border/80 focus-visible:ring-accent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tech Stack Tags Input */}
          <FormField
            control={form.control}
            name="techStack"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80 font-semibold text-sm">Tech Stack (comma-separated)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="NextJS, TypeScript, Firebase, Tailwind"
                    {...field}
                    className="bg-card border-border/80 focus-visible:ring-accent"
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-muted-foreground">
                  Separate tags with commas. Section is hidden if empty.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl border border-border/40 bg-card/10">
            {/* Status Option */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-semibold text-sm">Publishing Status</FormLabel>
                  <FormControl>
                    <select
                      value={field.value}
                      onChange={field.onChange}
                      className="flex h-10 w-full rounded-md border border-border/80 bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                    >
                      <option value="draft" className="bg-card">Draft (Hidden)</option>
                      <option value="published" className="bg-card">Published (Visible)</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Featured Switch */}
            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-end pb-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="featured-check"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-accent bg-card"
                    />
                    <label
                      htmlFor="featured-check"
                      className="text-sm font-semibold text-foreground/80 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Pin to Homepage Carousel
                    </label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Published At Date Picker */}
            <FormField
              control={form.control}
              name="publishedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-semibold text-sm">Publish Date/Time (BDT)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      className="bg-card border-border/80 focus-visible:ring-accent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Full Rich Text Case Study Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80 font-semibold text-sm">Project Details / Case Study Description</FormLabel>
                <FormControl>
                  <RichTextEditor value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-4 border-t border-border/40 flex justify-end gap-3">
            <Button asChild variant="outline" disabled={isSubmitting}>
              <Link href="/dashboard/portfolio">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/95 text-white font-semibold">
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
