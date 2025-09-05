'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Purchase } from '@/lib/types';
import { getPurchases, updatePurchaseStatus } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';


export default function PurchasesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchPurchases = useCallback(async () => {
    setLoadingData(true);
    const fetchedPurchases = await getPurchases();
    setPurchases(fetchedPurchases);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchPurchases();
    }
  }, [user, authLoading, router, fetchPurchases]);
  
  const handleStatusChange = async (purchaseId: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
        await updatePurchaseStatus(purchaseId, status);
        toast({ title: 'Success', description: 'Purchase status updated.' });
        fetchPurchases();
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  }

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };


  if (authLoading || loadingData) {
    return (
        <div className="container py-10">
            <Skeleton className="h-10 w-1/4 mb-4" />
            <Skeleton className="h-8 w-1/3 mb-8" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-full" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-4xl font-bold">Manage Purchases</h1>
      <p className="text-muted-foreground mb-8">View and manage all user purchase submissions.</p>

      <Card>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {purchases.map(purchase => (
                    <TableRow key={purchase.id}>
                        <TableCell>{purchase.purchaseDate ? format(new Date(purchase.purchaseDate.seconds * 1000), 'PPp') : 'N/A'}</TableCell>
                        <TableCell>{purchase.productName}</TableCell>
                        <TableCell>৳{purchase.productPrice}</TableCell>
                        <TableCell>{purchase.bkashTxnId}</TableCell>
                        <TableCell>
                            <Badge variant={getBadgeVariant(purchase.status)}>{purchase.status}</Badge>
                        </TableCell>
                         <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleStatusChange(purchase.id!, 'approved')}>Approve</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(purchase.id!, 'rejected')}>Reject</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange(purchase.id!, 'pending')}>Set to Pending</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                         </TableCell>
                    </TableRow>
                ))}
                {purchases.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">No purchases found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </Card>
    </div>
  );
}
