import type { CustomerDetail } from "@/lib/customers";
import { formatPrice } from "@/lib/format";

type CustomerStatsBlockProps = {
  customer: CustomerDetail;
  timezone: string;
};

function formatLastBooking(date: Date | null, timezone: string): string {
  if (!date) {
    return "Καμία";
  }

  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "short",
    timeZone: timezone,
    weekday: "short"
  }).format(date);
}

/**
 * Renders compact customer statistics for the detail page.
 *
 * @param props - Customer detail and business timezone.
 * @returns Three-stat dashboard block.
 */
export function CustomerStatsBlock({
  customer,
  timezone
}: CustomerStatsBlockProps): JSX.Element {
  const currency = customer.appointments[0]?.service.currency ?? "EUR";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Στατιστικά</h2>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold text-slate-900">
            {customer.appointmentsCount}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">Κρατήσεις</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="truncate text-base font-bold text-slate-900">
            {formatPrice(customer.totalSpentCents, currency)}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">Σύνολο</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-sm font-bold text-slate-900">
            {formatLastBooking(customer.lastAppointmentAt, timezone)}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">Τελευταία</p>
        </div>
      </div>
    </section>
  );
}
