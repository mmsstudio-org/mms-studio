
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
import { cn } from "@/lib/utils";

export const HowToPayContent = ({
  productPrice,
  isScrollable = true,
  youtubeVideoId,
}: {
  productPrice?: number;
  isScrollable?: boolean;
  youtubeVideoId?: string;
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
        className={cn(
          "space-y-4 p-1 pt-4",
          isScrollable && "max-h-[80vh] overflow-auto"
        )}
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
          {productPrice !== undefined && productPrice > 0 && (
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
        
        {youtubeVideoId && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Payment Tutorial Video</AccordionTrigger>
                <AccordionContent>
                  <div className="aspect-video">
                    <iframe
                      className="w-full h-full rounded-lg"
                      src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
            {siteInfo.paymentNotice && (
                 <p className="whitespace-pre-wrap">{siteInfo.paymentNotice}</p>
            )}
            <p>
              If any issues occur, please contact us via the{" "}
              <button
                onClick={() => setHelpOpen(true)}
                className="underline font-medium hover:text-accent"
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
      <div className="max-w-4xl mx-auto p-0 md:p-2">
        <h2 className="text-3xl font-bold text-center mb-8">How to Pay</h2>
        <div className="p-2 md:p-6 border rounded-lg bg-card/50">
          <HowToPayContent isScrollable={false} />
        </div>
      </div>
    </section>
  );
}
