"use client";
import Link from "next/link";
import { useState } from "react";
import HelpCenterModal from "./help-center-modal";

export default function Footer() {
  const [isHelpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <footer className="py-12 px-6 border-t border-border/40">
        <div className="container mx-auto">
            <div className="flex flex-wrap justify-between items-center mb-8">
                <div className="text-2xl font-['Orbitron'] font-bold neon-text mb-4 md:mb-0">MMS Studio</div>
                <div className="flex flex-wrap gap-6">
                    <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
                    <Link href="/shop" className="hover:text-primary transition-colors">Apps</Link>
                    <button onClick={() => setHelpOpen(true)} className="hover:text-primary transition-colors">Help Center</button>
                    {/* <a href="#" className="hover:text-purple-300 transition-colors">Privacy Policy</a> */}
                </div>
            </div>
            <div className="text-center text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} MMS Studio. All Rights Reserved.</p>
            </div>
        </div>
    </footer>
    <HelpCenterModal isOpen={isHelpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
