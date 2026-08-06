'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CategoryForm from '../_components/category-form';

export default function NewCategoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="container py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="container py-10 px-4">
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
          <CategoryForm
            mode="create"
            submitLabel="Create Category"
          />
        </CardContent>
      </Card>
    </div>
  );
}