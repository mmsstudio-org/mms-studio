'use client';
import Link from 'next/link';
import { Github, Home, Instagram, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import HelpCenterModal from './help-center-modal';

export default function Footer() {
  const [isHelpOpen, setHelpOpen] = useState(false);

  const footerLinks = [
    { href: '/', icon: Home, label: 'Home' },
    { href: 'https://instagram.com', icon: Instagram, label: 'Instagram' },
    { href: 'https://github.com', icon: Github, label: 'GitHub' },
    { href: 'https://sabbirmms.github.io', label: 'Admin' },
  ];

  return (
    <>
      <footer className="py-6 md:px-8 md:py-0 border-t border-border/40">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} MMS Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button onClick={() => setHelpOpen(true)} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">How to Pay</span>
            </button>
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
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
