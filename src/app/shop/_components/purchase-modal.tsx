
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
import type { Product, SiteInfo } from "@/lib/types";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { HowToPayContent } from "./how-to-pay";
import { getSiteInfo } from "@/lib/firestore-service";

const formSchema = z.object({
  bkashTxnId: z
    .string()
    .min(5, { message: "Transaction ID must be at least 5 characters." }),
});

type PurchaseModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
};

export default function PurchaseModal({
  isOpen,
  onOpenChange,
  product,
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
    if (
      !product ||
      !siteInfo?.paymentApiBaseUrl ||
      !siteInfo?.paymentApiKey ||
      !siteInfo?.couponApiBaseUrl ||
      !siteInfo?.couponApiKey
    ) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description:
          "The site is not configured for automated payments. Please contact support.",
        duration: 30000,
      });
      return;
    }
    setIsSubmitting(true);
    const txnId = values.bkashTxnId.toUpperCase();
    const productPrice =
      product.discountedPrice && product.discountedPrice > 0
        ? product.discountedPrice
        : product.regularPrice;

    try {
      // 1. Verify Transaction via proxy
      const verifyUrl = `/api/verify-payment/${txnId}?apiKey=${encodeURIComponent(
        siteInfo.paymentApiKey
      )}&baseUrl=${encodeURIComponent(siteInfo.paymentApiBaseUrl)}`;
      const verifyRes = await fetch(verifyUrl);
      const verifyData = await verifyRes.json();

      if (verifyData.error || !verifyData.id) {
        throw new Error("Invalid Transaction ID.");
      }

      if (verifyData.is_redeemed) {
        throw new Error(
          `This transaction ID is already used. If you’ve redeemed this purchase before, your coupon code is “${txnId}”.`
        );
      }

      // 2. Match Amount
      const transactionAmount = Number(verifyData.amount);
      if (transactionAmount < productPrice) {
        throw new Error(
          `The paid amount (৳${transactionAmount}) is less than the product price (৳${productPrice}).`
        );
      }

      // 3. Create Coupon via proxy
      const validityDate = new Date();
      validityDate.setDate(
        validityDate.getDate() + (product.subscriptionDays || 30)
      );

      const couponBody = {
        code: txnId,
        validity: validityDate.toISOString(),
        coin_amount: product.type === "subscription" ? 0 : (product.coinAmount || 0),
        type: "single",
        show_ads: product.type !== "subscription",
        note: `Purchased: ${product.name} - ${product.description || ''}`,
      };
      
      console.log("Creating coupon with body:", couponBody);

      const couponUrl = `/api/coupon?apiKey=${encodeURIComponent(
        siteInfo.couponApiKey
      )}&baseUrl=${encodeURIComponent(siteInfo.couponApiBaseUrl)}`;
      const couponRes = await fetch(couponUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponBody),
      });

      const couponData = await couponRes.json();
      if (!couponData.success) {
        console.error("Coupon creation failed:", couponData);
        throw new Error(couponData.message || "Failed to create coupon: Missing required fields.");
      }

      // 4. Mark as Redeemed via proxy
      const redeemUrl = `/api/verify-payment/${txnId}?apiKey=${encodeURIComponent(
        siteInfo.paymentApiKey
      )}&baseUrl=${encodeURIComponent(siteInfo.paymentApiBaseUrl)}`;
      await fetch(redeemUrl, { method: "PUT" });

      // 5. Success
      toast({
        title: "Verification Successful!",
        description: `Your transaction has been successfully verified. Use your transaction ID (“${txnId}”) as your coupon code to redeem your purchase.`,
        duration: 30000,
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "An unexpected error occurred.",
        duration: 30000,
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
            <HowToPayContent productPrice={price} />
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
                        <Input placeholder="e.g., 9A4B7C2D1E" {...field} />
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
