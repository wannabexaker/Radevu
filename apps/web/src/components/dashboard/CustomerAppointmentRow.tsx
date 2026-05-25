import type { CustomerAppointment } from "@/lib/customers";
import { PaidPill } from "@/components/dashboard/PaidPill";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type CustomerAppointmentRowProps = {
  appointment: CustomerAppointment;
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
 * Renders one compact booking history row for a customer.
 *
 * @param props - Appointment row and business timezone.
 * @returns Customer booking history item.
 */
export function CustomerAppointmentRow({
  appointment,
  timezone
}: CustomerAppointmentRowProps): JSX.Element {
  return (
    <article
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4",
        appointment.status === "cancelled" && "bg-slate-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-indigo-500">
            {formatDateTime(appointment.startsAt, timezone)}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold text-slate-900">
            {appointment.service.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {formatPrice(appointment.amountDueCents, appointment.service.currency)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusPill status={appointment.status} />
          <PaidPill
            amountDueCents={appointment.amountDueCents}
            currency={appointment.service.currency}
            paid={appointment.paid}
          />
        </div>
      </div>
    </article>
  );
}
