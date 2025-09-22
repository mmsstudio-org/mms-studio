
'use client';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Smartphone, MessageSquare, Code } from 'lucide-react';
import { HowToPaySection } from './_components/how-to-pay';
import { useEffect, useState } from 'react';
import type { AppDetail } from '@/lib/types';
import { getApps } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';

const Icon = ({ name, className }: { name: string; className: string }) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return null;
  }
  return <LucideIcon className={className} />;
};


export default function ShopPage() {
  const [apps, setApps] = useState<AppDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApps() {
      const fetchedApps = await getApps();
      setApps(fetchedApps);
      setLoading(false);
    }
    fetchApps();
  }, []);

  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to the Shop</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Select an app to browse subscriptions, coin packs, and more.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
        {loading ? (
          <>
            <Skeleton className="h-[150px] w-full" />
            <Skeleton className="h-[150px] w-full" />
            <Skeleton className="h-[150px] w-full" />
          </>
        ) : (
          apps.map((app) => {
            return (
              <Link href={`/shop/${app.id}`} key={app.id} className="flex h-full">
                <Card className="group flex flex-col w-full overflow-hidden transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1">
                  <CardHeader className="flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      {app.icon && app.icon.startsWith('http') ? (
                          <Image src={app.icon} alt={app.name} width={32} height={32} className="rounded-md" />
                      ) : app.icon ? (
                          <Icon name={app.icon} className="h-8 w-8 text-accent" />
                      ) : (
                          <div className="h-8 w-8 bg-muted rounded-md flex items-center justify-center text-accent font-bold">
                              {app.name.charAt(0)}
                          </div>
                      )}
                      <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">{app.name}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">{app.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            )
          })
        )}
      </div>

      <HowToPaySection />
    </div>
  );
}
