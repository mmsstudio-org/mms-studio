"use client";

import Link from "next/link";
import Image from "next/image"; // ✅ import Image
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, HelpCircle, Moon, Sun } from "lucide-react";
import { useState } from "react";
import HelpCenterModal from "./help-center-modal";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";

export default function Header() {
  const [isHelpOpen, setHelpOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const navLinks = [
    { href: "/shop", label: "Shop" },
    ...(user ? [{ href: "/dashboard", label: "Dashboard" }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            {/* Logo + Name */}
            <Link href="/" className="flex items-center gap-2 mr-6">
              <Image
                src="/favicon.png"
                alt="MMS Studio logo"
                width={32}
                height={32}
                className="rounded bg-black"
              />
              <span className="font-bold text-glow font-['Orbitron']">MMS Studio</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "transition-colors hover:text-foreground/80 text-glow",
                    pathname.startsWith(link.href)
                      ? "text-foreground"
                      : "text-foreground/60"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side buttons */}
          <div className="flex flex-1 items-center justify-end space-x-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-glow text-accent" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-glow text-accent" />
              <span className="sr-only">Toggle Theme</span>
            </Button>

            {/* Help center */}
            <Button variant="ghost" size="icon" onClick={() => setHelpOpen(true)}>
              <HelpCircle className="h-5 w-5 text-glow text-accent" />
              <span className="sr-only">Help Center</span>
            </Button>

            {/* Mobile menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-8">
                    {/* Use same favicon image for mobile header */}
                    <Image
                      src="/favicon.png"
                      alt="MMS Studio logo"
                      width={32}
                      height={32}
                      className="rounded"
                    />
                    <span className="font-bold">MMS Studio</span>
                  </div>
                  <nav className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "text-lg font-medium transition-colors hover:text-foreground/80",
                          pathname.startsWith(link.href)
                            ? "text-foreground"
                            : "text-foreground/60"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <HelpCenterModal isOpen={isHelpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
