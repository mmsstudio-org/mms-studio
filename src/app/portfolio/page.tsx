'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PortfolioPage() {
  const router = useRouter();

  useEffect(() => {
    // This is a mock portfolio/admin access point.
    // In a real app, you might have a more secure way to handle this.
    router.push('/login');
  }, [router]);

  return (
    <div className="container py-10 text-center">
      <p>Redirecting to admin access...</p>
    </div>
  );
}
