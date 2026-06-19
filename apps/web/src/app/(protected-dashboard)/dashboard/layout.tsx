import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { VerifyEmailBanner } from "@/components/account/VerifyEmailBanner";
import { getCurrentUser } from "@/lib/current-user";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  const { headers } = await import("next/headers");
  const requestHeaders = await headers();

  const user = await getCurrentUser(requestHeaders);

  if (!user) {
    redirect("/login");
  }

  if (user.userType !== "business_owner") {
    redirect("/account");
  }

  return (
    <div className="flex min-h-screen flex-col pb-20">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex min-h-16 w-full max-w-screen-sm items-center justify-between gap-2 px-4">
          <Link
            aria-label="Αρχική σελίδα Radevu"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-neutral-950"
            href="/"
          >
            <Logo size="sm" />
            <span>Radevu</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              className="inline-flex min-h-10 items-center rounded-xl px-2 text-sm font-medium text-neutral-700 active:bg-neutral-100"
              href="/epaggelmaties"
            >
              Επαγγελματίες
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-screen-sm flex-1 px-4 py-6">
        {!user.emailVerified ? <VerifyEmailBanner /> : null}
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
