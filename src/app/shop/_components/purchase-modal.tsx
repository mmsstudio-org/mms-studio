
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { Product, SiteInfo, AppDetail } from "@/lib/types";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { HowToPayContent } from "./how-to-pay";
import { getSiteInfo, getPurchaseByTxnId, getCoupon, addCoupon, updatePurchaseRedeemedStatus } from "@/lib/firestore-service";

const formSchema = z.object({
  bkashTxnId: z
    .string()
    .min(5, { message: "Transaction ID must be at least 5 characters." }),
});

type PurchaseModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
  app: AppDetail | null;
};

export default function PurchaseModal({
  isOpen,
  onOpenChange,
  product,
  app,
}: PurchaseModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHowToPay, setShowHowToPay] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);

  useEffect(() => {
    async function fetchInfo() {
      if (isOpen) {
        const info = await getSiteInfo();
        setSiteInfo(info);
      }
    }
    fetchInfo();
  }, [isOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bkashTxnId: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!product) {
        toast({ variant: 'destructive', title: 'Product Error', description: 'No product selected for purchase.' });
        return;
    }
    setIsSubmitting(true);
    const txnId = values.bkashTxnId.toUpperCase();
    const productPrice =
      product.discountedPrice && product.discountedPrice > 0
        ? product.discountedPrice
        : product.regularPrice;

    try {
      // 1. Find the purchase record in Firestore
      const purchaseRecord = await getPurchaseByTxnId(txnId);
      if (!purchaseRecord) {
        throw new Error("Invalid Transaction ID.");
      }
      
      // 2. Check if already redeemed
      if (purchaseRecord.is_redeemed) {
        throw new Error(
          `This transaction ID has already been used. Your coupon code is "${txnId}".`
        );
      }
      
      // 3. Match Amount
      const transactionAmount = Number(purchaseRecord.amount);
      if (transactionAmount < productPrice) {
        throw new Error(
          `The paid amount (৳${transactionAmount}) is less than the product price (৳${productPrice}).`
        );
      }

      // 4. Check if a coupon with this code already exists
      const existingCoupon = await getCoupon(txnId);
      if(existingCoupon) {
        // This case should be rare if is_redeemed flag is working correctly, but it's a good safeguard.
        throw new Error(`This transaction ID has already been used to generate a coupon. Your coupon code is "${txnId}".`);
      }

      // 5. Create Coupon
      const validityDate = new Date();
      validityDate.setDate(
        validityDate.getDate() + (product.subscriptionDays || 30)
      );

      const newCoupon = {
        code: txnId,
        validity: validityDate.getTime(),
        coins: product.type === "subscription" ? 1 : (product.coinAmount || 1),
        type: 'single' as const,
        show_ads: product.type !== "subscription",
        note: `Purchased: ${product.name} - ${product.description || ''}`,
        created: Date.now(),
        redeem_count: 0,
        redeem_limit: 1,
      };
      
      await addCoupon(newCoupon);

      // 6. Mark as Redeemed
      await updatePurchaseRedeemedStatus(purchaseRecord.id, true);

      // 7. Success
      toast({
        title: "Verification Successful!",
        description: `Your transaction has been successfully verified. Use your transaction ID (“${txnId}”) as your coupon code to redeem your purchase.`,
        duration: 15000,
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "An unexpected error occurred.",
        duration: 8000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!product) return null;

  const price =
    product.discountedPrice && product.discountedPrice > 0
      ? product.discountedPrice
      : product.regularPrice;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setShowHowToPay(false);
          form.reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {showHowToPay ? "How to Pay" : "Complete Your Purchase"}
          </DialogTitle>
          {!showHowToPay && (
            <DialogDescription>
              You are purchasing{" "}
              <span className="font-bold text-accent">{product.name}</span> for
              ৳{price}.
            </DialogDescription>
          )}
        </DialogHeader>

        {showHowToPay ? (
          <div>
            <HowToPayContent productPrice={price} youtubeVideoId={app?.youtubeVideoId}/>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setShowHowToPay(false)}
            >
              Back to Purchase
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Please complete your payment via bKash and enter the Transaction
              ID below to submit for verification.
            </p>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="bkashTxnId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>bKash Transaction ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 9A4B7C2D1E" {...field} onChange={e => field.onChange(e.target.value.toUpperCase().replace(/\s+/g, ''))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full sm:w-auto"
                    onClick={() => setShowHowToPay(true)}
                  >
                    How to Pay?
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
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
