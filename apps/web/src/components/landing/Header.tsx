"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MotionDiv } from "./MotionWrapper";

const navLinks = [
  { href: "#about", label: "Σχετικά" },
  { href: "#features", label: "Λειτουργίες" },
  { href: "#contact", label: "Επικοινωνία" }
] as const;

type HeaderProps = {
  userType?: "business_owner" | "customer" | null;
};

function signedInHref(userType: HeaderProps["userType"]): string {
  return userType === "business_owner" ? "/dashboard/today" : "/account";
}

function signedInLabel(userType: HeaderProps["userType"]): string {
  return userType === "business_owner" ? "Dashboard" : "Account";
}

export function Header({ userType = null }: HeaderProps): JSX.Element {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    function updateScrollState(): void {
      setIsScrolled(window.scrollY > 12);
    }

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  function closeMenu(): void {
    setIsMenuOpen(false);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors",
        isScrolled ? "border-b border-slate-200 bg-white" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        <Link
          aria-label="Radevu"
          className="inline-flex min-h-11 items-center gap-3"
          href="/"
        >
          <Logo priority size="md" />
          <span className="text-lg font-semibold text-slate-900">
            Radevu
          </span>
        </Link>

        <nav
          aria-label="Κύρια πλοήγηση"
          className="hidden items-center md:flex"
        >
          {navLinks.map((link) => (
            <a
              className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {userType ? (
            <Button asChild size="sm">
              <Link href={signedInHref(userType)}>
                {signedInLabel(userType)}
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link href="/login">Σύνδεση</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Εγγραφή</Link>
              </Button>
            </>
          )}
        </div>

        <button
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Κλείσιμο μενού" : "Άνοιγμα μενού"}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-800 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 md:hidden"
          onClick={() => setIsMenuOpen((current) => !current)}
          type="button"
        >
          {isMenuOpen ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </div>

      {isMenuOpen ? (
        <MotionDiv
          animate={{ x: 0, opacity: 1 }}
          className="fixed inset-0 top-16 z-50 bg-white px-4 py-6 md:hidden"
          initial={{ x: "100%", opacity: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <nav aria-label="Μενού κινητού" className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                className="inline-flex min-h-14 items-center rounded-xl border border-slate-200 bg-white px-4 text-lg font-medium text-slate-900 transition-colors active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                href={link.href}
                key={link.href}
                onClick={closeMenu}
              >
                {link.label}
              </a>
            ))}
            {userType ? (
              <Button asChild>
                <Link href={signedInHref(userType)} onClick={closeMenu}>
                  {signedInLabel(userType)}
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link href="/login" onClick={closeMenu}>
                    Σύνδεση
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/register" onClick={closeMenu}>
                    Εγγραφή
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </MotionDiv>
      ) : null}
    </header>
  );
}
