import { CalendarDays } from "lucide-react";
import { AppointmentCard } from "@/components/dashboard/AppointmentCard";
import type { AppointmentWithRelations } from "@/lib/appointments";

type AppointmentAction = (appointmentId: string) => Promise<void>;

type AppointmentListProps = {
  emptyMessage: string;
  items: AppointmentWithRelations[];
  onCancel: AppointmentAction;
  onMarkDone: AppointmentAction;
  onTogglePaid: AppointmentAction;
  timezone: string;
};

/**
 * Renders a vertical stack of appointment cards or a warm empty state.
 *
 * @param props - Appointments, empty copy, timezone, and server action callbacks.
 * @returns Appointment list for dashboard pages.
 */
export function AppointmentList({
  emptyMessage,
  items,
  onCancel,
  onMarkDone,
  onTogglePaid,
  timezone
}: AppointmentListProps): JSX.Element {
  if (items.length === 0) {
    return (
      <section className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-indigo-500">
          <CalendarDays aria-hidden="true" className="h-6 w-6" />
        </div>
        <p className="text-base leading-relaxed text-slate-600">
          {emptyMessage}
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((appointment) => (
        <AppointmentCard
          appointment={appointment}
          key={appointment.id}
          onCancel={onCancel}
          onMarkDone={onMarkDone}
          onTogglePaid={onTogglePaid}
          timezone={timezone}
        />
      ))}
    </div>
  );
}
