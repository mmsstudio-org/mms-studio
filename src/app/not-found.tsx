
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Briefcase } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container mx-auto flex h-full flex-col items-center justify-center text-center py-20">
      <div className="relative">
        <h1 className="text-[150px] md:text-[200px] font-black font-['Orbitron'] text-foreground leading-none animate-float">
          404
        </h1>
        <div className="absolute inset-0 text-[150px] md:text-[200px] font-black font-['Orbitron'] text-foreground/5 blur-xl leading-none -z-10 animate-float">404</div>
        <div className="absolute inset-0 bg-gradient-to-c from-primary/10 to-accent/10 rounded-full blur-3xl opacity-30 -z-20"></div>
      </div>
      <h2 className="mt-4 text-3xl md:text-4xl font-bold font-['Orbitron'] neon-text">Page Not Found</h2>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        The page you are looking for has been moved to another galaxy. Don't worry, we can help you find your way back.
      </p>
      <div className="mt-12 flex flex-col sm:flex-row gap-4">
        <div className="futuristic-glowing-button-container">
          <Link href="/" className="futuristic-glowing-button">
            <Home className="mr-2 h-5 w-5" />
            Go to Home
          </Link>
        </div>
        <div className="futuristic-glowing-button-container">
          <Link href="https://sabbirmms.github.io" target="_blank" className="futuristic-glowing-button">
            <Briefcase className="mr-2 h-5 w-5" />
            Visit Portfolio
          </Link>
        </div>
      </div>
    </div>
  );
}
