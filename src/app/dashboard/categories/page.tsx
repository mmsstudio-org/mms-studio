'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { AppDetail } from '@/lib/types';
import { getApps } from '@/lib/firestore-service';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import CategoriesTable from './_components/categories-table';

export default function CategoriesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [apps, setApps] = useState<AppDetail[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const fetchCategories = useCallback(async () => {
        setLoadingData(true);
        try {
            const fetchedApps = await getApps();
            setApps(fetchedApps);
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error fetching categories.' });
        } finally {
            setLoadingData(false);
        }
    }, [toast]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
        if (user) {
            fetchCategories();
        }
    }, [user, authLoading, router, fetchCategories]);

    const handleDelete = (appId: string) => {
        setApps(prev => prev.filter(app => app.id !== appId));
    };

    if (authLoading || loadingData) {
        return (
            <div className="container py-10 px-4">
                <Skeleton className="h-10 w-48 mb-4" />
                <Skeleton className="h-4 w-64 mb-8" />
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="container py-10 px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold font-['Orbitron']">Manage Categories</h1>
                    <p className="text-muted-foreground">Add, edit, or remove app categories and manage their products.</p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/dashboard/categories/new">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
                    </Link>
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <CategoriesTable apps={apps} onDelete={handleDelete} />
                </CardContent>
            </Card>
        </div>
    );
}