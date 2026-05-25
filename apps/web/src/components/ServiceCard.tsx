"use client";

import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/IconButton";
import { cn } from "@/lib/utils";
import { formatDuration, formatPrice } from "@/lib/format";

export type ServiceCardService = {
  active: boolean;
  currency: string;
  description: string | null;
  duration_minutes: number;
  id: string;
  name: string;
  price_cents: number;
};

type ServiceCardProps = {
  isPending?: boolean;
  onDelete: (service: ServiceCardService) => void;
  onEdit: (service: ServiceCardService) => void;
  onToggleActive: (service: ServiceCardService) => void;
  service: ServiceCardService;
};

/**
 * Displays one service with price, duration, status toggle, and actions.
 *
 * @param props - Service data and event handlers.
 * @returns A mobile-first service card.
 */
export function ServiceCard({
  isPending = false,
  onDelete,
  onEdit,
  onToggleActive,
  service
}: ServiceCardProps): JSX.Element {
  return (
    <article
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 transition-colors",
        !service.active && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold leading-tight text-slate-900">
              {service.name}
            </h2>
            {!service.active ? (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                Ανενεργή
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-base text-slate-500">
            {formatDuration(service.duration_minutes)} ·{" "}
            {formatPrice(service.price_cents, service.currency)}
          </p>
          {service.description ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              {service.description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            disabled={isPending}
            icon={Pencil}
            label="Επεξεργασία υπηρεσίας"
            onClick={() => onEdit(service)}
          />
          <IconButton
            disabled={isPending}
            icon={Trash2}
            label="Διαγραφή υπηρεσίας"
            onClick={() => onDelete(service)}
            variant="danger"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          aria-checked={service.active}
          className={cn(
            "inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
            service.active
              ? "border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-600 active:bg-indigo-700"
              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100"
          )}
          disabled={isPending}
          onClick={() => onToggleActive(service)}
          role="switch"
          type="button"
        >
          {service.active ? "Ενεργή" : "Ανενεργή"}
        </button>
      </div>
    </article>
  );
}
