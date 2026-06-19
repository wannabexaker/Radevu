import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { AppointmentActions } from "./AppointmentActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Διαχείριση ραντεβού · Radevu" };

type Props = { params: Promise<{ token: string }> };

function formatDateTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("el-GR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone
  }).format(date);
}

export default async function AppointmentActionPage({ params }: Props): Promise<JSX.Element> {
  const { token } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { actionToken: token },
    include: {
      business: { select: { id: true, name: true, timezone: true } },
      customer: { select: { name: true } },
      service: true
    }
  });

  if (!appointment) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Ο σύνδεσμος δεν ισχύει</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">Επικοινώνησε με την επιχείρηση για βοήθεια με το ραντεβού.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-indigo-600">Radevu</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Διαχείριση ραντεβού</h1>
          <dl className="mt-5 space-y-3 text-sm">
            <div><dt className="text-slate-500">Επιχείρηση</dt><dd className="font-semibold text-slate-900">{appointment.business.name}</dd></div>
            <div><dt className="text-slate-500">Υπηρεσία</dt><dd className="font-semibold text-slate-900">{appointment.service.name}</dd></div>
            <div><dt className="text-slate-500">Ημέρα και ώρα</dt><dd className="font-semibold text-slate-900">{formatDateTime(appointment.startsAt, appointment.business.timezone)}</dd></div>
            <div><dt className="text-slate-500">Κατάσταση</dt><dd className="font-semibold text-slate-900">{appointment.status === "scheduled" ? "Προγραμματισμένο" : appointment.status === "cancelled" ? "Ακυρωμένο" : "Ολοκληρωμένο"}</dd></div>
          </dl>
          {appointment.cancellationReason ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-900"><span className="font-semibold">Λόγος ακύρωσης:</span> {appointment.cancellationReason}</p> : null}
          {appointment.rescheduleStatus === "pending" && appointment.rescheduleRequestedStart ? <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Εκκρεμεί έγκριση για {formatDateTime(appointment.rescheduleRequestedStart, appointment.business.timezone)}.</p> : null}
        </header>
        <AppointmentActions
          businessId={appointment.business.id}
          service={{
            currency: appointment.service.currency,
            description: appointment.service.description,
            durationMinutes: appointment.service.durationMinutes,
            id: appointment.service.id,
            name: appointment.service.name,
            priceCents: appointment.service.priceCents
          }}
          status={appointment.status}
          timezone={appointment.business.timezone}
          token={token}
        />
      </div>
    </main>
  );
}
