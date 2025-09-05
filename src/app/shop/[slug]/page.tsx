'use client';
import { APPS } from '@/lib/store';
import { notFound, useParams } from 'next/navigation';
import ProductList from '../_components/product-list';
import { useEffect, useState, useCallback } from 'react';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductsForApp } from '@/lib/firestore-service';

export default function ShopSlugPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [app, setApp] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const appProducts = await getProductsForApp(slug);
    setProducts(appProducts);
    setLoading(false);
  }, [slug]);


  useEffect(() => {
    const foundApp = APPS.find((app) => app.id === slug);
    if (foundApp) {
      setApp(foundApp);
      fetchProducts();
    } else {
      notFound();
    }
  }, [slug, fetchProducts]);

  if (!app) {
    return null; // Or a loading state
  }
  
  const subscriptions = products.filter(p => p.type === 'subscription');
  const coins = products.filter(p => p.type === 'coins');

  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">
          {app.name} Store
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          {app.description}
        </p>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <div className="space-y-16">
          {subscriptions.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold mb-6">Subscriptions</h2>
              <ProductList products={subscriptions} onProductUpdate={fetchProducts} />
            </section>
          )}

          {coins.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold mb-6">Coins</h2>
              <ProductList products={coins} onProductUpdate={fetchProducts}/>
            </section>
          )}

          {products.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No products available for this app yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
