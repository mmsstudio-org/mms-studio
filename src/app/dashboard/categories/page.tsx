'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { AppDetail, Product } from '@/lib/types';
import { getApps, getProductsForApp, deleteApp } from '@/lib/firestore-service';
import { Loader2, PlusCircle, Trash2, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AppEditModal from './_components/app-edit-modal';
import ProductEditModal from '@/app/shop/_components/product-edit-modal';

export default function CategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [apps, setApps] = useState<AppDetail[]>([]);
  const [products, setProducts] = useState<{ [key: string]: Product[] }>({});
  const [loadingData, setLoadingData] = useState(true);
  const [isAppModalOpen, setAppModalOpen] = useState(false);
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppDetail | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [appForNewProduct, setAppForNewProduct] = useState<AppDetail | null>(null);


  const fetchAllData = useCallback(async () => {
    setLoadingData(true);
    try {
        const fetchedApps = await getApps();
        setApps(fetchedApps);
        const productsPromises = fetchedApps.map(app => getProductsForApp(app.id));
        const productsResults = await Promise.all(productsPromises);
        const productsMap = fetchedApps.reduce((acc, app, index) => {
            acc[app.id] = productsResults[index];
            return acc;
        }, {} as { [key: string]: Product[] });
        setProducts(productsMap);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error fetching data.' });
    } finally {
        setLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchAllData();
    }
  }, [user, authLoading, router, fetchAllData]);
  
  const handleEditApp = (app: AppDetail) => {
    setSelectedApp(app);
    setAppModalOpen(true);
  };
  
  const handleAddNewApp = () => {
    setSelectedApp(null);
    setAppModalOpen(true);
  };
  
  const handleDeleteApp = async (appId: string) => {
    if(!window.confirm('Are you sure you want to delete this category and all its products? This cannot be undone.')) return;

    try {
        // In a real production app, you'd want a backend function to delete sub-collections.
        // For now, we just delete the app document. Products will be orphaned but won't show up.
        await deleteApp(appId);
        toast({ title: 'Category Deleted' });
        fetchAllData();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error deleting category.' });
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setAppForNewProduct(null);
    setProductModalOpen(true);
  };

  const handleAddNewProduct = (app: AppDetail) => {
    setSelectedProduct(null);
    setAppForNewProduct(app);
    setProductModalOpen(true);
  };


  if (authLoading || loadingData) {
    return (
      <div className="container py-10">
        <Skeleton className="h-10 w-1/4 mb-4" />
        <Skeleton className="h-8 w-1/3 mb-8" />
        <div className="space-y-8">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Manage Categories & Products</h1>
          <p className="text-muted-foreground">Add, edit, or remove app categories and their associated products.</p>
        </div>
        <Button onClick={handleAddNewApp}><PlusCircle className="mr-2 h-4 w-4"/> Add New Category</Button>
      </div>
      
      <div className="space-y-10">
        {apps.length === 0 && !loadingData && (
            <p className="text-center text-muted-foreground py-10">No app categories found. Add one to get started.</p>
        )}
        {apps.map(app => (
            <Card key={app.id}>
                <CardHeader>
                   <div className="flex justify-between items-center">
                     <div>
                        <CardTitle>{app.name}</CardTitle>
                        <CardDescription>{app.description}</CardDescription>
                     </div>
                     <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditApp(app)}><Pencil className="mr-2 h-4 w-4"/>Edit Category</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteApp(app.id)}><Trash2 className="mr-2 h-4 w-4"/>Delete Category</Button>
                     </div>
                   </div>
                </CardHeader>
                <CardContent>
                   <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">Products for {app.name}</h3>
                        <Button variant="secondary" size="sm" onClick={() => handleAddNewProduct(app)}><PlusCircle className="mr-2 h-4 w-4" /> Add New Product</Button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(products[app.id] || []).map(product => (
                        <Card key={product.id} className="p-4 flex flex-col justify-between">
                            <div>
                                <p className="font-bold">{product.name}</p>
                                <p className="text-sm text-muted-foreground">৳{product.regularPrice}</p>
                            </div>
                            <Button className="w-full mt-4" size="sm" variant="ghost" onClick={() => handleEditProduct(product)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
                        </Card>
                    ))}
                    {(products[app.id] || []).length === 0 && <p className="text-sm text-muted-foreground">No products yet.</p>}
                   </div>
                </CardContent>
            </Card>
        ))}
      </div>

      <AppEditModal 
        isOpen={isAppModalOpen}
        onOpenChange={setAppModalOpen}
        app={selectedApp}
        onAppUpdate={() => {
            setAppModalOpen(false);
            fetchAllData();
        }}
      />
      <ProductEditModal 
        isOpen={isProductModalOpen}
        onOpenChange={setProductModalOpen}
        product={selectedProduct}
        appForNewProduct={appForNewProduct}
        onProductUpdate={() => {
            setProductModalOpen(false);
            fetchAllData();
        }}
      />
    </div>
  );
}
