"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getSiteInfo } from "@/lib/firestore-service";
import type { SiteInfo } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import HelpCenterModal from "@/app/_components/help-center-modal";

export const HowToPayContent = ({
  productPrice,
}: {
  productPrice?: number;
}) => {
  const { toast } = useToast();
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHelpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    async function fetchInfo() {
      const info = await getSiteInfo();
      setSiteInfo(info);
      setLoading(false);
    }
    fetchInfo();
  }, []);

  const copyToClipboard = () => {
    if (!siteInfo?.bkashNumber) return;
    navigator.clipboard.writeText(siteInfo.bkashNumber);
    toast({
      title: "Copied!",
      description: "bKash number copied to clipboard.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-4 w-1/4 mx-auto" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!siteInfo || !siteInfo.bkashNumber) {
    return (
      <div className="text-center text-muted-foreground">
        Payment information is not available at the moment.
      </div>
    );
  }

  return (
    <>
      <div
        className="space-y-4 max-h-[80vh] overflow-auto p-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="p-4 border rounded-lg">
          <p className="font-bold text-lg">Send Money to:</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xl font-mono text-accent">
              {siteInfo.bkashNumber}
            </span>
            <Button variant="ghost" size="icon" onClick={copyToClipboard}>
              <Copy className="h-5 w-5" />
            </Button>
          </div>
          {productPrice && productPrice > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Amount to send:{" "}
              <span className="font-bold text-foreground">৳{productPrice}</span>
            </p>
          )}
        </div>

        {siteInfo.bkashQrCodeUrl && (
          <>
            <div className="text-center text-sm text-muted-foreground">OR</div>
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <p className="font-bold text-lg mb-2">Scan QR Code</p>
              <Image
                src={siteInfo.bkashQrCodeUrl}
                alt="bKash QR Code"
                width={150}
                height={150}
                className="rounded-md"
                data-ai-hint="qr code payment"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Use the bKash app to scan and pay.
              </p>
            </div>
          </>
        )}

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              How to find Transaction ID (TxnID)?
            </AccordionTrigger>
            <AccordionContent className="space-y-2">
              <p>
                1. After sending money, you will receive an SMS from bKash with
                the TxnID.
              </p>
              <p>
                2. You can also find it in your bKash app from the transaction
                history statement.
              </p>
              <p>3. Copy the TxnID and paste it in the purchase form.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Alert variant="default" className="bg-muted/30">
          <AlertTitle>Important Note</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Verification can take from{" "}
              <span className="font-bold">2 minutes to 6 hours</span>. Please be
              patient.
            </p>
            <p>
              Payments made between{" "}
              <span className="font-bold">5 AM to 10 AM</span> might be verified
              after this period.
            </p>
            <p>
              If your verification exceeds 6 hours, please contact us via the{" "}
              <button
                onClick={() => setHelpOpen(true)}
                className="underline font-medium"
              >
                Help Center
              </button>
              .
            </p>
          </AlertDescription>
        </Alert>
      </div>
      <HelpCenterModal isOpen={isHelpOpen} onOpenChange={setHelpOpen} />
    </>
  );
};

export function HowToPaySection() {
  return (
    <section id="how-to-pay" className="py-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">How to Pay</h2>
        <div className="p-6 border rounded-lg bg-card/50">
          <HowToPayContent productPrice={0} />
        </div>
      </div>
    </section>
  );
}
