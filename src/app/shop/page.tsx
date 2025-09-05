import Link from 'next/link';
import { APPS } from '@/lib/store';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function ShopPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to the Shop</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Select an app to browse subscriptions, coin packs, and more.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {APPS.map((app) => (
          <Link href={`/shop/${app.id}`} key={app.id}>
            <Card className="group overflow-hidden transition-all duration-300 hover:border-accent neon-glow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-bold">{app.name}</CardTitle>
                    <CardDescription className="mt-2">{app.description}</CardDescription>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
