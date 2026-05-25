import type { CustomerSummary } from "@/lib/customers";
import Link from "next/link";
import { CustomerAvatar } from "@/components/dashboard/CustomerAvatar";

type CustomerCardProps = {
  customer: CustomerSummary;
  timezone: string;
};

function formatLastBooking(date: Date | null, timezone: string): string {
  if (!date) {
    return "Δεν έχει ακόμα κράτηση.";
  }

  const formatted = new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "long",
    timeZone: timezone,
    weekday: "short"
  }).format(date);

  return `Τελευταία κράτηση: ${formatted}`;
}

function contactSummary(customer: CustomerSummary): string {
  if (customer.phone && customer.email) {
    return `${customer.phone} · ${customer.email}`;
  }

  return customer.phone ?? customer.email ?? "Δεν δόθηκε επικοινωνία";
}

/**
 * Renders one tappable customer row for the dashboard customer list.
 *
 * @param props - Customer summary and business timezone.
 * @returns A mobile-first customer card link.
 */
export function CustomerCard({
  customer,
  timezone
}: CustomerCardProps): JSX.Element {
  return (
    <Link
      className="flex min-h-[88px] gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors active:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      href={`/dashboard/customers/${customer.id}`}
    >
      <CustomerAvatar name={customer.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900">
              {customer.name}
            </h2>
            <p className="mt-1 truncate text-sm text-slate-500">
              {contactSummary(customer)}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {customer.appointmentsCount}
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {formatLastBooking(customer.lastAppointmentAt, timezone)}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-800">
          {customer.appointmentsCount} κρατήσεις συνολικά
        </p>
      </div>
    </Link>
  );
}
