'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import ProductFormModal from '../../_components/product-form-modal';

export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user && categoryId) {
      setModalOpen(true);
    }
  }, [user, authLoading, router, categoryId]);

  const handleClose = (isOpen: boolean) => {
    setModalOpen(isOpen);
    if (!isOpen) {
      router.push(`/dashboard/categories/${categoryId}`);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
      </div>
    );
  }

  return (
    <ProductFormModal
      isOpen={modalOpen}
      onOpenChange={handleClose}
      defaultAppId={categoryId}
      productId={null}
    />
  );
}