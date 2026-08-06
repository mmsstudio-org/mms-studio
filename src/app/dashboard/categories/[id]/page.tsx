'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getApp, getProductsForApp } from '@/lib/firestore-service';
import type { AppDetail, Product } from '@/lib/types';
import { Loader2, ArrowLeft, PlusCircle, Pencil } from 'lucide-react';
import Link from 'next/link';
import ProductsTable from './_components/products-table';
import ProductFormModal from './_components/product-form-modal';

export default function CategoryProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const { toast } = useToast();
  const [app, setApp] = useState<AppDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const categorySnap = await getApp(categoryId);
      if (categorySnap) {
        setApp(categorySnap);
        const appProducts = await getProductsForApp(categoryId);
        setProducts(appProducts);
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

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSaved = () => {
    fetchData();
  };

  const handleDelete = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleModalOpenChange = (isOpen: boolean) => {
    setModalOpen(isOpen);
    if (!isOpen) {
      setEditingProduct(null);
    }
  };

  if (authLoading || loadingData || !app) {
    return (
      <div className="container py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
      </div>
    );
  }

  return (
    <div className="container py-10 px-4 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/categories" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Categories
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/categories/${categoryId}/edit`} className="flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5" /> Edit Category Details
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-['Orbitron']">
            {app.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage products and package plans inside this category.
          </p>
        </div>
        <Button size="sm" onClick={handleOpenCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ProductsTable
            products={products}
            categoryId={categoryId}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <ProductFormModal
        isOpen={modalOpen}
        onOpenChange={handleModalOpenChange}
        defaultAppId={categoryId}
        productId={editingProduct?.id || null}
        onSaved={handleSaved}
      />
    </div>
  );
}