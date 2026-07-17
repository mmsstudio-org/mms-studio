'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { AppDetail } from '@/lib/types';
import { getApps, deleteApp } from '@/lib/firestore-service';
import { PlusCircle, Trash2, Pencil, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';

const Icon = ({ name, className }: { name: string; className: string }) => {
    const LucideIcon = (LucideIcons as any)[name];
    if (!LucideIcon) {
        return <LucideIcons.Smartphone className={className} />;
    }
    return <LucideIcon className={className} />;
};

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

    const handleDeleteCategory = async (appId: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete the category "${name}" and all its products? This cannot be undone.`)) {
            return;
        }

        try {
            await deleteApp(appId);
            toast({ title: 'Success', description: 'Category deleted successfully.' });
            // Update state locally
            setApps(prev => prev.filter(app => app.id !== appId));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting category.' });
        }
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
                    {apps.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            No app categories found. Click "Add New Category" to get started.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Icon</TableHead>
                                        <TableHead>Category Name</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead>Package Name</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {apps.map((app) => (
                                        <TableRow key={app.id}>
                                            <TableCell>
                                                {app.icon && app.icon.startsWith('http') ? (
                                                    <div className="relative h-8 w-8 rounded overflow-hidden border">
                                                        <Image src={app.icon} alt={app.name} fill className="object-cover" />
                                                    </div>
                                                ) : app.icon ? (
                                                    <Icon name={app.icon} className="h-7 w-7 text-accent" />
                                                ) : (
                                                    <div className="h-8 w-8 bg-muted rounded flex items-center justify-center text-accent font-bold text-sm">
                                                        {app.name.charAt(0)}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-semibold">{app.name}</TableCell>
                                            <TableCell>
                                                <code className="text-xs px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground">
                                                    {app.slug || 'no-slug'}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                                {app.pkg || <span className="text-muted-foreground/50">None</span>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button asChild variant="outline" size="sm" title="View Public Shop">
                                                        <Link href={`/shop/${app.slug || app.id}`} target="_blank" className="flex items-center gap-1">
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Shop</span>
                                                        </Link>
                                                    </Button>
                                                    <Button asChild variant="outline" size="sm" title="Edit Category & Products">
                                                        <Link href={`/dashboard/categories/${app.id}/edit`} className="flex items-center gap-1">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                            <span className="hidden sm:inline">Edit</span>
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteCategory(app.id, app.name)}
                                                        title="Delete Category"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
