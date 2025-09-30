
'use client';
import { notFound, useParams } from 'next/navigation';
import ProductList from '../_components/product-list';
import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Product, AppDetail } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductsForApp, getApp } from '@/lib/firestore-service';
import { Button } from '@/components/ui/button';
import { ArrowUpNarrowWide, ArrowDownWideNarrow, Package, Coins, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ShopSlugPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [app, setApp] = useState<AppDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrders, setSortOrders] = useState({
    subscriptions: 'asc' as 'asc' | 'desc',
    coins: 'asc' as 'asc' | 'desc',
    combos: 'asc' as 'asc' | 'desc',
  });
  const [appFound, setAppFound] = useState<boolean | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const appDetails = await getApp(slug);
    if (appDetails) {
      setApp(appDetails);
      const appProducts = await getProductsForApp(slug);
      setProducts(appProducts);
      setAppFound(true);
    } else {
      setAppFound(false);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [slug, fetchData]);
  
  if (appFound === false) {
    notFound();
  }

  const handleSortToggle = (type: 'subscriptions' | 'coins' | 'combos') => {
    setSortOrders(prev => ({
        ...prev,
        [type]: prev[type] === 'asc' ? 'desc' : 'asc',
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
  
  const subscriptions = useMemo(() => {
    const subs = products.filter(p => p.type === 'subscription' && (!p.coinAmount || p.coinAmount === 0));
    return sortProducts(subs, sortOrders.subscriptions);
  }, [products, sortOrders.subscriptions, sortProducts]);
  
  const coins = useMemo(() => {
    const coinsList = products.filter(p => p.type === 'coins');
    return sortProducts(coinsList, sortOrders.coins);
  }, [products, sortOrders.coins, sortProducts]);

  const combos = useMemo(() => {
      const comboList = products.filter(p => p.type === 'subscription' && p.coinAmount && p.coinAmount > 0);
      return sortProducts(comboList, sortOrders.combos);
  }, [products, sortOrders.combos, sortProducts]);
  
  const hasProducts = subscriptions.length > 0 || coins.length > 0 || combos.length > 0;
  const hasMultipleSections = [subscriptions, coins, combos].filter(s => s.length > 0).length > 1;

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
  
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
        // Adjust for header height and some padding
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
             top: offsetPosition,
             behavior: "smooth"
        });
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {app.name} Store
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto whitespace-pre-wrap">
          {app.description}
        </p>
      </div>

      {hasMultipleSections && (
          <div className="sticky top-14 z-40 bg-background/80 backdrop-blur-sm py-4 mb-8 border-b">
              <div className="flex justify-center flex-wrap gap-2">
                  {subscriptions.length > 0 && <Button variant="outline" onClick={() => scrollTo('subscriptions')}><Package className="mr-2 h-4 w-4" /> Subscriptions</Button>}
                  {combos.length > 0 && <Button variant="outline" onClick={() => scrollTo('combos')}><Star className="mr-2 h-4 w-4" /> Combo Offers</Button>}
                  {coins.length > 0 && <Button variant="outline" onClick={() => scrollTo('coins')}><Coins className="mr-2 h-4 w-4" /> Coins</Button>}
              </div>
          </div>
      )}
      
      <div className="space-y-16">
        {subscriptions.length > 0 && (
          <section id="subscriptions" className="scroll-mt-24">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
                <h2 className="text-2xl md:text-3xl font-bold">Subscriptions</h2>
                <Button variant="ghost" onClick={() => handleSortToggle('subscriptions')} className="text-xs md:text-sm">
                  Sort by price
                  {sortOrders.subscriptions === 'asc' ? <ArrowUpNarrowWide className="ml-2 h-4 w-4 md:h-5 md:w-5" /> : <ArrowDownWideNarrow className="ml-2 h-4 w-4 md:h-5 md:w-5" />}
                </Button>
            </div>
            <ProductList products={subscriptions} onProductUpdate={fetchData} app={app} />
          </section>
        )}

        {combos.length > 0 && (
            <section id="combos" className="scroll-mt-24">
                <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
                    <h2 className="text-2xl md:text-3xl font-bold">Combo Packages</h2>
                    <Button variant="ghost" onClick={() => handleSortToggle('combos')} className="text-xs md:text-sm">
                        Sort by price
                        {sortOrders.combos === 'asc' ? <ArrowUpNarrowWide className="ml-2 h-4 w-4 md:h-5 md:w-5" /> : <ArrowDownWideNarrow className="ml-2 h-4 w-4 md:h-5 md:w-5" />}
                    </Button>
                </div>
                <ProductList products={combos} onProductUpdate={fetchData} app={app} />
            </section>
        )}

        {coins.length > 0 && (
          <section id="coins" className="scroll-mt-24">
              <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold">Coins</h2>
                  <Button variant="ghost" onClick={() => handleSortToggle('coins')} className="text-xs md:text-sm">
                      Sort by price
                      {sortOrders.coins === 'asc' ? <ArrowUpNarrowWide className="ml-2 h-4 w-4 md:h-5 md:w-5" /> : <ArrowDownWideNarrow className="ml-2 h-4 w-4 md:h-5 md:w-5" />}
                  </Button>
            </div>
            <ProductList products={coins} onProductUpdate={fetchData} app={app} />
          </section>
        )}

        {!hasProducts && !loading && (
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

    