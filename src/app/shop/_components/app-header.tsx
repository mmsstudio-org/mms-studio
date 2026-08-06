'use client';

import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';
import type { AppDetail } from '@/lib/types';

const Icon = ({ name, className }: { name: string; className: string }) => {
  const LucideIcon = (LucideIcons as any)[name];
  if (!LucideIcon) {
    return null;
  }
  return <LucideIcon className={className} />;
};

type AppHeaderProps = {
  app: AppDetail;
};

export default function AppHeader({ app }: AppHeaderProps) {
  return (
    <div className="text-center mb-12 flex flex-col items-center gap-4">
      {app.icon && app.icon.startsWith('http') ? (
        <Image src={app.icon} alt={app.name} width={64} height={64} className="rounded-lg" />
      ) : app.icon ? (
        <Icon name={app.icon} className="h-16 w-16 text-accent" />
      ) : (
        <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center text-accent font-bold text-3xl">
          {app.name.charAt(0)}
        </div>
      )}
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
        {app.name}
      </h1>
      <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto whitespace-pre-wrap">
        {app.description}
      </p>
      {app.appUrl && (
        <Button asChild variant="outline" size="lg" className="mt-2">
          <a href={app.appUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" /> Visit App
          </a>
        </Button>
      )}
    </div>
  );
}