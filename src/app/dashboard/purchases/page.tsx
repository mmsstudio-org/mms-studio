
'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { getPurchases, updatePurchaseRedeemedStatus, deletePurchase, deletePurchasesBatch } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { MoreHorizontal, Search, Trash2, ShieldX, Loader2 } from 'lucide-react';
import { ConfirmationDialog } from './_components/confirmation-dialog';
import { Checkbox } from '@/components/ui/checkbox';

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
  
  // Batch delete states
  const [isBatchDeleteMode, setBatchDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isEnableBatchConfirmOpen, setEnableBatchConfirmOpen] = useState(false);
  const [isFinalDeleteConfirmOpen, setFinalDeleteConfirmOpen] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);


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

  const handleBatchDelete = async () => {
    setIsDeletingBatch(true);
    try {
      await deletePurchasesBatch(Array.from(selectedIds));
      toast({ title: 'Success', description: `${selectedIds.size} purchases deleted.` });
      fetchPurchases();
      setSelectedIds(new Set());
      setBatchDeleteMode(false);
    } catch(error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete purchases.' });
    } finally {
      setIsDeletingBatch(false);
    }
  }

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if(checked) {
        setSelectedIds(new Set(filteredPurchases.map(p => p.id)));
    } else {
        setSelectedIds(new Set());
    }
  }

  const handleRowSelect = (id: string, isSelected: boolean) => {
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        if(isSelected) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        return newSet;
    })
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

  const summaryStats = useMemo(() => {
    return purchases.reduce((acc, p) => {
      acc.totalTransactions++;
      acc.totalAmount += p.amount;
      if (p.is_redeemed) {
        acc.redeemedTransactions++;
        acc.redeemedAmount += p.amount;
      }
      return acc;
    }, { totalTransactions: 0, totalAmount: 0, redeemedTransactions: 0, redeemedAmount: 0 });
  }, [purchases]);

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

  const renderActionsDropdown = (purchase: Purchase) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isBatchDeleteMode}>
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
  );

  return (
    <>
    <div className="container py-10">
      <h1 className="text-4xl font-bold">Manage Purchases</h1>
      <p className="text-muted-foreground mb-8">View and manage all user purchase submissions.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Redeemed Amount</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">৳{summaryStats.redeemedAmount.toFixed(2)}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">৳{summaryStats.totalAmount.toFixed(2)}</div>
              </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Redeemed Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{summaryStats.redeemedTransactions}</div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{summaryStats.totalTransactions}</div>
              </CardContent>
          </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by Txn ID or Sender..."
                className="w-full rounded-lg bg-background pl-8 md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        {!isBatchDeleteMode ? (
          <Button variant="outline" onClick={() => setEnableBatchConfirmOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Batch Delete
          </Button>
        ) : (
          <>
            <Button variant="destructive" onClick={() => setFinalDeleteConfirmOpen(true)} disabled={selectedIds.size === 0}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedIds.size})
            </Button>
            <Button variant="secondary" onClick={() => {
              setBatchDeleteMode(false);
              setSelectedIds(new Set());
            }}>
              <ShieldX className="mr-2 h-4 w-4" /> Cancel
            </Button>
          </>
        )}
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <Table>
            <TableHeader>
                <TableRow>
                    {isBatchDeleteMode && (
                        <TableHead className="w-[50px]">
                            <Checkbox 
                                onCheckedChange={handleSelectAll}
                                checked={selectedIds.size > 0 && selectedIds.size === filteredPurchases.length}
                                aria-label="Select all"
                            />
                        </TableHead>
                    )}
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
                    <TableRow key={purchase.id} data-state={selectedIds.has(purchase.id) && "selected"}>
                        {isBatchDeleteMode && (
                           <TableCell>
                             <Checkbox 
                                checked={selectedIds.has(purchase.id)}
                                onCheckedChange={(checked) => handleRowSelect(purchase.id, !!checked)}
                                aria-label={`Select purchase ${purchase.txn_id}`}
                             />
                           </TableCell>
                        )}
                        <TableCell>{purchase.received_time ? format(new Date(purchase.received_time), 'PPp') : 'N/A'}</TableCell>
                        <TableCell>{purchase.sent_time ? format(new Date(purchase.sent_time), 'PPp') : 'N/A'}</TableCell>
                        <TableCell>{formatDelay(purchase.sent_time, purchase.received_time)}</TableCell>
                        <TableCell>৳{purchase.amount}</TableCell>
                        <TableCell>{purchase.sender || 'N/A'}</TableCell>
                        <TableCell>{purchase.txn_id}</TableCell>
                        <TableCell>
                            <Badge variant={getBadgeVariant(purchase.is_redeemed)}>{purchase.is_redeemed ? 'Redeemed' : 'Not Redeemed'}</Badge>
                        </TableCell>
                        <TableCell>{purchase.message_source}</TableCell>
                         <TableCell className="text-right">
                           {renderActionsDropdown(purchase)}
                         </TableCell>
                    </TableRow>
                ))}
                {filteredPurchases.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={isBatchDeleteMode ? 10 : 9} className="text-center h-24">No purchases found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredPurchases.map(purchase => (
            <Card key={purchase.id} className={selectedIds.has(purchase.id) ? "border-primary" : ""}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                           {isBatchDeleteMode && (
                            <Checkbox 
                                checked={selectedIds.has(purchase.id)}
                                onCheckedChange={(checked) => handleRowSelect(purchase.id, !!checked)}
                                aria-label={`Select purchase ${purchase.txn_id}`}
                             />
                           )}
                          <CardTitle className="text-lg">৳{purchase.amount}</CardTitle>
                        </div>
                        {renderActionsDropdown(purchase)}
                    </div>
                    <Badge variant={getBadgeVariant(purchase.is_redeemed)} className="w-fit">{purchase.is_redeemed ? 'Redeemed' : 'Not Redeemed'}</Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><span className="font-semibold">Txn ID:</span> {purchase.txn_id}</p>
                    <p><span className="font-semibold">Sender:</span> {purchase.sender || 'N/A'}</p>
                    <p><span className="font-semibold">Source:</span> {purchase.message_source}</p>
                    <p><span className="font-semibold">Received:</span> {purchase.received_time ? format(new Date(purchase.received_time), 'Pp') : 'N/A'}</p>
                    <p><span className="font-semibold">Sent:</span> {purchase.sent_time ? format(new Date(purchase.sent_time), 'Pp') : 'N/A'}</p>
                    <p><span className="font-semibold">Delay:</span> {formatDelay(purchase.sent_time, purchase.received_time)}</p>
                </CardContent>
            </Card>
        ))}
        {filteredPurchases.length === 0 && (
           <Card className="text-center h-24 flex items-center justify-center">
             <p className="text-muted-foreground">No purchases found.</p>
           </Card>
        )}
      </div>
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
     <ConfirmationDialog
        isOpen={isEnableBatchConfirmOpen}
        onOpenChange={setEnableBatchConfirmOpen}
        onConfirm={() => setBatchDeleteMode(true)}
        title="Enable Batch Delete Mode?"
        description={<p>You are about to enter batch delete mode. Checkboxes will appear next to each item, allowing you to select multiple purchases for deletion.</p>}
        confirmText="Enable"
    />
    <ConfirmationDialog
        isOpen={isFinalDeleteConfirmOpen}
        onOpenChange={setFinalDeleteConfirmOpen}
        onConfirm={handleBatchDelete}
        title={`Delete ${selectedIds.size} Purchases?`}
        description={
          <>
            <p>You are about to permanently delete <span className="font-bold">{selectedIds.size}</span> purchase records. This action cannot be undone.</p>
            {isDeletingBatch && <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin" />}
          </>
        }
        confirmText="Delete Permanently"
    />
    </>
  );
}
