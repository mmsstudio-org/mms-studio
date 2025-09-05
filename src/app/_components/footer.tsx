"use client";
import Link from "next/link";
import { Github, Home, Instagram, HelpCircle } from "lucide-react";
import { useState } from "react";
import HelpCenterModal from "./help-center-modal";

export default function Footer() {
  const [isHelpOpen, setHelpOpen] = useState(false);

  const footerLinks = [
    { href: "/", icon: Home, label: "Home", target: 0 },
    {
      href: "https://instagram.com/sabbirmms",
      icon: Instagram,
      label: "Instagram",
      target: 1,
    },
    { href: "https://github.com/sabbirmms", icon: Github, label: "GitHub", target: 1 },
    { href: "https://sabbirmms.github.io", label: "Admin", target: 1 },
  ];

  return (
    <>
      <footer className="py-6 md:px-8 md:py-0 border-t border-border/40">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} MMS Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setHelpOpen(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">How to Pay</span>
            </button>
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target={link.target === 1 ? "_blank" : "_parent"}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.icon ? <link.icon className="h-5 w-5" /> : link.label}
                <span className="sr-only">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </footer>
      <HelpCenterModal isOpen={isHelpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
