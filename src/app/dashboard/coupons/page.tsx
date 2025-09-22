
'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Coupon } from '@/lib/types';
import { getCoupons, deleteCoupon, deleteCouponsBatch } from '@/lib/firestore-service';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { MoreHorizontal, Search, PlusCircle, Trash2, Copy, Pencil, Info, ShieldX, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from '../purchases/_components/confirmation-dialog';
import CouponEditModal from './_components/coupon-edit-modal';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';


export default function CouponsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'clone'>('add');

  // Delete confirmation
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  
  // Batch delete states
  const [isBatchDeleteMode, setBatchDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isEnableBatchConfirmOpen, setEnableBatchConfirmOpen] = useState(false);
  const [isFinalDeleteConfirmOpen, setFinalDeleteConfirmOpen] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);


  const fetchCoupons = useCallback(async () => {
    setLoadingData(true);
    try {
        const fetchedCoupons = await getCoupons();
        setCoupons(fetchedCoupons);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch coupons.' });
        console.error(e);
    }
    setLoadingData(false);
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      fetchCoupons();
    }
  }, [user, authLoading, router, fetchCoupons]);
  
  const handleAddNew = () => {
    setSelectedCoupon(null);
    setModalMode('add');
    setModalOpen(true);
  }

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setModalMode('edit');
    setModalOpen(true);
  }

  const handleClone = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setModalMode('clone');
    setModalOpen(true);
  }

  const handleDelete = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setDeleteConfirmOpen(true);
  }

  const confirmDelete = async () => {
    if(!couponToDelete) return;
    try {
        await deleteCoupon(couponToDelete.id);
        toast({ title: 'Success', description: 'Coupon deleted.' });
        fetchCoupons();
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete coupon.' });
    }
    setCouponToDelete(null);
  }
  
  const handleBatchDelete = async () => {
    setIsDeletingBatch(true);
    try {
      await deleteCouponsBatch(Array.from(selectedIds));
      toast({ title: 'Success', description: `${selectedIds.size} coupons deleted.` });
      fetchCoupons();
      setSelectedIds(new Set());
      setBatchDeleteMode(false);
    } catch(error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete coupons.' });
    } finally {
      setIsDeletingBatch(false);
    }
  }

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if(checked) {
        setSelectedIds(new Set(filteredCoupons.map(p => p.id)));
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
  
  const getBadgeVariant = (status: 'Active' | 'Expired' | 'Limit Reached'): 'default' | 'secondary' | 'destructive' => {
    if (status === 'Expired' || status === 'Limit Reached') return 'destructive';
    return 'secondary';
  };

  const getStatusText = (coupon: Coupon) => {
    const now = Date.now();
    if (coupon.validity < now) return 'Expired';
    if (coupon.type === 'certain amount' && coupon.redeem_limit !== null && coupon.redeem_count >= coupon.redeem_limit) return 'Limit Reached';
    return 'Active';
  }
  
  const filteredCoupons = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    if (!lowercasedQuery) return coupons;
    
    if (lowercasedQuery === 'expired') {
      return coupons.filter(c => getStatusText(c) === 'Expired');
    }
    if (lowercasedQuery === 'limit reached') {
        return coupons.filter(c => getStatusText(c) === 'Limit Reached');
    }

    return coupons.filter(c => c.code.toLowerCase().includes(lowercasedQuery));
  }, [coupons, searchQuery]);


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

  const renderCouponCard = (coupon: Coupon) => {
    const status = getStatusText(coupon);
    return (
        <Card key={coupon.id} data-state={selectedIds.has(coupon.id) ? "selected" : undefined}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                         {isBatchDeleteMode && (
                            <Checkbox 
                                checked={selectedIds.has(coupon.id)}
                                onCheckedChange={(checked) => handleRowSelect(coupon.id, !!checked)}
                                aria-label={`Select coupon ${coupon.code}`}
                             />
                           )}
                        <div>
                            <CardTitle className="font-mono text-lg">{coupon.code}</CardTitle>
                            <Badge variant={getBadgeVariant(status)} className="mt-1">{status}</Badge>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isBatchDeleteMode}>
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(coupon)}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClone(coupon)}><Copy className="mr-2 h-4 w-4"/>Clone</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(coupon)}>
                                <Trash2 className="mr-2 h-4 w-4"/> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <p><strong>Coins:</strong> {coupon.coins}</p>
                <p><strong>Type:</strong> <span className="capitalize">{coupon.type}</span></p>
                <p><strong>Usage:</strong> {coupon.type === 'certain amount' && coupon.redeem_limit !== null ? `${coupon.redeem_count} / ${coupon.redeem_limit}` : coupon.redeem_count}</p>
                <p><strong>Show Ads:</strong> {coupon.show_ads ? 'Yes' : 'No'}</p>
                <p><strong>Created:</strong> {format(new Date(coupon.created), 'Pp')}</p>
                <p><strong>Validity:</strong> {format(new Date(coupon.validity), 'Pp')}</p>
                {coupon.note && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <p className="truncate text-xs text-muted-foreground pt-2 border-t mt-2">
                                    <strong>Note:</strong> {coupon.note}
                                </p>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{coupon.note}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </CardContent>
        </Card>
    );
  }

  return (
    <>
    <div className="container py-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-1">
            <div>
                <h1 className="text-4xl font-bold">Manage Coupons</h1>
                <p className="text-muted-foreground">Create, edit, and manage all coupons.</p>
            </div>
             <div className="flex items-center gap-2">
              {!isBatchDeleteMode ? (
                <>
                  <Button variant="outline" onClick={() => setEnableBatchConfirmOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Batch Delete
                  </Button>
                  <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Coupon
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setFinalDeleteConfirmOpen(true)}
                    disabled={selectedIds.size === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedIds.size})
                  </Button>
                   <Button
                    variant="secondary"
                    onClick={() => {
                      setBatchDeleteMode(false);
                      setSelectedIds(new Set());
                    }}
                  >
                    <ShieldX className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </>
              )}
            </div>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
            Tip: Search "expired" or "limit reached" to filter coupons.
        </p>

        <div className="relative flex-grow mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search by coupon code..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        {/* Desktop Table */}
        <Card className="hidden md:block">
            <Table>
                <TableHeader>
                    <TableRow>
                        {isBatchDeleteMode && (
                            <TableHead className="w-[50px]">
                                <Checkbox 
                                    onCheckedChange={handleSelectAll}
                                    checked={selectedIds.size > 0 && selectedIds.size === filteredCoupons.length}
                                    aria-label="Select all"
                                />
                            </TableHead>
                        )}
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Coins</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Show Ads</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Validity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredCoupons.map(c => {
                        const status = getStatusText(c);
                        return (
                            <TableRow key={c.id} data-state={selectedIds.has(c.id) && "selected"}>
                                {isBatchDeleteMode && (
                                   <TableCell>
                                     <Checkbox 
                                        checked={selectedIds.has(c.id)}
                                        onCheckedChange={(checked) => handleRowSelect(c.id, !!checked)}
                                        aria-label={`Select coupon ${c.code}`}
                                     />
                                   </TableCell>
                                )}
                                <TableCell className="font-mono">
                                    <div className="flex items-center gap-2">
                                        <span>{c.code}</span>
                                        {c.note && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="max-w-xs">{c.note}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell><Badge variant={getBadgeVariant(status)}>{status}</Badge></TableCell>
                                <TableCell className="capitalize">{c.type}</TableCell>
                                <TableCell>{c.coins}</TableCell>
                                <TableCell>{c.type === 'certain amount' && c.redeem_limit !== null ? `${c.redeem_count} / ${c.redeem_limit}` : c.redeem_count}</TableCell>
                                <TableCell>{c.show_ads ? 'Yes' : 'No'}</TableCell>
                                <TableCell>{format(new Date(c.created), 'PPp')}</TableCell>
                                <TableCell>{format(new Date(c.validity), 'PPp')}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isBatchDeleteMode}>
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(c)}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleClone(c)}><Copy className="mr-2 h-4 w-4"/>Clone</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(c)}>
                                                <Trash2 className="mr-2 h-4 w-4"/> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                     {filteredCoupons.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={10} className="text-center h-24">No coupons found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Card>

        {/* Mobile View */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredCoupons.length > 0 ? filteredCoupons.map(renderCouponCard) : <p className="text-center text-muted-foreground col-span-full">No coupons found.</p>}
        </div>
    </div>
    <CouponEditModal
        isOpen={isModalOpen}
        onOpenChange={setModalOpen}
        coupon={selectedCoupon}
        mode={modalMode}
        onCouponUpdate={() => {
            setModalOpen(false);
            fetchCoupons();
        }}
    />
    <ConfirmationDialog
      isOpen={isDeleteConfirmOpen}
      onOpenChange={setDeleteConfirmOpen}
      onConfirm={confirmDelete}
      title="Confirm Deletion"
      description={
        <>
         <p>Are you sure you want to permanently delete this coupon? This action cannot be undone.</p>
         {couponToDelete && (
            <div className="text-sm text-left mt-4 border-t pt-2">
                <p><span className="font-semibold">Code:</span> {couponToDelete.code}</p>
                <p><span className="font-semibold">Note:</span> {couponToDelete.note || 'N/A'}</p>
            </div>
         )}
        </>
      }
      confirmText="Delete"
    />
     <ConfirmationDialog
        isOpen={isEnableBatchConfirmOpen}
        onOpenChange={setEnableBatchConfirmOpen}
        title="Enable Batch Delete Mode?"
        description={<p>Checkboxes will appear next to each item, allowing you to select multiple coupons for deletion.</p>}
        confirmText="Enable"
        onConfirm={() => setBatchDeleteMode(true)}
    />
    <ConfirmationDialog
        isOpen={isFinalDeleteConfirmOpen}
        onOpenChange={setFinalDeleteConfirmOpen}
        onConfirm={handleBatchDelete}
        title={`Delete ${selectedIds.size} Coupons?`}
        description={
          <>
            <p>You are about to permanently delete <span className="font-bold">{selectedIds.size}</span> coupons. This action cannot be undone.</p>
            {isDeletingBatch && <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin" />}
          </>
        }
        confirmText="Delete Permanently"
    />
    </>
  );
}

    
    