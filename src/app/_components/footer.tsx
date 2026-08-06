"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Github,
  Home,
  Instagram,
  HelpCircle,
  Linkedin,
  Mail,
  Youtube,
  Facebook,
  Twitter,
} from "lucide-react";
import HelpCenterModal from "./help-center-modal";
import Image from "next/image";
import { getSiteInfo, getFooterDynamicPages } from "@/lib/firestore-service";
import type { SiteInfo } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

// lucide-react has no brand-accurate WhatsApp/Telegram glyphs (it's a generic
// icon set, not a brand-icon library), so these stay as custom SVGs — sized
// and stroked to match the lucide icons around them for visual consistency.
const XIcon = Twitter;
const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path
      fill="currentColor"
      d="M16.6 14c-.2-.1-1.5-.7-1.7-.8c-.2-.1-.4-.1-.6.1c-.2.2-.6.8-.8 1c-.1.2-.3.2-.5.1c-.7-.3-1.4-.7-2-1.2c-.5-.5-1-1.1-1.4-1.7c-.1-.2 0-.4.1-.5c.1-.1.2-.3.4-.4c.1-.1.2-.3.2-.4c.1-.1.1-.3 0-.4c-.1-.1-.6-1.3-.8-1.8c-.1-.7-.3-.7-.5-.7h-.5c-.2 0-.5.2-.6.3c-.6.6-.9 1.3-.9 2.1c.1.9.4 1.8 1 2.6c1.1 1.6 2.5 2.9 4.2 3.7c.5.2.9.4 1.4.5c.5.2 1 .2 1.6.1c.7-.1 1.3-.6 1.7-1.2c.2-.4.2-.8.1-1.2l-.4-.2m2.5-9.1C15.2 1 8.9 1 5 4.9c-3.2 3.2-3.8 8.1-1.6 12L2 22l5.3-1.4c1.5.8 3.1 1.2 4.7 1.2c5.5 0 9.9-4.4 9.9-9.9c.1-2.6-1-5.1-2.8-7m-2.7 14c-1.3.8-2.8 1.3-4.4 1.3c-1.5 0-2.9-.4-4.2-1.1l-.3-.2l-3.1.8l.8-3l-.2-.3c-2.4-4-1.2-9 2.7-11.5S16.6 3.7 19 7.5c2.4 3.9 1.3 9-2.6 11.4"
    />
  </svg>
);

const TelegramIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path
      fill="currentColor"
      d="m16.463 8.846l-1.09 6.979a.588.588 0 0 1-.894.407l-3.65-2.287a.588.588 0 0 1-.095-.923l3.03-2.904c.034-.032-.006-.085-.046-.061l-4.392 2.628a1.23 1.23 0 0 1-.87.153l-1.59-.307c-.574-.111-.653-.899-.114-1.122l8.502-3.515a.882.882 0 0 1 1.21.952"
    />
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M12 1.706C6.315 1.706 1.706 6.315 1.706 12S6.315 22.294 12 22.294S22.294 17.685 22.294 12S17.685 1.706 12 1.706M3.47 12a8.53 8.53 0 1 1 17.06 0a8.53 8.53 0 0 1-17.06 0"
      clip-rule="evenodd"
    />
  </svg>
);

export default function Footer() {
  const [isHelpOpen, setHelpOpen] = useState(false);
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [footerPages, setFooterPages] = useState<
    Array<{ title: string; slug: string }>
  >([]);

  useEffect(() => {
    getSiteInfo().then((info) => {
      setSiteInfo(info);
      setLoading(false);
    });
    getFooterDynamicPages()
      .then((list) =>
        setFooterPages(list.map((p) => ({ title: p.title, slug: p.slug }))),
      )
      .catch(() => {});
  }, []);

  const socialLinks = !siteInfo
    ? []
    : [
        {
          href: siteInfo.githubUrl,
          icon: Github,
          label: "GitHub",
          target: "_blank",
        },
        {
          href: siteInfo.linkedinUrl,
          icon: Linkedin,
          label: "LinkedIn",
          target: "_blank",
        },
        { href: siteInfo.xUrl, icon: XIcon, label: "X", target: "_blank" },
        {
          href: siteInfo.instagramUrl,
          icon: Instagram,
          label: "Instagram",
          target: "_blank",
        },
        {
          href: siteInfo.facebookUrl,
          icon: Facebook,
          label: "Facebook",
          target: "_blank",
        },
        {
          href: siteInfo.youtubeUrl,
          icon: Youtube,
          label: "YouTube",
          target: "_blank",
        },
        {
          href: siteInfo.whatsappUrl,
          icon: WhatsAppIcon,
          label: "WhatsApp",
          target: "_blank",
        },
        {
          href: siteInfo.telegramUrl,
          icon: TelegramIcon,
          label: "Telegram",
          target: "_blank",
        },
        {
          href: siteInfo.email ? `mailto:${siteInfo.email}` : undefined,
          icon: Mail,
          label: "Email",
          target: "_self",
        },
      ].filter((link) => link.href);

  const hasPages = footerPages.length > 0;

  return (
    <>
      <footer className="border-t border-border/40 bg-background">
        <div className="container mx-auto px-6 py-16">
          <div
            className={`grid grid-cols-1 ${hasPages ? "md:grid-cols-12" : "md:grid-cols-2"} gap-12 md:gap-8`}
          >
            {/* Brand */}
            <div
              className={`${hasPages ? "md:col-span-5" : ""} flex flex-col items-center md:items-start text-center md:text-left gap-3`}
            >
              <Link
                href="/"
                className="flex items-center gap-2.5 text-xl font-['Orbitron'] font-bold"
              >
                <Image
                  src="/favicon.png"
                  alt="MMS Studio logo"
                  width={30}
                  height={30}
                  className="rounded bg-black shrink-0"
                />
                {siteInfo?.webName || "MMS Studio"}
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Independent software studio building focused, well-crafted
                digital products.
              </p>
            </div>

            {/* Pages */}
            {hasPages && (
              <div className="md:col-span-3 flex flex-col items-center md:items-start gap-4">
                <Link
                  href={"/pages"}
                  className="text-sm font-semibold uppercase tracking-wider text-foreground/70 w-full text-center"
                >
                  Pages
                </Link>
                <nav className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2.5 w-full justify-items-center md:justify-items-start">
                  {footerPages.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/pages/${p.slug}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {p.title}
                    </Link>
                  ))}
                </nav>
              </div>
            )}

            {/* Connect */}
            <div className={hasPages ? "md:col-span-4" : ""}>
              <div className="flex flex-col items-center md:items-start gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
                  Connect
                </h3>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                  <Link
                    href="/"
                    title="Home"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Home className="h-[18px] w-[18px]" />
                    <span className="sr-only">Home</span>
                  </Link>

                  {loading ? (
                    <Skeleton className="h-5 w-32" />
                  ) : (
                    socialLinks.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href!}
                        target={link.target}
                        rel={
                          link.target === "_blank"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        title={link.label}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <link.icon className="h-[18px] w-[18px]" />
                        <span className="sr-only">{link.label}</span>
                      </Link>
                    ))
                  )}

                  <button
                    onClick={() => setHelpOpen(true)}
                    title="Help Center"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <HelpCircle className="h-[18px] w-[18px]" />
                    <span className="sr-only">Help Center</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-border/40 my-10" />

          <div className="text-center text-sm text-muted-foreground">
            <p>
              &copy; 2020-{new Date().getFullYear()} MMS Studio. All Rights
              Reserved.
            </p>
          </div>
        </div>
      </footer>
      <HelpCenterModal isOpen={isHelpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
