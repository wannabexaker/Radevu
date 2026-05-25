import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type SettingsMenuItemProps = {
  description: string;
  href: string;
  icon: LucideIcon;
  label: string;
};

/**
 * Renders one stable row in the owner settings menu.
 *
 * @param props - Target href, icon, label, and helper description.
 * @returns A 44px+ tappable settings navigation row.
 */
export function SettingsMenuItem({
  description,
  href,
  icon: Icon,
  label
}: SettingsMenuItemProps): JSX.Element {
  return (
    <Link
      className="flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      href={href}
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-indigo-500">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium text-slate-900">
          {label}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-slate-500">
          {description}
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="h-5 w-5 shrink-0 text-slate-500"
      />
    </Link>
  );
}
