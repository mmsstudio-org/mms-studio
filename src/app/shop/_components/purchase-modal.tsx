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
import { HowToPayContent } from './how-to-pay';
import { addPurchase } from '@/lib/firestore-service';

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
  const [showHowToPay, setShowHowToPay] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bkashTxnId: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!product) return;
    setIsSubmitting(true);
    
    try {
      await addPurchase({ bkashTxnId: values.bkashTxnId, product });
      toast({
        title: 'Purchase Submitted',
        description: 'Your purchase is pending verification. You will receive a coupon code upon approval.',
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting purchase', error);
       toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (!product) return null;

  const price = product.discountedPrice ?? product.regularPrice;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setShowHowToPay(false);
        form.reset();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{showHowToPay ? "How to Pay" : "Complete Your Purchase"}</DialogTitle>
          {!showHowToPay && (
            <DialogDescription>
              You are purchasing <span className="font-bold text-accent">{product.name}</span> for ৳{price}.
            </DialogDescription>
          )}
        </DialogHeader>

        {showHowToPay ? (
          <div>
            <HowToPayContent productPrice={price} />
            <Button variant="outline" className="w-full mt-4" onClick={() => setShowHowToPay(false)}>Back to Purchase</Button>
          </div>
        ) : (
          <>
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
                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
                   <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => setShowHowToPay(true)}>
                    How to Pay?
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit for Verification
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
