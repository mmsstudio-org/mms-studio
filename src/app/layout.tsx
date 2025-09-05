'use client';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from './_components/header';
import Footer from './_components/footer';
import { AuthProvider } from '@/hooks/use-auth';
import { ThemeProvider } from '@/hooks/use-theme';
import { useEffect, useState } from 'react';
import { getSiteInfo } from '@/lib/firestore-service';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteInfo, setSiteInfo] = useState({ title: 'MMS Studio - Digital Assets', description: 'Your gateway to the future of digital assets.' });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    getSiteInfo().then(info => {
      if(info.webName && info.webDescription) {
        setSiteInfo({ title: info.webName, description: info.webDescription });
      }
    });
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      document.title = siteInfo.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
          metaDesc.setAttribute('content', siteInfo.description);
      }
    }
  }, [siteInfo, isMounted]);

  if (!isMounted) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>MMS Studio - Digital Assets</title>
          <meta name="description" content="Your gateway to the future of digital assets." />
        </head>
        <body className={cn(
          'min-h-screen font-body antialiased futuristic-bg',
          'flex flex-col'
        )}>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{siteInfo.title}</title>
        <meta name="description" content={siteInfo.description} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen font-body antialiased futuristic-bg',
          'flex flex-col'
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
