import { notFound } from "next/navigation";
import { Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import {
  postAccountCustomerMessage,
  saveAccountCustomerPrivateNote
} from "./actions";

type AccountAppointmentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    saved?: string;
  }>;
};

function formatDateTime(date: Date, timezone: string): string {
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

function formatMessageTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("el-GR", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: timezone
  }).format(date);
}

export default async function AccountAppointmentDetailPage({
  params,
  searchParams
}: AccountAppointmentDetailPageProps): Promise<JSX.Element> {
  const user = await getCurrentUser();
  const { id } = await params;
  const { saved } = await searchParams;
  const appointment = user
    ? await prisma.appointment.findFirst({
        where: {
          customer: {
            userId: user.id
          },
          id
        },
        select: {
          customerPrivateNote: true,
          customerNote: true,
          startsAt: true,
          status: true,
          business: {
            select: {
              contactEmail: true,
              contactPhone: true,
              name: true,
              timezone: true
            }
          },
          messages: {
            orderBy: {
              createdAt: "asc"
            },
            select: {
              authorRole: true,
              body: true,
              createdAt: true,
              id: true
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

  if (!appointment) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          {appointment.business.name}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          {appointment.service.name}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {formatDateTime(appointment.startsAt, appointment.business.timezone)}
        </p>
        <p className="mt-2 text-xs font-medium uppercase text-slate-500">
          {appointment.status}
        </p>
      </header>

      {saved === "note" ? (
        <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          Η private σημείωση αποθηκεύτηκε.
        </p>
      ) : null}
      {saved === "message" ? (
        <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          Το μήνυμα στάλθηκε.
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Private σημείωση για εσένα
        </h2>
        <form action={saveAccountCustomerPrivateNote} className="mt-3 space-y-3">
          <input name="appointment_id" type="hidden" value={id} />
          <Textarea
            defaultValue={appointment.customerPrivateNote ?? ""}
            maxLength={500}
            name="customer_private_note"
            placeholder="Μόνο για εσένα."
          />
          <Button type="submit">
            <Save aria-hidden="true" className="h-4 w-4" />
            Αποθήκευση
          </Button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Μηνύματα με την επιχείρηση
        </h2>
        {appointment.messages.length > 0 ? (
          <ol className="mt-3 space-y-3">
            {appointment.messages.map((message) => (
              <li
                className="border-l-2 border-slate-200 pl-3 text-sm leading-relaxed text-slate-700"
                key={message.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">
                    {message.authorRole === "customer" ? "Εσύ" : "Επιχείρηση"}
                  </span>
                  <time className="text-xs text-slate-500">
                    {formatMessageTime(
                      message.createdAt,
                      appointment.business.timezone
                    )}
                  </time>
                </div>
                <p>{message.body}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Δεν υπάρχουν μηνύματα.
          </p>
        )}
        <form action={postAccountCustomerMessage} className="mt-4 space-y-3">
          <input name="appointment_id" type="hidden" value={id} />
          <Textarea
            maxLength={1000}
            name="body"
            placeholder="Γράψε μήνυμα προς την επιχείρηση."
            required
          />
          <Button type="submit">
            <Send aria-hidden="true" className="h-4 w-4" />
            Αποστολή
          </Button>
        </form>
      </section>
    </div>
  );
}
