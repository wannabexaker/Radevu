import type { CustomerDebtGroup } from "@/lib/customers";
import Link from "next/link";
import { DebtRow } from "@/components/dashboard/DebtRow";
import { formatPrice } from "@/lib/format";

type MarkDebtPaidAction = (appointmentId: string) => Promise<void>;

type DebtSectionProps = {
  group: CustomerDebtGroup;
  onMarkPaid: MarkDebtPaidAction;
  timezone: string;
};

/**
 * Renders one customer's unpaid bookings grouped with total owed.
 *
 * @param props - Customer debt group, timezone, and paid action callback.
 * @returns Debt section for one customer.
 */
export function DebtSection({
  group,
  onMarkPaid,
  timezone
}: DebtSectionProps): JSX.Element {
  const currency = group.appointments[0]?.service.currency ?? "EUR";

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-3 px-1">
        <Link
          className="min-h-11 min-w-0 py-1 text-base font-semibold text-slate-900 underline-offset-4 active:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          href={`/dashboard/customers/${group.customer.id}`}
        >
          {group.customer.name}
        </Link>
        <p className="shrink-0 text-sm font-semibold text-slate-800">
          {formatPrice(group.totalOwedCents, currency)}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {group.appointments.map((appointment) => (
          <DebtRow
            appointment={appointment}
            key={appointment.id}
            onMarkPaid={onMarkPaid}
            timezone={timezone}
          />
        ))}
      </div>
    </section>
  );
}
