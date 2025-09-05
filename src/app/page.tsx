"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getFeatures, getSiteInfo } from "@/lib/firestore-service";
import type { Feature, SiteInfo } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const Icon = ({ name, className }: { name: string; className: string }) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return <LucideIcons.HelpCircle className={className} />;
  }
  return <LucideIcon className={className} />;
};

export default function Home() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [fetchedFeatures, fetchedSiteInfo] = await Promise.all([
        getFeatures(),
        getSiteInfo(),
      ]);
      setFeatures(fetchedFeatures);
      setSiteInfo(fetchedSiteInfo);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <section className="text-center py-20">
        {loading ? (
          <>
            <Skeleton className="h-20 w-3/4 mx-auto" />
            <Skeleton className="h-8 w-1/2 mx-auto mt-4" />
            <Skeleton className="h-12 w-48 mx-auto mt-8" />
          </>
        ) : (
          <>
            <h1 className="text-5xl md:text-7xl font-['Orbitron'] font-black mb-6 animate-float"
              dangerouslySetInnerHTML={{
                __html:
                  siteInfo?.webName ||
                  'MMS Studio',
              }}
            />

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {siteInfo?.webDescription ||
                "Your Gateway to the Future of Digital Assets. Explore our services and tools designed for the next generation of the web."}
            </p>
            <div className="flex justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="px-8 py-4 rounded-full text-lg font-semibold hover-glow transition-all"
                >
                <Link href="/shop">Explore The Shop</Link>
              </Button>
            </div>
          </>
        )}
      </section>

      <section className="py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
            <>
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-56 w-full" />
            </>
          ) : (
            features.map((feature) => (
              <Card
                key={feature.id}
                className="bg-card/50 backdrop-blur-sm border-border/50 text-center"
              >
                <CardHeader className="items-center">
                  <Icon name={feature.icon} className="h-10 w-10 text-accent" />
                  <CardTitle className="mt-4 text-2xl font-bold">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <section id="admin" className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-['Orbitron'] font-bold mb-8 neon-text">
            Our Projects & Portfolio
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore our developer portfolio to discover our innovative projects, apps, and digital solutions.
          </p>
          <Button
            asChild
            size="lg"
            className="px-8 py-4 rounded-full text-lg font-semibold hover-glow transition-all"
          >
            <Link href="https://github.com/sabbirmms" target="_blank">
              🔗 Visit Portfolio
            </Link>
          </Button>
        </div>
      </section>

    </div>
  );
}
