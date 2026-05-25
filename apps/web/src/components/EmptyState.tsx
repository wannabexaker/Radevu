"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  action?: ReactNode;
  description?: string;
  icon: LucideIcon;
  title: string;
};

/**
 * Renders a centered empty state for dashboard sections.
 *
 * @param props - Empty state icon, title, optional description, and action.
 * @returns A reusable empty state block.
 */
export function EmptyState({
  action,
  description,
  icon: Icon,
  title
}: EmptyStateProps): JSX.Element {
  return (
    <section className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-indigo-500">
        <Icon aria-hidden="true" className="h-6 w-6" />
      </div>
      <h2 className="text-2xl font-semibold leading-tight text-slate-900">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-base leading-relaxed text-slate-500">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
