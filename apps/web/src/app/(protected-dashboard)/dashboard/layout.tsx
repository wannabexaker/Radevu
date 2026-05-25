import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { LogoutButton } from "@/components/LogoutButton";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  const { headers } = await import("next/headers");
  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders
  });

  if (!session) {
    redirect("/dashboard/login");
  }

  return (
    <div className="flex min-h-screen flex-col pb-20">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-neutral-950">Radevu</h1>
        <LogoutButton />
      </header>
      <main className="flex-1 px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
