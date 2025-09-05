'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import ProductEditModal from '../shop/_components/product-edit-modal';
import Link from 'next/link';
import type { AppDetail } from '@/lib/types';
import { getApps } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isModalOpen, setModalOpen] = useState(false);
  const [apps, setApps] = useState<AppDetail[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const fetchApps = useCallback(async () => {
    setLoadingApps(true);
    const fetchedApps = await getApps();
    setApps(fetchedApps);
    setLoadingApps(false);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchApps();
    }
  }, [user, loading, router, fetchApps]);

  if (loading || !user) {
    return <div className="container py-10 text-center">Loading...</div>;
  }
  
  const handleLogout = async () => {
    await logout();
    router.push('/');
  }

  const onProductUpdate = () => {
    // You could add logic here to refresh specific app data if needed
    setModalOpen(false);
  }

  return (
    <>
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setModalOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Product
            </Button>
             <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loadingApps ? (
            <>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : (
             apps.map(app => (
              <Link href={`/shop/${app.id}`} key={app.id}>
                <Card className="hover:border-primary transition-colors">
                  <CardHeader>
                    <CardTitle>Manage {app.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Add, edit, or remove products for {app.name}.</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
           <Card>
            <CardHeader>
              <CardTitle>Manage Site Info</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Edit site name, features, and payment info. (Coming soon)</CardDescription>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Manage App Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Add or remove shop categories. (Coming soon)</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>View Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>See pending and approved purchases. (Coming soon)</CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
      <ProductEditModal 
        isOpen={isModalOpen}
        onOpenChange={setModalOpen}
        product={null}
        onProductUpdate={onProductUpdate}
      />
    </>
  );
}
