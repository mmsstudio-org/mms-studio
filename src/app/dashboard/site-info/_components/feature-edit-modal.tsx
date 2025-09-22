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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Feature } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { addFeature, updateFeature } from '@/lib/firestore-service';

const formSchema = z.object({
  icon: z.string().min(1, 'Icon name is required.'),
  title: z.string().min(3, 'Title is required.'),
  description: z.string().min(10, 'Description is required.'),
});

type FeatureEditModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  feature: Feature | null;
  onFeatureUpdate: () => void;
};

export default function FeatureEditModal({
  isOpen,
  onOpenChange,
  feature,
  onFeatureUpdate,
}: FeatureEditModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      icon: 'Zap',
      title: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (feature) {
        form.reset(feature);
      } else {
        form.reset({
          icon: 'Zap',
          title: '',
          description: '',
        });
      }
    }
  }, [feature, form, isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      if (feature && feature.id) {
        await updateFeature(feature.id, values);
        toast({
          title: 'Success',
          description: `Feature "${values.title}" updated.`,
        });
      } else {
        await addFeature(values);
        toast({
          title: 'Success',
          description: `Feature "${values.title}" added.`,
        });
      }
      onFeatureUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save feature.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{feature ? 'Edit Feature' : 'Add New Feature'}</DialogTitle>
          <DialogDescription>
            {feature
              ? 'Edit the details of this homepage feature.'
              : 'Fill in the details for the new homepage feature.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4"
          >
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon Name (from Lucide React)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Zap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Fast Performance" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the feature in a short sentence."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {feature ? 'Save Changes' : 'Add Feature'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
