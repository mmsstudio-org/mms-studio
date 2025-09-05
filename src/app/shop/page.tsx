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

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Smartphone,
  MessageSquare,
  Code,
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
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[120px] w-full" />
          </>
        ) : (
          apps.map((app) => {
            const IconComponent = app.icon && iconMap[app.icon] ? iconMap[app.icon] : null;
            return (
              <Link href={`/shop/${app.id}`} key={app.id}>
                <Card className="group overflow-hidden transition-all duration-300 hover:border-accent neon-glow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        {app.icon && app.icon.startsWith('http') ? (
                          <Image src={app.icon} alt={app.name} width={32} height={32} className="rounded-md" />
                        ) : IconComponent ? (
                          <IconComponent className="h-8 w-8 text-accent" />
                        ) : (
                          <div className="h-8 w-8 bg-muted rounded-md flex items-center justify-center text-accent font-bold">
                            {app.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-2xl font-bold">{app.name}</CardTitle>
                          <CardDescription className="mt-2">{app.description}</CardDescription>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent" />
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
