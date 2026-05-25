"use client";

import type { CustomerDebtAppointment } from "@/lib/customers";
import { Euro } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

type MarkDebtPaidAction = (appointmentId: string) => Promise<void>;

type DebtRowProps = {
  appointment: CustomerDebtAppointment;
  onMarkPaid: MarkDebtPaidAction;
  timezone: string;
};

function formatDateTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "short",
    timeZone: timezone,
    weekday: "short"
  }).format(date);
}

/**
 * Renders one unpaid booking row with a one-tap paid action.
 *
 * @param props - Debt appointment, business timezone, and server action callback.
 * @returns Unpaid booking row for the debts tab.
 */
export function DebtRow({
  appointment,
  onMarkPaid,
  timezone
}: DebtRowProps): JSX.Element {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function markPaid(): void {
    setError(null);
    startTransition(() => {
      void onMarkPaid(appointment.id)
        .then(() => {
          router.refresh();
        })
        .catch((caughtError: unknown) => {
          console.error("Debt paid action failed", {
            appointmentId: appointment.id,
            error: caughtError
          });
          setError("Δεν αποθηκεύτηκε. Δοκίμασε ξανά.");
        });
    });
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-indigo-500">
            {formatDateTime(appointment.startsAt, timezone)}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold text-slate-900">
            {appointment.service.name}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {formatPrice(appointment.amountDueCents, appointment.service.currency)}
          </p>
        </div>
        <Button
          className="shrink-0 px-3 text-xs"
          disabled={isPending}
          onClick={markPaid}
          type="button"
          variant="outline"
        >
          <Euro aria-hidden="true" className="h-4 w-4" />
          Πληρώθηκε
        </Button>
      </div>
      {error ? (
        <p className="mt-3 rounded-md border border-red-500 bg-white px-3 py-2 text-sm text-slate-800">
          {error}
        </p>
      ) : null}
    </article>
  );
}
