
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
import { MoreHorizontal, Search, PlusCircle, Trash2, Copy, Pencil, Info, ShieldX, Loader2, Eye } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CouponDetailModal from './_components/coupon-detail-modal';

export default function CouponsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Modal states
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
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
    } catch (e) {
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
  
  const handleViewDetails = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setDetailModalOpen(true);
  }

  const confirmDelete = async () => {
    if (!couponToDelete) return;
    try {
      await deleteCoupon(couponToDelete.id);
      toast({ title: 'Success', description: 'Coupon deleted.' });
      fetchCoupons();
    } catch (error) {
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
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete coupons.' });
    } finally {
      setIsDeletingBatch(false);
    }
  }

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked) {
      setSelectedIds(new Set(paginatedCoupons.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  const handleRowSelect = (id: string, isSelected: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    })
  }

  const getBadgeVariant = (status: 'Active' | 'Expired' | 'Limit Reached' | 'Redeemed'): 'default' | 'secondary' | 'destructive' => {
    if (status === 'Expired' || status === 'Limit Reached' || status === 'Redeemed') return 'destructive';
    if (status === 'Active') return 'secondary';
    return 'default';
  };

  const getStatusText = (coupon: Coupon): 'Active' | 'Expired' | 'Limit Reached' | 'Redeemed' => {
    const now = Date.now();
    if (coupon.validity < now) return 'Expired';
    if (coupon.type === 'single' && coupon.redeem_count >= 1) return 'Redeemed';
    if (coupon.type === 'certain amount' && coupon.redeem_limit !== null && coupon.redeem_count >= coupon.redeem_limit) return 'Limit Reached';
    return 'Active';
  }

  const filteredCoupons = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    if (!lowercasedQuery) return coupons;

    switch (lowercasedQuery) {
        case 'active':
            return coupons.filter(c => getStatusText(c) === 'Active');
        case 'expired':
            return coupons.filter(c => getStatusText(c) === 'Expired');
        case 'redeemed':
            return coupons.filter(c => getStatusText(c) === 'Redeemed');
        case 'limit reached':
            return coupons.filter(c => getStatusText(c) === 'Limit Reached');
        case 'true':
            return coupons.filter(c => c.show_ads === true);
        case 'false':
            return coupons.filter(c => c.show_ads === false);
        default:
            return coupons.filter(c => c.code.toLowerCase().includes(lowercasedQuery));
    }
  }, [coupons, searchQuery]);

  const paginatedCoupons = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCoupons.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCoupons, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchQuery, itemsPerPage]);


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
                <DropdownMenuItem onClick={() => handleViewDetails(coupon)}><Eye className="mr-2 h-4 w-4" />Details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(coupon)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleClone(coupon)}><Copy className="mr-2 h-4 w-4" />Clone</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(coupon)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
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
        <div>
          <h1 className="text-4xl font-bold">Manage Coupons</h1>
          <p className="text-muted-foreground">Create, edit, and manage all coupons.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Tip: Search "active", "expired", "redeemed", "limit reached", "true", or "false" to filter coupons.
          </p>
        </div>

        <div className="flex flex-col-reverse md:flex-row md:justify-end gap-2 my-4">
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
                variant="secondary"
                onClick={() => {
                  setBatchDeleteMode(false);
                  setSelectedIds(new Set());
                }}
              >
                <ShieldX className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setFinalDeleteConfirmOpen(true)}
                disabled={selectedIds.size === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedIds.size})
              </Button>
            </>
          )}
        </div>

        <div className="relative flex-grow mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by coupon code or filter..."
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
                      checked={selectedIds.size > 0 && selectedIds.size === paginatedCoupons.length}
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
              {paginatedCoupons.map(c => {
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
                          <DropdownMenuItem onClick={() => handleViewDetails(c)}><Eye className="mr-2 h-4 w-4" />Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(c)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleClone(c)}><Copy className="mr-2 h-4 w-4" />Clone</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(c)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
              {paginatedCoupons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center h-24">No coupons found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Mobile View */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paginatedCoupons.length > 0 ? paginatedCoupons.map(renderCouponCard) : <p className="text-center text-muted-foreground col-span-full">No coupons found.</p>}
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4 py-4">
            <div className="text-sm text-muted-foreground text-center md:text-left">
              Showing {paginatedCoupons.length} of {filteredCoupons.length} coupons.
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
                <Select
                    value={String(itemsPerPage)}
                    onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Results per page" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="50">50 per page</SelectItem>
                        <SelectItem value="100">100 per page</SelectItem>
                        <SelectItem value="200">200 per page</SelectItem>
                        <SelectItem value="500">500 per page</SelectItem>
                        <SelectItem value="1000">1000 per page</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex items-center justify-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            </div>
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
       <CouponDetailModal
        isOpen={isDetailModalOpen}
        onOpenChange={setDetailModalOpen}
        coupon={selectedCoupon}
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
