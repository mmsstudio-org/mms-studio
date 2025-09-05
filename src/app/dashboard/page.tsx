'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import ProductEditModal from '../shop/_components/product-edit-modal';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isModalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="container py-10 text-center">Loading...</div>;
  }
  
  const handleLogout = async () => {
    await logout();
    router.push('/');
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
          <Link href="/shop/bcs">
            <Card className="hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle>Manage BCS Products</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Add, edit, or remove products for the BCS app.</CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link href="/shop/bnc">
            <Card className="hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle>Manage BNC Products</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Add, edit, or remove products for the BNC app.</CardDescription>
              </CardContent>
            </Card>
          </Link>
          <Link href="/shop/api">
            <Card className="hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle>Manage API Products</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Add, edit, or remove products for the API service.</CardDescription>
              </CardContent>
            </Card>
          </Link>
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
        onProductUpdate={() => {
            // we could trigger a re-fetch of data here if we were displaying it
            setModalOpen(false)
        }}
      />
    </>
  );
}
