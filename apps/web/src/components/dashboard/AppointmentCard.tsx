import type { AppointmentWithRelations } from "@/lib/appointments";
import { Mail, Phone } from "lucide-react";
import { AppointmentActions } from "@/components/dashboard/AppointmentActions";
import { AppointmentNotesPanel } from "@/components/dashboard/AppointmentNotesPanel";
import { PaidPill } from "@/components/dashboard/PaidPill";
import { StatusPill } from "@/components/dashboard/StatusPill";

type AppointmentAction = (appointmentId: string) => Promise<void>;
type AppointmentTextAction = (
  appointmentId: string,
  value: string
) => Promise<void>;

type AppointmentCardProps = {
  appointment: AppointmentWithRelations;
  onCancel: AppointmentAction;
  onMarkDone: AppointmentAction;
  onPostMessage: AppointmentTextAction;
  onSavePrivateNotes: AppointmentTextAction;
  onTogglePaid: AppointmentAction;
  onApproveReschedule?: AppointmentAction;
  onRejectReschedule?: AppointmentAction;
  timezone: string;
};

function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("el-GR", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: timezone
  }).format(date);
}

function durationMinutes(start: Date, end: Date): number {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 60_000));
}

/**
 * Renders one dashboard appointment card with contact links and direct actions.
 *
 * @param props - Appointment with relations, business timezone, and server action callbacks.
 * @returns A mobile-first appointment card.
 */
export function AppointmentCard({
  appointment,
  onCancel,
  onMarkDone,
  onPostMessage,
  onSavePrivateNotes,
  onTogglePaid,
  onApproveReschedule,
  onRejectReschedule,
  timezone
}: AppointmentCardProps): JSX.Element {
  const duration = durationMinutes(appointment.startsAt, appointment.endsAt);

  return (
    <article
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      data-testid="appointment-card"
    >
      <div className="flex gap-4">
        <div className="flex h-12 min-w-16 items-center justify-center rounded-xl bg-slate-100 px-2 font-mono text-2xl font-semibold tabular-nums text-slate-900">
          {formatTime(appointment.startsAt, timezone)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-slate-900">
            {appointment.service.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{duration} λεπτά</p>
          <p className="mt-2 text-base font-medium text-slate-800">
            {appointment.customer.name}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {appointment.customer.phone ? (
              <a
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 active:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                href={`tel:${appointment.customer.phone}`}
              >
                <Phone aria-hidden="true" className="h-4 w-4" />
                {appointment.customer.phone}
              </a>
            ) : null}
            {appointment.customer.email ? (
              <a
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 active:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                href={`mailto:${appointment.customer.email}`}
              >
                <Mail aria-hidden="true" className="h-4 w-4" />
                Email
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill status={appointment.status} />
        <PaidPill
          amountDueCents={appointment.amountDueCents}
          currency={appointment.service.currency}
          paid={appointment.paid}
        />
      </div>
      {appointment.cancellationReason ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          <span className="font-semibold">Λόγος ακύρωσης:</span>{" "}
          {appointment.cancellationReason}
        </p>
      ) : null}
      {appointment.rescheduleStatus === "pending" && appointment.rescheduleRequestedStart && onApproveReschedule && onRejectReschedule ? (
        <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-950">Αίτημα αλλαγής ώρας</h3>
          <p className="mt-1 text-sm text-amber-900">
            Νέα ώρα: {new Intl.DateTimeFormat("el-GR", { dateStyle: "medium", timeStyle: "short", timeZone: timezone }).format(appointment.rescheduleRequestedStart)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <form action={onRejectReschedule.bind(null, appointment.id)}>
              <button className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800" type="submit">Απόρριψη</button>
            </form>
            <form action={onApproveReschedule.bind(null, appointment.id)}>
              <button className="min-h-11 w-full rounded-xl bg-indigo-600 px-3 text-sm font-medium text-white" type="submit">Έγκριση</button>
            </form>
          </div>
        </section>
      ) : null}
      <div className="mt-4">
        <AppointmentActions
          appointmentId={appointment.id}
          onCancel={onCancel}
          onMarkDone={onMarkDone}
          onTogglePaid={onTogglePaid}
          paid={appointment.paid}
          status={appointment.status}
        />
      </div>
      <AppointmentNotesPanel
        appointmentId={appointment.id}
        customerNote={appointment.customerNote}
        messages={appointment.messages}
        notes={appointment.notes}
        onPostMessage={onPostMessage}
        onSavePrivateNotes={onSavePrivateNotes}
        timezone={timezone}
      />
    </article>
  );
}
