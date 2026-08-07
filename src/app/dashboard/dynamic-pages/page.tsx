'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { DynamicPage } from '@/lib/types';
import { getDynamicPages, deleteDynamicPage, updateDynamicPage } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useConfirm } from '@/components/ui/confirm-provider';
import { PlusCircle, Trash2, Pencil, Eye, FileText, Loader2, Calendar, ListOrdered } from 'lucide-react';
import Link from 'next/link';

export default function DynamicPagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [pages, setPages] = useState<DynamicPage[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchPages = useCallback(async () => {
    setLoadingData(true);
    try {
      const fetchedPages = await getDynamicPages();
      setPages(fetchedPages);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch pages.' });
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchPages();
    }
  }, [user, authLoading, router, fetchPages]);

  const toggleStatus = async (page: DynamicPage) => {
    if (!page.id) return;
    const newStatus = page.status === 'published' ? 'draft' : 'published';
    try {
      await updateDynamicPage(page.id, { status: newStatus, updatedAt: Date.now() });
      toast({ title: 'Success', description: `Page changed to ${newStatus}.` });
      fetchPages();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to toggle status.' });
    }
  };

  const handleDelete = async (page: DynamicPage) => {
    if (!page.id) return;
    const confirmed = await confirm({
      title: 'Delete Page',
      description: `Are you sure you want to delete the page "${page.title}"? This action is permanent.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      await deleteDynamicPage(page.id);
      toast({ title: 'Success', description: 'Page deleted successfully.' });
      fetchPages();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete page.' });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container py-10 text-center">
        <Skeleton className="h-10 w-48 mx-auto mb-4" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
    );
  }

  return (
    <div className="container py-10 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold font-['Orbitron']">Dynamic Pages</h1>
          <p className="text-muted-foreground">Manage static-content pages like Privacy Policy, Terms, About Us, etc.</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/dynamic-pages/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Page
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loadingData ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : pages.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
              No dynamic pages found. Click "Add New Page" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40">
                    <th className="text-left font-semibold p-4">Title</th>
                    <th className="text-left font-semibold p-4">Slug</th>
                    <th className="text-left font-semibold p-4">Status</th>
                    <th className="text-left font-semibold p-4">Footer</th>
                    <th className="text-left font-semibold p-4">Order</th>
                    <th className="text-left font-semibold p-4">Last Updated</th>
                    <th className="text-right font-semibold p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr key={page.id} className="border-b border-border/40 hover:bg-muted/20">
                      <td className="p-4 font-semibold max-w-[220px] truncate">{page.title}</td>
                      <td className="p-4">
                        <code className="text-xs px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground">
                          {page.slug}
                        </code>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={page.status === 'published' ? 'default' : 'secondary'}
                          className="cursor-pointer hover:opacity-80"
                          onClick={() => toggleStatus(page)}
                        >
                          {page.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {page.showInFooter ? (
                          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground/60">No</span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ListOrdered className="h-3.5 w-3.5" /> {page.order}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(page.updatedAt), 'dd MMM yyyy')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {page.status === 'published' && (
                            <Button asChild variant="outline" size="icon" title="View Page">
                              <Link href={`/pages/${page.slug}`} target="_blank">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          <Button asChild variant="outline" size="icon" title="Edit Page">
                            <Link href={`/dashboard/dynamic-pages/${page.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(page)}
                            title="Delete Page"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}