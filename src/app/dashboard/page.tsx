'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings, LayoutGrid, ListOrdered } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="container py-10 text-center">
            <h1 className="text-4xl font-bold">Loading Dashboard...</h1>
            <p className="text-muted-foreground">Please wait a moment.</p>
        </div>
    )
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
           <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <Link href="/dashboard/site-info">
             <Card className="hover:border-primary transition-colors h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-accent"/> Manage Site Info</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Edit site name, features, and payment info.</CardDescription>
              </CardContent>
            </Card>
           </Link>
           <Link href="/dashboard/categories">
             <Card className="hover:border-primary transition-colors h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5 text-accent" /> Manage App Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Add, edit, or remove shop categories and their products.</CardDescription>
              </CardContent>
            </Card>
           </Link>
           <Link href="/dashboard/purchases">
             <Card className="hover:border-primary transition-colors h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListOrdered className="h-5 w-5 text-accent" /> View Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>See pending and approved purchases.</CardDescription>
              </CardContent>
            </Card>
           </Link>
        </div>
      </div>
    </>
  );
}
