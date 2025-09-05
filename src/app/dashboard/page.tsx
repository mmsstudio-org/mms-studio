'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="container py-10 text-center">Loading...</div>;
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {user.email}</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Product
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Manage Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Add, edit, or remove products from your shop.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>View Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <p>See pending and approved purchases.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p>View sales data and trends.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
