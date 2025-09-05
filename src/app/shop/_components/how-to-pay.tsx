'use client';
import { useState } from 'react';
import Image from "next/image";
import { CONFIG } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

export const HowToPayContent = ({ productPrice }: { productPrice?: number }) => {
    const { toast } = useToast();
    const copyToClipboard = () => {
        navigator.clipboard.writeText(CONFIG.bkash_number);
        toast({
            title: "Copied!",
            description: "bKash number copied to clipboard.",
        });
    };

    return (
        <div className="space-y-4">
            <div className="p-4 border rounded-lg">
                <p className="font-bold text-lg">Send Money to:</p>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-xl font-mono text-accent">{CONFIG.bkash_number}</span>
                    <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                        <Copy className="h-5 w-5" />
                    </Button>
                </div>
                {productPrice && (
                    <p className="text-sm text-muted-foreground mt-1">Amount to send: <span className="font-bold text-foreground">৳{productPrice}</span></p>
                )}
            </div>

            <div className="text-center text-sm text-muted-foreground">OR</div>

            <div className="flex flex-col items-center p-4 border rounded-lg">
                <p className="font-bold text-lg mb-2">Scan QR Code</p>
                <Image src={CONFIG.bkash_qr_code_url} alt="bKash QR Code" width={150} height={150} className="rounded-md" data-ai-hint="qr code payment" />
                <p className="text-xs text-muted-foreground mt-2">Use the bKash app to scan and pay.</p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How to find Transaction ID (TxnID)?</AccordionTrigger>
                <AccordionContent className="space-y-2">
                 <p>1. After sending money, you will receive an SMS from bKash with the TxnID.</p>
                 <p>2. You can also find it in your bKash app from the transaction history statement.</p>
                 <p>3. Copy the TxnID and paste it in the purchase form.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Alert variant="default" className="bg-muted/30">
                <AlertTitle>Important Note</AlertTitle>
                <AlertDescription className="space-y-2">
                    <p>Verification can take from <span className="font-bold">2 minutes to 6 hours</span>. Please be patient.</p>
                    <p>Payments made between <span className="font-bold">5 AM to 10 AM</span> might be verified after this period.</p>
                    <p>If your verification exceeds 6 hours, please contact us via the <Link href="/#help" className="underline font-medium">Help Center</Link> or WhatsApp (text only).</p>
                </AlertDescription>
            </Alert>
        </div>
    );
};


export function HowToPaySection() {
    return (
        <section id="how-to-pay" className="py-20">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-8">How to Pay</h2>
                <div className="p-6 border rounded-lg bg-card/50">
                    <HowToPayContent />
                </div>
            </div>
        </section>
    )
}
