import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cog, Palette, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import AiPageGenerator from './_components/ai-page-generator';

export default function Home() {
  const features = [
    {
      icon: <Cog className="h-10 w-10 text-accent" />,
      title: 'Powerful APIs',
      description: 'Integrate our services seamlessly into your applications with our robust and well-documented APIs.',
    },
    {
      icon: <Palette className="h-10 w-10 text-accent" />,
      title: 'Futuristic UI/UX',
      description: 'Experience a sleek, modern interface designed for efficiency and a great user experience.',
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-accent" />,
      title: 'Secure & Reliable',
      description: 'Built on top of Firebase, ensuring your data is secure and the service is always available.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <section className="text-center py-20">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          MMS Studio
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Your Gateway to the Future of Digital Assets. Explore our services and tools designed for the next generation of the web.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg" className="neon-glow bg-primary hover:bg-primary/90">
            <Link href="/shop">Explore The Shop</Link>
          </Button>
        </div>
      </section>

      <section className="py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-card/50 backdrop-blur-sm border-border/50 text-center">
              <CardHeader className="items-center">
                {feature.icon}
                <CardTitle className="mt-4 text-2xl font-bold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <AiPageGenerator />
    </div>
  );
}
