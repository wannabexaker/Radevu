import { redirect } from "next/navigation";
import { AppointmentList } from "@/components/dashboard/AppointmentList";
import { TodayHeader } from "@/components/dashboard/TodayHeader";
import {
  cancelAppointment,
  markAppointmentDone,
  togglePaid
} from "@/app/(protected-dashboard)/dashboard/today/actions";
import { getTodayAppointments } from "@/lib/appointments";
import { getOwnerBusiness } from "@/lib/dashboard-server";

export const dynamic = "force-dynamic";

export default async function TodayPage(): Promise<JSX.Element> {
  const business = await getOwnerBusiness();

  if (!business) {
    redirect("/dashboard/register");
  }

  const items = await getTodayAppointments(business.id, business.timezone);
  const counters = {
    total: items.length,
    done: items.filter((item) => item.status === "done").length,
    cancelled: items.filter((item) => item.status === "cancelled").length
  };

  return (
    <section className="flex flex-col gap-4 pb-20">
      <div>
        <h1 className="text-3xl font-bold leading-tight text-slate-900">
          Σήμερα
        </h1>
        <p className="mt-2 text-base text-slate-500">
          Οι κρατήσεις της ημέρας, με γρήγορες κινήσεις.
        </p>
      </div>
      <TodayHeader counters={counters} />
      <AppointmentList
        emptyMessage="Σήμερα δεν έχεις κρατήσεις. Χρόνος για καφέ."
        items={items}
        onCancel={cancelAppointment}
        onMarkDone={markAppointmentDone}
        onTogglePaid={togglePaid}
        timezone={business.timezone}
      />
    </section>
  );
}
