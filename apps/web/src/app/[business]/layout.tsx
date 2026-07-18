import Link from "next/link";
import type { ReactNode } from "react";

export default function BusinessLayout({
  children
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <div className="mx-auto w-full max-w-md flex-1">{children}</div>
      <footer className="mx-auto w-full max-w-md px-4 pb-6 pt-8">
        <nav className="flex items-center justify-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-400">
          <Link className="py-2" href="/legal/terms">
            Όροι χρήσης
          </Link>
          <Link className="py-2" href="/legal/privacy">
            Απόρρητο
          </Link>
        </nav>
      </footer>
    </div>
  );
}
