'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addPortfolioProject } from '@/lib/firestore-service';
import type { PortfolioProject } from '@/lib/types';
import PortfolioForm from '../_components/portfolio-form';

export default function NewPortfolioProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: PortfolioProject) => {
    setSubmitting(true);
    try {
      await addPortfolioProject(values);
      toast({ title: 'Success', description: 'Portfolio project created successfully.' });
      router.push('/dashboard/portfolio');
    } catch (error) {
      console.error('Failed to create portfolio project:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create project.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <PortfolioForm
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        titleText="Add New Project"
        submitButtonText="Create Project"
      />
    </div>
  );
}
