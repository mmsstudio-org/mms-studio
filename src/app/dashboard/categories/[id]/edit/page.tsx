'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getApp } from '@/lib/firestore-service';
import type { AppDetail } from '@/lib/types';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CategoryForm from '../../_components/category-form';

export default function EditCategoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const { toast } = useToast();
  const [app, setApp] = useState<AppDetail | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const categorySnap = await getApp(categoryId);
      if (categorySnap) {
        setApp(categorySnap);
      } else {
        toast({
          variant: 'destructive',
          title: 'Not Found',
          description: 'Category does not exist.',
        });
        router.push('/dashboard/categories');
      }
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch details.',
      });
    } finally {
      setLoadingData(false);
    }
  }, [categoryId, router, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, router, fetchData]);

  if (authLoading || loadingData || !app) {
    return (
      <div className="container py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
      </div>
    );
  }

  return (
    <div className="container py-10 px-4 max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/categories" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Categories
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/categories/${categoryId}`} className="flex items-center gap-2">
            Manage Products
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-['Orbitron']">
            Edit Category Details
          </CardTitle>
          <CardDescription>
            Update general settings and metadata for {app.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm
            mode="edit"
            categoryId={categoryId}
            initialData={app}
            onSuccess={fetchData}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}