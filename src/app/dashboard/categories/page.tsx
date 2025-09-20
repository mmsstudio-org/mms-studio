
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { AppDetail, Product } from '@/lib/types';
import { getApps, getProductsForApp, deleteApp } from '@/lib/firestore-service';
import { Loader2, PlusCircle, Trash2, Pencil, ArrowUpNarrowWide, ArrowDownWideNarrow, Package, CircleDollarSign, ChevronsUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AppEditModal from './_components/app-edit-modal';
import ProductEditModal from '@/app/shop/_components/product-edit-modal';
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const Icon = ({ name, className }: { name: string; className: string }) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return null;
  }
  return <LucideIcon className={className} />;
};


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
  const [sortOrders, setSortOrders] = useState<{ [key: string]: { subscriptions: 'asc' | 'desc', coins: 'asc' | 'desc' } }>({});

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

        const initialSortOrders = fetchedApps.reduce((acc, app) => {
            acc[app.id] = { subscriptions: 'asc', coins: 'asc' };
            return acc;
        }, {} as { [key: string]: { subscriptions: 'asc' | 'desc', coins: 'asc' | 'desc' } });
        setSortOrders(initialSortOrders);

    } catch(e) {
        toast({ variant: 'destructive', title: 'Error fetching data.' });
    } finally {
        setLoadingData(false);
    }
  }, [toast]);

  const handleSortToggle = (appId: string, type: 'subscriptions' | 'coins') => {
    setSortOrders(prev => ({
        ...prev,
        [appId]: {
            ...prev[appId],
            [type]: prev[appId][type] === 'asc' ? 'desc' : 'asc',
        },
    }));
  };

  const sortProducts = useCallback((products: Product[], order: 'asc' | 'desc'): Product[] => {
    return [...products].sort((a, b) => {
        const priceA = a.discountedPrice || a.regularPrice;
        const priceB = b.discountedPrice || b.regularPrice;
        if (order === 'asc') {
            return priceA - priceB;
        } else {
            return priceB - priceA;
        }
    });
  }, []);

  const getSortedProducts = useCallback((appId: string) => {
    const appProducts = products[appId] || [];
    const appSortOrders = sortOrders[appId] || { subscriptions: 'asc', coins: 'asc' };
    
    const subscriptions = sortProducts(appProducts.filter(p => p.type === 'subscription'), appSortOrders.subscriptions);
    const coins = sortProducts(appProducts.filter(p => p.type === 'coins'), appSortOrders.coins);
    
    return { subscriptions, coins };
  }, [products, sortOrders, sortProducts]);


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

  const renderProductCard = (product: Product) => (
    <Card key={product.id} className="flex flex-col">
        <div className="relative w-full aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
            {product.imageUrl ? (
                <Image src={product.imageUrl} alt={product.name} layout="fill" className="object-cover" />
            ) : product.type === 'subscription' ? (
                <Package className="h-12 w-12 text-muted-foreground" />
            ) : (
                <CircleDollarSign className="h-12 w-12 text-muted-foreground" />
            )}
        </div>
        <div className="p-4 flex-grow flex flex-col">
            <h5 className="font-bold truncate">{product.name}</h5>
            {product.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>}
            <div className="mt-2 text-sm flex items-baseline gap-2">
                {product.discountedPrice && product.discountedPrice > 0 ? (
                    <>
                        <span className="font-bold text-accent">৳{product.discountedPrice}</span>
                        <span className="text-muted-foreground line-through">৳{product.regularPrice}</span>
                    </>
                ) : (
                    <span className="font-bold">৳{product.regularPrice}</span>
                )}
            </div>
        </div>
        <CardContent className="mt-auto p-4 pt-0">
            <Button className="w-full" size="sm" variant="outline" onClick={() => handleEditProduct(product)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
        </CardContent>
    </Card>
  );

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
        {apps.map(app => {
            const { subscriptions, coins } = getSortedProducts(app.id);
            const appSorts = sortOrders[app.id] || { subscriptions: 'asc', coins: 'asc' };
            return (
            <Card key={app.id}>
                <CardHeader>
                   <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        {app.icon && app.icon.startsWith('http') ? (
                            <Image src={app.icon} alt={app.name} width={40} height={40} className="rounded-md" />
                        ) : app.icon ? (
                            <Icon name={app.icon} className="h-10 w-10 text-accent" />
                        ) : (
                            <div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center text-accent font-bold text-lg">
                                {app.name.charAt(0)}
                            </div>
                        )}
                        <div>
                            <CardTitle>{app.name}</CardTitle>
                            <CardDescription>{app.description}</CardDescription>
                        </div>
                    </div>
                     <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditApp(app)}><Pencil className="mr-2 h-4 w-4"/>Edit Category</Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteApp(app.id)}><Trash2 className="mr-2 h-4 w-4"/>Delete Category</Button>
                     </div>
                   </div>
                </CardHeader>
                <CardContent>
                    <Collapsible>
                        <CollapsibleTrigger asChild>
                           <Button variant="outline" className="w-full group">
                                View Products ({ (products[app.id] || []).length })
                                <ChevronsUpDown className="h-4 w-4 ml-2 group-data-[state=open]:rotate-180 transition-transform" />
                           </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 pt-4 border-t">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">Products for {app.name}</h3>
                                <Button variant="secondary" size="sm" onClick={() => handleAddNewProduct(app)}><PlusCircle className="mr-2 h-4 w-4" /> Add New Product</Button>
                            </div>
                            
                            {subscriptions.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-medium text-muted-foreground">Subscriptions</h4>
                                        <Button variant="ghost" size="sm" onClick={() => handleSortToggle(app.id, 'subscriptions')}>
                                            Sort by price
                                            {appSorts.subscriptions === 'asc' ? <ArrowUpNarrowWide className="ml-2 h-4 w-4" /> : <ArrowDownWideNarrow className="ml-2 h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {subscriptions.map(renderProductCard)}
                                    </div>
                                </div>
                            )}

                            {coins.length > 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-medium text-muted-foreground">Coins</h4>
                                        <Button variant="ghost" size="sm" onClick={() => handleSortToggle(app.id, 'coins')}>
                                            Sort by price
                                            {appSorts.coins === 'asc' ? <ArrowUpNarrowWide className="ml-2 h-4 w-4" /> : <ArrowDownWideNarrow className="ml-2 h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {coins.map(renderProductCard)}
                                    </div>
                                </div>
                            )}
                            
                            {(products[app.id] || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No products yet for this category.</p>}
                        </CollapsibleContent>
                    </Collapsible>
                </CardContent>
            </Card>
        )})}
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
