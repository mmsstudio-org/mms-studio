
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import type { AppDetail } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { addApp, updateApp } from '@/lib/firestore-service';

// YouTube regex to get video ID from URL
const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

// Validator for YouTube URL or a raw video ID
const youtubeIdOrUrlSchema = z.string().optional().refine(val => {
    if (!val) return true; // Allow empty string
    if (youtubeRegex.test(val)) return true; // Allow full URL
    if (val.length === 11 && /^[a-zA-Z0-9_-]+$/.test(val)) return true; // Allow raw ID
    return false;
}, {
    message: "Please enter a valid YouTube video URL or Video ID."
});

const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  description: z.string().optional(),
  icon: z.union([z.string().url(), z.string().length(0), z.string().refine(s => !s.startsWith('http'))]).optional(),
  youtubeVideoUrl: youtubeIdOrUrlSchema,
  pkg: z.string().optional(),
});

type AppEditModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  app: AppDetail | null;
  onAppUpdate: () => void;
};

export default function AppEditModal({ isOpen, onOpenChange, app, onAppUpdate }: AppEditModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: '',
        description: '',
        icon: '',
        youtubeVideoUrl: '',
        pkg: '',
    },
  });

  useEffect(() => {
    if (app) {
      form.reset({
        ...app,
        description: app.description || '',
        icon: app.icon || '',
        youtubeVideoUrl: app.youtubeVideoId || '',
        pkg: app.pkg || '',
      });
    } else {
        form.reset({
            name: '',
            description: '',
            icon: '',
            youtubeVideoUrl: '',
            pkg: '',
        });
    }
  }, [app, form]);

  function getYouTubeVideoId(urlOrId: string): string {
    if (!urlOrId) return "";
    const match = urlOrId.match(youtubeRegex);
    if (match && match[1]) {
      return match[1];
    }
    // If no match from URL, assume it's a raw ID if it fits the criteria
    if (urlOrId.length === 11 && /^[a-zA-Z0-9_-]+$/.test(urlOrId)) {
        return urlOrId;
    }
    return "";
  }
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const videoId = getYouTubeVideoId(values.youtubeVideoUrl || "");
    
    const appData = {
        name: values.name,
        description: values.description || "",
        icon: values.icon || "",
        youtubeVideoId: videoId,
        pkg: values.pkg || "",
    }

    try {
        if (app && app.id) {
            await updateApp(app.id, appData);
            toast({ title: 'Category Updated', description: 'The category has been successfully updated.' });
        } else {
            await addApp(appData as Omit<AppDetail, 'id'>);
            toast({ title: 'Category Added', description: 'The new category has been successfully added.' });
        }
        onAppUpdate();
        onOpenChange(false);
    } catch (error) {
        console.error("Error saving category:", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{app ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {app ? 'Edit the details of this app category.' : 'Fill in the details for the new app category.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
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
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Describe the category..." {...field} />
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
                    <FormDescription>
                        If set, coupons from this category will require this package name for redemption.
                    </FormDescription>
                    <FormControl>
                        <Input placeholder="e.g., com.example.app" {...field} />
                    </FormControl>
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
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {app ? 'Save Changes' : 'Add Category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
