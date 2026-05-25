import Link from "next/link";
import { Logo } from "@/components/Logo";
import { env } from "@/lib/env";

/**
 * Renders the landing footer with legal links and env-driven contact email.
 *
 * @returns The landing footer section.
 */
export function Footer(): JSX.Element {
  const contactEmail = env.CONTACT_NOTIFICATION_EMAIL ?? "";

  return (
    <footer className="border-t border-slate-200 bg-slate-50 px-4 py-10 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-lg font-semibold text-slate-900">
              Radevu
            </span>
          </div>
          <nav className="flex flex-col gap-2 text-sm text-slate-600">
            <a className="min-h-11 py-2" href="#about">
              Σχετικά
            </a>
            <a className="min-h-11 py-2" href="#contact">
              Επικοινωνία
            </a>
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-slate-900">Νομικά</h2>
          <nav className="flex flex-col gap-2 text-sm text-slate-600">
            <Link className="min-h-11 py-2" href="/legal/terms">
              Όροι χρήσης
            </Link>
            <Link className="min-h-11 py-2" href="/legal/privacy">
              Πολιτική απορρήτου
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-slate-900">
            Επικοινωνία
          </h2>
          <a
            className="min-h-11 py-2 text-sm text-slate-600"
            href={`mailto:${contactEmail}`}
          >
            {contactEmail}
          </a>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-slate-200 pt-6 text-sm text-slate-500">
        © 2026 Radevu. Φτιαγμένο στην Ελλάδα.
      </div>
    </footer>
  );
}
