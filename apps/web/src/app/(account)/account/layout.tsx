import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { VerifyEmailBanner } from "@/components/account/VerifyEmailBanner";
import { getManagedBusinessForUser } from "@/lib/business-access";
import { getCurrentUser } from "@/lib/current-user";

export default async function AccountLayout({
  children
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const managedBusiness = await getManagedBusinessForUser(user.id);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link className="text-lg font-semibold text-slate-950" href="/account">
            Radevu
          </Link>
          <LogoutButton />
        </div>
        <nav className="mx-auto mt-3 flex max-w-3xl gap-2 overflow-x-auto">
          <Link
            className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            href="/account"
          >
            Αρχική
          </Link>
          <Link
            className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            href="/account/appointments"
          >
            Ραντεβού
          </Link>
          <Link
            className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            href="/epaggelmaties"
          >
            Επαγγελματίες
          </Link>
          <Link
            className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
            href="/account/settings"
          >
            Προφίλ
          </Link>
          {managedBusiness ? (
            <Link
              className="inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
              href="/dashboard/today"
            >
              Ο πίνακάς μου
            </Link>
          ) : null}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">
        {!user.emailVerified ? <VerifyEmailBanner /> : null}
        {children}
      </main>
    </div>
  );
}
