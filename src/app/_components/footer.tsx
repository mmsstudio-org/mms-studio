
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
    Github, Home, Instagram, HelpCircle, Linkedin, Twitter, Mail, Youtube, Facebook
} from "lucide-react";
import HelpCenterModal from "./help-center-modal";
import Image from "next/image";
import { getSiteInfo } from "@/lib/firestore-service";
import type { SiteInfo } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

// Custom icons for brands not in lucide-react
const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
);
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.75 13.96c.25.13.43.2.6.35.2.16.32.34.4.55.12.3.18.6.18.98 0 .4-.1.78-.33 1.13-.23.35-.55.64-1 .85-.45.2-1 .3-1.6.3-.58 0-1.15-.1-1.7-.34-.55-.23-1.1-.55-1.63-.93-.53-.38-1.03-.8-1.5-1.25-.47-.45-.9-1-1.28-1.5s-.7-1-1-1.5c-.3-.5-.56-.98-.78-1.45-.22-.47-.38-.9-.42-1.3-.04-.4.04-.8.2-1.15.17-.35.4-.64.7-.84.3-.2.6-.3.9-.3.3 0 .6.04.8.13.2.1.35.2.45.3s.18.2.2.34c.03.14.02.28 0 .42-.02.14-.08.28-.17.4s-.18.23-.28.34c-.1.1-.2.2-.3.3s-.18.17-.25.24c-.07.07-.12.13-.15.18-.03.05-.05.1-.05.16 0 .06.02.12.06.18.04.06.1.13.18.2.08.07.18.14.28.2.1.08.23.15.35.23.12.08.24.14.35.18.1.04.2.07.28.1.08.03.15.04.2.04.05 0 .1-.02.15-.05.05-.03.1-.08.15-.14.05-.06.1-.12.14-.18.04-.06.08-.1.1-.13h.02z M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
    </svg>
);
const TelegramIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 2 2 8.67l6.16 2.16 2.16 6.16L22 2Zm-6.53 8.87-5.54 3.53-1.4-4.59 9.38-6.1-2.44 7.16Z" />
    </svg>
);


export default function Footer() {
  const [isHelpOpen, setHelpOpen] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSiteInfo().then(info => {
      setSiteInfo(info);
      setLoading(false);
    });
  }, []);

  const socialLinks = !siteInfo ? [] : [
    { href: siteInfo.githubUrl, icon: Github, label: "GitHub", target: "_blank" },
    { href: siteInfo.linkedinUrl, icon: Linkedin, label: "LinkedIn", target: "_blank" },
    { href: siteInfo.xUrl, icon: XIcon, label: "X", target: "_blank" },
    { href: siteInfo.instagramUrl, icon: Instagram, label: "Instagram", target: "_blank" },
    { href: siteInfo.facebookUrl, icon: Facebook, label: "Facebook", target: "_blank" },
    { href: siteInfo.youtubeUrl, icon: Youtube, label: "YouTube", target: "_blank" },
    { href: siteInfo.whatsappUrl, icon: WhatsAppIcon, label: "WhatsApp", target: "_blank" },
    { href: siteInfo.telegramUrl, icon: TelegramIcon, label: "Telegram", target: "_blank" },
    { href: siteInfo.email ? `mailto:${siteInfo.email}` : undefined, icon: Mail, label: "Email", target: "_self" },
  ].filter(link => link.href);

  return (
    <>
      <footer className="py-12 px-6 border-t border-border/40">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            <div
              className={`text-2xl font-['Orbitron'] font-bold flex items-center gap-2`}
            >
              <Image
                src="/favicon.png"
                alt="MMS Studio logo"
                width={32}
                height={32}
                className="rounded bg-black"
              />
              {siteInfo?.webName || 'MMS Studio'}
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6">
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors"><Home className="h-5 w-5" /><span className="sr-only">Home</span></Link>
                
                {loading ? (
                    <Skeleton className="h-5 w-32" />
                ) : (
                   socialLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href!}
                      target={link.target}
                      rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <link.icon/>
                      <span className="sr-only">{link.label}</span>
                    </Link>
                  ))
                )}
                
                <button
                    onClick={() => setHelpOpen(true)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                    <HelpCircle className="h-5 w-5" />
                    <span className="sr-only">Help Center</span>
                </button>
            </div>
          </div>
          <div className="text-center text-muted-foreground">
            <p>
              &copy; 2020-{new Date().getFullYear()} MMS Studio. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
      <HelpCenterModal isOpen={isHelpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
