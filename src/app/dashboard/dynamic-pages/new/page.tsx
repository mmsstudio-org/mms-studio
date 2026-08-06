'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { addDynamicPage } from '@/lib/firestore-service';
import type { DynamicPage } from '@/lib/types';
import DynamicPageForm from '../_components/dynamic-page-form';

export default function NewDynamicPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (pagePayload: Omit<DynamicPage, 'id'>) => {
    setIsSubmitting(true);
    try {
      await addDynamicPage(pagePayload);
      toast({ title: 'Success', description: 'Page created successfully.' });
      router.push('/dashboard/dynamic-pages');
    } catch (error) {
      console.error('Error creating page:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create page.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container py-10">
        <Skeleton className="h-10 w-1/4 mb-6" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="container py-10 px-4">
      <DynamicPageForm
        titleText="Create New Page"
        submitButtonText="Create Page"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}