import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

type AccountAppointmentsPageProps = {
  searchParams: Promise<{
    view?: string;
  }>;
};

function formatDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "long",
    timeZone: timezone,
    weekday: "long"
  }).format(date);
}

export default async function AccountAppointmentsPage({
  searchParams
}: AccountAppointmentsPageProps): Promise<JSX.Element> {
  const user = await getCurrentUser();
  const { view: rawView } = await searchParams;
  const view = rawView === "past" ? "past" : "upcoming";
  const now = new Date();
  const appointments = user
    ? await prisma.appointment.findMany({
        orderBy: {
          startsAt: view === "past" ? "desc" : "asc"
        },
        where: {
          customer: {
            userId: user.id
          },
          startsAt: view === "past" ? { lt: now } : { gte: now }
        },
        select: {
          id: true,
          startsAt: true,
          status: true,
          business: {
            select: {
              name: true,
              timezone: true
            }
          },
          service: {
            select: {
              name: true
            }
          }
        },
        take: 50
      })
    : [];

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-950">Ραντεβού</h1>
        <div className="flex gap-2">
          <Link
            className={`inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-medium ${
              view === "upcoming"
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
            href="/account/appointments"
          >
            Επόμενα
          </Link>
          <Link
            className={`inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-medium ${
              view === "past"
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
            href="/account/appointments?view=past"
          >
            Παλιά
          </Link>
        </div>
      </header>

      {appointments.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Δεν υπάρχουν ραντεβού σε αυτή την προβολή.
        </p>
      ) : (
        <ol className="space-y-3">
          {appointments.map((appointment) => (
            <li key={appointment.id}>
              <Link
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                href={`/account/appointments/${appointment.id}`}
              >
                <p className="font-semibold text-slate-950">
                  {appointment.service.name}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {appointment.business.name} ·{" "}
                  {formatDate(
                    appointment.startsAt,
                    appointment.business.timezone
                  )}
                </p>
                <p className="mt-2 text-xs font-medium uppercase text-slate-500">
                  {appointment.status}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
