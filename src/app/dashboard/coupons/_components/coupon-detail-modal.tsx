
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Coupon } from '@/lib/types';
import { format } from 'date-fns';

type CouponDetailModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  coupon: Coupon | null;
};

export default function CouponDetailModal({ isOpen, onOpenChange, coupon }: CouponDetailModalProps) {
  if (!coupon) return null;

  const detailItems = [
    { label: 'Code', value: coupon.code },
    { label: 'Coins', value: coupon.coins },
    { label: 'Type', value: coupon.type, className: 'capitalize' },
    { label: 'Usage Count', value: coupon.redeem_count },
    { label: 'Usage Limit', value: coupon.type === 'certain amount' ? coupon.redeem_limit : 'N/A' },
    { label: 'Show Ads', value: coupon.show_ads ? 'Yes' : 'No' },
    { label: 'Package Name', value: coupon.pkg || 'N/A' },
    { label: 'Created', value: format(new Date(coupon.created), 'PPpp') },
    { label: 'Valid Until', value: format(new Date(coupon.validity), 'PPpp') },
    { label: 'Note', value: coupon.note || 'N/A', fullWidth: true, isCode: true },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Coupon Details</DialogTitle>
          <DialogDescription>Raw data for coupon code: <span className="font-mono font-bold">{coupon.code}</span></DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4 text-sm">
          {detailItems.map(item => (
            <div
              key={item.label}
              className={`flex justify-between items-start border-b pb-2 ${item.fullWidth ? 'flex-col' : ''}`}
            >
              <span className="font-semibold text-muted-foreground">{item.label}</span>
              <span className={`${item.isCode ? 'font-mono bg-muted p-2 rounded-md w-full mt-1 break-all' : ''} ${item.className || ''}`}>
                {String(item.value)}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
