
'use client';
import { notFound, useParams } from 'next/navigation';
import ProductList from '../_components/product-list';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Product, AppDetail } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductsForApp, getApp } from '@/lib/firestore-service';
import { Button } from '@/components/ui/button';
import { ArrowUpNarrowWide, ArrowDownWideNarrow } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShopSlugPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [app, setApp] = useState<AppDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionSort, setSubscriptionSort] = useState<'asc' | 'desc'>('asc');
  const [coinSort, setCoinSort] = useState<'asc' | 'desc'>('asc');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const appDetails = await getApp(slug);
    if (appDetails) {
      setApp(appDetails);
      const appProducts = await getProductsForApp(slug);
      setProducts(appProducts);
    } else {
      notFound();
    }
    setLoading(false);
  }, [slug]);


  useEffect(() => {
    fetchProducts();
  }, [slug, fetchProducts]);

  const sortProducts = useCallback((products: Product[], order: 'asc' | 'desc'): Product[] => {
    return [...products].sort((a, b) => {
        const priceA = a.discountedPrice || a.regularPrice;
        const priceB = b.discountedPrice || b.regularPrice;
        if (order === 'asc') {
            return priceA - priceB;
        } else {
            return priceB - a.regularPrice;
        }
    });
  }, []);
  
  const subscriptions = useMemo(() => {
    const subs = products.filter(p => p.type === 'subscription');
    return sortProducts(subs, subscriptionSort);
  }, [products, subscriptionSort, sortProducts]);

  const coins = useMemo(() => {
    const coinsList = products.filter(p => p.type === 'coins');
    return sortProducts(coinsList, coinSort);
  }, [products, coinSort, sortProducts]);


  if (loading || !app) {
     return (
        <div className="container mx-auto py-10">
            <div className="text-center mb-12">
                <Skeleton className="h-10 w-1/2 mx-auto" />
                <Skeleton className="h-6 w-3/4 mx-auto mt-4" />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        </div>
     )
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {app.name} Store
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          {app.description}
        </p>
      </div>

      
      <div className="space-y-16">
        {subscriptions.length > 0 && (
          <section>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
                <h2 className="text-2xl md:text-3xl font-bold">Subscriptions</h2>
                <Button variant="ghost" onClick={() => setSubscriptionSort(s => s === 'asc' ? 'desc' : 'asc')} className="text-xs md:text-sm">
                  Sort by price
                  {subscriptionSort === 'asc' ? <ArrowUpNarrowWide className="ml-2 h-4 w-4 md:h-5 md:w-5" /> : <ArrowDownWideNarrow className="ml-2 h-4 w-4 md:h-5 md:w-5" />}
                </Button>
            </div>
            <ProductList products={subscriptions} onProductUpdate={fetchProducts} app={app} />
          </section>
        )}

        {coins.length > 0 && (
          <section>
              <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold">Coins</h2>
                  <Button variant="ghost" onClick={() => setCoinSort(s => s === 'asc' ? 'desc' : 'asc')} className="text-xs md:text-sm">
                      Sort by price
                      {coinSort === 'asc' ? <ArrowUpNarrowWide className="ml-2 h-4 w-4 md:h-5 md:w-5" /> : <ArrowDownWideNarrow className="ml-2 h-4 w-4 md:h-5 md:w-5" />}
                  </Button>
            </div>
            <ProductList products={coins} onProductUpdate={fetchProducts} app={app} />
          </section>
        )}

        {products.length === 0 && !loading && (
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No products available for this app yet.</p>
          </div>
        )}
      </div>

      {app.youtubeVideoId && (
        <section className="mt-16">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl">Payment Tutorial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video max-w-4xl mx-auto">
                <iframe
                  className="w-full h-full rounded-lg"
                  src={`https://www.youtube.com/embed/${app.youtubeVideoId}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
