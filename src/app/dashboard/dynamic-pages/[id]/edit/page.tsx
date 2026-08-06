'use client';

import { useAuth } from '@/hooks/use-auth';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getDynamicPageById, updateDynamicPage, deleteDynamicPage } from '@/lib/firestore-service';
import type { DynamicPage } from '@/lib/types';
import DynamicPageForm from '../../_components/dynamic-page-form';
import { Button } from '@/components/ui/button';
import { Trash2, ArrowLeft } from 'lucide-react';
import { useConfirm } from '@/components/ui/confirm-provider';
import Link from 'next/link';

export default function EditDynamicPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [page, setPage] = useState<DynamicPage | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPage = useCallback(async () => {
    setLoadingData(true);
    try {
      const fetchedPage = await getDynamicPageById(id);
      if (fetchedPage) {
        setPage(fetchedPage);
      } else {
        toast({ variant: 'destructive', title: 'Not Found', description: 'Page does not exist.' });
        router.push('/dashboard/dynamic-pages');
      }
    } catch (error) {
      console.error('Error fetching page:', error);
      router.push('/dashboard/dynamic-pages');
    } finally {
      setLoadingData(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user && id) {
      fetchPage();
    }
  }, [user, authLoading, router, id, fetchPage]);

  const handleSubmit = async (pagePayload: Omit<DynamicPage, 'id'>) => {
    if (!page?.id) return;
    setIsSubmitting(true);
    try {
      await updateDynamicPage(page.id, pagePayload);
      toast({ title: 'Success', description: 'Page updated successfully.' });
      router.push('/dashboard/dynamic-pages');
    } catch (error) {
      console.error('Error updating page:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update page.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!page?.id) return;
    const confirmed = await confirm({
      title: 'Delete Page',
      description: `Are you sure you want to delete the page "${page.title}"? This action is permanent.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      await deleteDynamicPage(page.id);
      toast({ title: 'Success', description: 'Page deleted successfully.' });
      router.push('/dashboard/dynamic-pages');
    } catch (error) {
      console.error('Error deleting page:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete page.' });
    }
  };

  if (authLoading || loadingData || !page) {
    return (
      <div className="container py-10">
        <Skeleton className="h-10 w-1/4 mb-6" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="container py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard/dynamic-pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold font-['Orbitron']">Edit Page</h1>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isSubmitting}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete Page
        </Button>
      </div>

      <DynamicPageForm
        titleText="Edit Page"
        submitButtonText="Save Changes"
        initialData={page}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
