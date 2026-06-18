import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "long",
    weekday: "long"
  }).format(date);
}

export default async function AccountPage(): Promise<JSX.Element> {
  const user = await getCurrentUser();
  const displayName = user?.name?.trim() || "πελάτη";
  const nextAppointment = user
    ? await prisma.appointment.findFirst({
        orderBy: {
          startsAt: "asc"
        },
        where: {
          customer: {
            userId: user.id
          },
          startsAt: {
            gte: new Date()
          },
          status: "scheduled"
        },
        select: {
          id: true,
          startsAt: true,
          business: {
            select: {
              name: true
            }
          },
          service: {
            select: {
              name: true
            }
          }
        }
      })
    : null;

  return (
    <div className="space-y-5">
      <header className="flex items-start gap-3">
        <Avatar alt={`${displayName} προφίλ`} name={displayName} size="md" />
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-medium text-indigo-700">
            Ο λογαριασμός μου
          </p>
          <h1 className="text-2xl font-semibold text-slate-950">
            Γεια σου {displayName}
          </h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Εδώ βλέπεις τα ραντεβού και τα στοιχεία σου.
          </p>
        </div>
      </header>

      <Button asChild className="w-full" size="lg">
        <Link href="/epaggelmaties">Κλείσε νέο ραντεβού</Link>
      </Button>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Επόμενο ραντεβού
        </h2>
        {nextAppointment ? (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p className="font-medium text-slate-950">
              {nextAppointment.service.name} · {nextAppointment.business.name}
            </p>
            <p>{formatDate(nextAppointment.startsAt)}</p>
            <Link
              className="inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white"
              href={`/account/appointments/${nextAppointment.id}`}
            >
              Άνοιγμα
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Δεν υπάρχει προγραμματισμένο ραντεβού.
          </p>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          href="/account/appointments"
        >
          <h2 className="text-base font-semibold text-slate-900">
            Ραντεβού
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Ιστορικό και μηνύματα.
          </p>
        </Link>
        <Link
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          href="/account/settings"
        >
          <h2 className="text-base font-semibold text-slate-900">Προφίλ</h2>
          <p className="mt-1 text-sm text-slate-600">
            Όνομα και τηλέφωνο.
          </p>
        </Link>
      </div>
    </div>
  );
}
