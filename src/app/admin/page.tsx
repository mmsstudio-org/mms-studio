'use client';

import { useState } from 'react';
import type { Purchase } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle } from 'lucide-react';

const mockPurchases: Purchase[] = [
  {
    id: 'pur_1',
    product: {
      id: 'bcs_sub_monthly',
      appId: 'bcs',
      type: 'subscription',
      name: 'BCS Monthly',
      description: '',
      regularPrice: 1000,
      imageUrl: '',
    },
    bkashTxnId: 'TXN123456789',
    status: 'pending',
    purchaseDate: new Date().toISOString(),
  },
  {
    id: 'pur_2',
    product: {
      id: 'bnc_coins_500',
      appId: 'bnc',
      type: 'coins',
      name: '500 BNC Coins',
      description: '',
      regularPrice: 500,
      imageUrl: '',
    },
    bkashTxnId: 'TXN987654321',
    status: 'pending',
    purchaseDate: new Date().toISOString(),
  },
   {
    id: 'pur_3',
    product: {
      id: 'api_tier_1',
      appId: 'api',
      type: 'coins',
      name: 'API Tier 1',
      description: '',
      regularPrice: 2500,
      imageUrl: '',
    },
    bkashTxnId: 'TXNABCDEF123',
    status: 'approved',
    couponCode: 'COUPON-XYZ-123',
    purchaseDate: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function AdminPage() {
  const [purchases, setPurchases] = useState<Purchase[]>(mockPurchases);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [isAlertOpen, setAlertOpen] = useState(false);
  const { toast } = useToast();

  const handleApproveClick = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setAlertOpen(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedPurchase || !couponCode) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Coupon code cannot be empty.',
        });
        return;
    }

    // Simulate updating Firestore
    setPurchases(purchases.map(p => 
        p.id === selectedPurchase.id 
        ? { ...p, status: 'approved', couponCode } 
        : p
    ));
    
    toast({
        title: 'Purchase Approved',
        description: `Coupon ${couponCode} issued for purchase ${selectedPurchase.id}.`,
    });

    setAlertOpen(false);
    setSelectedPurchase(null);
    setCouponCode('');
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Admin Verification</h1>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>bKash Txn ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell className="font-medium">{purchase.product.name}</TableCell>
                <TableCell>{purchase.bkashTxnId}</TableCell>
                <TableCell>{new Date(purchase.purchaseDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={purchase.status === 'pending' ? 'secondary' : purchase.status === 'approved' ? 'default' : 'destructive'} className={purchase.status === 'approved' ? 'bg-green-600' : ''}>
                    {purchase.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {purchase.status === 'pending' ? (
                    <Button onClick={() => handleApproveClick(purchase)} size="sm">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      {purchase.couponCode || 'N/A'}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Verify the bKash transaction and issue a coupon code. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label htmlFor="coupon" className="text-sm font-medium">Coupon Code</label>
            <Input 
                id="coupon" 
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter generated coupon code"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmApproval} className="bg-primary hover:bg-primary/90">
                Confirm Approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
