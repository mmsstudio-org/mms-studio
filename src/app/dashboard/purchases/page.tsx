
'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Purchase } from '@/lib/types';
import { getPurchases, updatePurchaseRedeemedStatus, deletePurchase } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { MoreHorizontal, Search, Trash2 } from 'lucide-react';
import { ConfirmationDialog } from './_components/confirmation-dialog';

function formatDelay(sentTime: number, receivedTime: number): string {
    const delaySeconds = Math.round((receivedTime - sentTime) / 1000);

    if (delaySeconds < 0) return 'N/A';
    if (delaySeconds < 60) return `${delaySeconds}s`;

    const minutes = Math.floor(delaySeconds / 60);
    const seconds = delaySeconds % 60;

    if (minutes < 60) return `${minutes}m ${seconds}s`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours}h ${remainingMinutes}m`;
}


export default function PurchasesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isStatusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const fetchPurchases = useCallback(async () => {
    setLoadingData(true);
    try {
        const fetchedPurchases = await getPurchases();
        setPurchases(fetchedPurchases);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch purchases.' });
        console.error(e);
    }
    setLoadingData(false);
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchPurchases();
    }
  }, [user, authLoading, router, fetchPurchases]);
  
  const handleStatusChange = async () => {
    if(!selectedPurchase) return;
    try {
        const newStatus = !selectedPurchase.is_redeemed;
        await updatePurchaseRedeemedStatus(selectedPurchase.id, newStatus);
        toast({ title: 'Success', description: 'Purchase status updated.' });
        fetchPurchases();
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
    setSelectedPurchase(null);
  }

  const handleDelete = async () => {
    if(!selectedPurchase) return;
    try {
        await deletePurchase(selectedPurchase.id);
        toast({ title: 'Success', description: 'Purchase deleted.' });
        fetchPurchases();
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete purchase.' });
    }
    setSelectedPurchase(null);
  }

  const getBadgeVariant = (is_redeemed: boolean) => {
    return is_redeemed ? 'default' : 'secondary';
  };
  
  const filteredPurchases = useMemo(() => {
      if (!searchQuery) return purchases;
      return purchases.filter(p => 
        p.txn_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sender && p.sender.toLowerCase().includes(searchQuery.toLowerCase()))
      );
  }, [purchases, searchQuery]);


  if (authLoading || loadingData) {
    return (
        <div className="container py-10">
            <Skeleton className="h-10 w-1/4 mb-4" />
            <Skeleton className="h-8 w-1/3 mb-8" />
            <Card>
                <CardContent className="p-4">
                    <Skeleton className="h-10 w-full mb-4" />
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

  const renderConfirmationDescription = (purchase: Purchase | null) => (
    purchase && (
      <div className="text-sm text-left">
        <p><span className="font-semibold">Txn ID:</span> {purchase.txn_id}</p>
        <p><span className="font-semibold">Amount:</span> ৳{purchase.amount}</p>
        {purchase.sender && <p><span className="font-semibold">Sender:</span> {purchase.sender}</p>}
        <p><span className="font-semibold">Source:</span> {purchase.message_source}</p>
      </div>
    )
  );

  return (
    <>
    <div className="container py-10">
      <h1 className="text-4xl font-bold">Manage Purchases</h1>
      <p className="text-muted-foreground mb-8">View and manage all user purchase submissions.</p>

        <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by Txn ID or Sender..."
                className="w-full rounded-lg bg-background pl-8 md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

      <Card>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Received Time</TableHead>
                    <TableHead>Sent Time</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Txn ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredPurchases.map(purchase => (
                    <TableRow key={purchase.id}>
                        <TableCell>{purchase.received_time ? format(new Date(purchase.received_time), 'Pp') : 'N/A'}</TableCell>
                        <TableCell>{purchase.sent_time ? format(new Date(purchase.sent_time), 'Pp') : 'N/A'}</TableCell>
                        <TableCell>{formatDelay(purchase.sent_time, purchase.received_time)}</TableCell>
                        <TableCell>৳{purchase.amount}</TableCell>
                        <TableCell>{purchase.sender || 'N/A'}</TableCell>
                        <TableCell>{purchase.txn_id}</TableCell>
                        <TableCell>
                            <Badge variant={getBadgeVariant(purchase.is_redeemed)}>{purchase.is_redeemed ? 'Redeemed' : 'Not Redeemed'}</Badge>
                        </TableCell>
                        <TableCell>{purchase.message_source}</TableCell>
                         <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                        setSelectedPurchase(purchase);
                                        setStatusConfirmOpen(true);
                                    }}>
                                      {purchase.is_redeemed ? 'Mark as Not Redeemed' : 'Mark as Redeemed'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => {
                                        setSelectedPurchase(purchase);
                                        setDeleteConfirmOpen(true);
                                    }}>
                                       <Trash2 className="mr-2 h-4 w-4"/> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                         </TableCell>
                    </TableRow>
                ))}
                {filteredPurchases.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={9} className="text-center h-24">No purchases found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </Card>
    </div>
    <ConfirmationDialog
      isOpen={isStatusConfirmOpen}
      onOpenChange={setStatusConfirmOpen}
      onConfirm={handleStatusChange}
      title="Confirm Status Change"
      description={
        <>
          <p>Are you sure you want to change the status for this purchase?</p>
          {renderConfirmationDescription(selectedPurchase)}
        </>
      }
    />
    <ConfirmationDialog
      isOpen={isDeleteConfirmOpen}
      onOpenChange={setDeleteConfirmOpen}
      onConfirm={handleDelete}
      title="Confirm Deletion"
      description={
        <>
         <p>Are you sure you want to permanently delete this purchase record? This action cannot be undone.</p>
         {renderConfirmationDescription(selectedPurchase)}
        </>
      }
      confirmText="Delete"
    />
    </>
  );
}
