'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { addBlog } from '@/lib/firestore-service';
import type { Blog } from '@/lib/types';
import BlogForm from '../_components/blog-form';

export default function NewBlogPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSubmit = async (blogPayload: Blog) => {
    setIsSubmitting(true);
    try {
      // Remove ID from payload just to be safe
      const { id, ...payloadWithoutId } = blogPayload;
      await addBlog(payloadWithoutId);
      toast({ title: 'Success', description: 'Blog post created successfully.' });
      router.push('/dashboard/blogs');
    } catch (error) {
      console.error('Error creating blog post:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create blog post.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="container py-10">
        <Skeleton className="h-10 w-1/4 mb-6" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="container py-10 px-4">
      <BlogForm
        titleText="Create New Blog Post"
        submitButtonText="Create Post"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        defaultAuthor={user.email?.split('@')[0] || 'Admin'}
      />
    </div>
  );
}
