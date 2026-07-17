'use client';

import { useAuth } from '@/hooks/use-auth';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getBlogById, updateBlog } from '@/lib/firestore-service';
import type { Blog } from '@/lib/types';
import BlogForm from '../../_components/blog-form';

export default function EditBlogPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBlog = useCallback(async () => {
    setLoadingData(true);
    try {
      const fetchedBlog = await getBlogById(id);
      if (fetchedBlog) {
        setBlog(fetchedBlog);
      } else {
        toast({ variant: 'destructive', title: 'Not Found', description: 'Could not find the requested blog post.' });
        router.push('/dashboard/blogs');
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      router.push('/dashboard/blogs');
    } finally {
      setLoadingData(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchBlog();
    }
  }, [user, authLoading, router, fetchBlog]);

  const handleSubmit = async (blogPayload: Blog) => {
    setIsSubmitting(true);
    try {
      const { id: payloadId, ...payloadWithoutId } = blogPayload;
      await updateBlog(id, payloadWithoutId);
      toast({ title: 'Success', description: 'Blog post updated successfully.' });
      router.push('/dashboard/blogs');
    } catch (error) {
      console.error('Error updating blog post:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update blog post.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loadingData || !user) {
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
        titleText="Edit Blog Post"
        submitButtonText="Save Changes"
        initialData={blog}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
