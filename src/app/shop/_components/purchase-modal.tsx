'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  bkashTxnId: z.string().min(5, { message: 'Transaction ID must be at least 5 characters.' }),
});

type PurchaseModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
};

export default function PurchaseModal({ isOpen, onOpenChange, product }: PurchaseModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bkashTxnId: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    // Simulate writing 'pending' purchase to Firestore
    console.log('Creating purchase record:', {
      productId: product?.id,
      bkashTxnId: values.bkashTxnId,
      status: 'pending',
    });

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    toast({
      title: 'Purchase Submitted',
      description: 'Your purchase is pending verification. You will receive a coupon code upon approval.',
    });
    form.reset();
    onOpenChange(false);
  }

  if (!product) return null;

  const price = product.discountedPrice ?? product.regularPrice;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            You are purchasing <span className="font-bold text-accent">{product.name}</span> for ৳{price}.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Please complete your payment via bKash and enter the Transaction ID below to submit for verification.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bkashTxnId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>bKash Transaction ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 9A4B7C2D1E" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit for Verification
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
