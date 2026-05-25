import type { AppointmentStatusDTO } from "@radevu/shared";

const statusClasses: Record<AppointmentStatusDTO, string> = {
  scheduled: "bg-indigo-50 text-indigo-700",
  done: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500"
};

const statusLabels: Record<AppointmentStatusDTO, string> = {
  scheduled: "Προγραμματισμένο",
  done: "Ολοκληρώθηκε",
  cancelled: "Ακυρώθηκε"
};

type StatusPillProps = {
  status: AppointmentStatusDTO;
};

/**
 * Renders a Greek status badge for an appointment.
 *
 * @param props - Appointment status to display.
 * @returns A colored status pill.
 */
export function StatusPill({ status }: StatusPillProps): JSX.Element {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-semibold ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
