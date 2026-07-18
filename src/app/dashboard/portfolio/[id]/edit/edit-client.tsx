'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { updatePortfolioProject } from '@/lib/firestore-service';
import type { PortfolioProject } from '@/lib/types';
import PortfolioForm from '../../_components/portfolio-form';

interface EditPortfolioClientProps {
  project: PortfolioProject;
}

export default function EditPortfolioClient({ project }: EditPortfolioClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: PortfolioProject) => {
    if (!project.id) return;
    setSubmitting(true);
    try {
      await updatePortfolioProject(project.id, values);
      toast({ title: 'Success', description: 'Portfolio project updated successfully.' });
      router.push('/dashboard/portfolio');
    } catch (error) {
      console.error('Failed to update portfolio project:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update project.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl px-4">
      <PortfolioForm
        initialData={project}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        titleText="Edit Project Details"
        submitButtonText="Save Changes"
      />
    </div>
  );
}
