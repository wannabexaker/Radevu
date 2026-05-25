"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard/today", label: "Σήμερα" },
  { href: "/dashboard/appointments", label: "Κρατήσεις" },
  { href: "/dashboard/customers", label: "Πελάτες" },
  { href: "/dashboard/debts", label: "Οφειλές" },
  { href: "/dashboard/notifications", label: "Ειδοπ." },
  { href: "/dashboard/settings", label: "Ρυθμ." }
] as const;

export function BottomNav(): JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Κύρια πλοήγηση dashboard"
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-200 bg-white pb-2"
    >
      <div className="mx-auto flex max-w-screen-sm">
        {tabs.map((tab) => {
          const active = pathname === tab.href;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex min-h-16 flex-1 items-center justify-center px-1 text-center text-xs font-semibold ${
                active
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-700 active:bg-neutral-100"
              }`}
              href={tab.href}
              key={tab.href}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
