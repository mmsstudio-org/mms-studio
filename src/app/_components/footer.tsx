"use client";
import Link from "next/link";
import { useState } from "react";
import { Github, Home, Instagram, HelpCircle } from "lucide-react";
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
    // { href: "https://sabbirmms.github.io", label: "Admin", target: 1 },
  ];


  return (
    <>
      <footer className="py-12 px-6 border-t border-border/40">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-between items-center mb-8">
            <div className="text-2xl font-['Orbitron'] font-bold neon-text mb-4 md:mb-0">MMS Studio</div>
            <div className="flex flex-wrap gap-6">
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
              <button
                onClick={() => setHelpOpen(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">How to Pay</span>
              </button>             {/* <a href="#" className="hover:text-purple-300 transition-colors">Privacy Policy</a> */}
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
