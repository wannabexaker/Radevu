import type { Metadata } from "next";
import { Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { isAppointmentGuestTokenValid } from "@/lib/appointment-access";
import { prisma } from "@/lib/db";
import {
  postCustomerAppointmentMessage,
  saveCustomerPrivateNote
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Σημειώσεις ραντεβού · Radevu"
};

type CustomerAppointmentPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    saved?: string;
    token?: string;
  }>;
};

type Message = {
  authorRole: "business" | "customer";
  body: string;
  createdAt: Date;
  id: string;
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

function authorLabel(message: Message): string {
  return message.authorRole === "customer" ? "Εσύ" : "Επιχείρηση";
}

function AccessError(): JSX.Element {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <section className="mx-auto flex max-w-md flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold leading-tight text-slate-900">
          Ο σύνδεσμος δεν ισχύει
        </h1>
        <p className="text-base leading-relaxed text-slate-600">
          Άνοιξε τον σύνδεσμο από το email επιβεβαίωσης ή επικοινώνησε με την
          επιχείρηση.
        </p>
      </section>
    </main>
  );
}

export default async function CustomerAppointmentPage({
  params,
  searchParams
}: CustomerAppointmentPageProps): Promise<JSX.Element> {
  const { id } = await params;
  const { saved, token = "" } = await searchParams;
  const appointment = await prisma.appointment.findUnique({
    where: {
      id
    },
    select: {
      customerPrivateNote: true,
      guestTokenExpiresAt: true,
      guestTokenHash: true,
      startsAt: true,
      business: {
        select: {
          contactEmail: true,
          contactPhone: true,
          name: true,
          timezone: true
        }
      },
      customer: {
        select: {
          name: true
        }
      },
      service: {
        select: {
          name: true
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
      }
    }
  });

  if (
    !appointment ||
    !isAppointmentGuestTokenValid(
      token,
      appointment.guestTokenHash,
      appointment.guestTokenExpiresAt
    )
  ) {
    return <AccessError />;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <section className="mx-auto flex max-w-md flex-col gap-5">
        <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Radevu</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-900">
            Σημειώσεις και μηνύματα
          </h1>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Επιχείρηση</dt>
              <dd className="font-semibold text-slate-900">
                {appointment.business.name}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Υπηρεσία</dt>
              <dd className="font-semibold text-slate-900">
                {appointment.service.name}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Ώρα</dt>
              <dd className="font-semibold text-slate-900">
                {formatDateTime(
                  appointment.startsAt,
                  appointment.business.timezone
                )}
              </dd>
            </div>
          </dl>
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

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Private σημείωση για εσένα
          </h2>
          <form action={saveCustomerPrivateNote} className="mt-3 flex flex-col gap-3">
            <input name="appointment_id" type="hidden" value={id} />
            <input name="token" type="hidden" value={token} />
            <Textarea
              defaultValue={appointment.customerPrivateNote ?? ""}
              maxLength={500}
              name="customer_private_note"
              placeholder="Μόνο για εσένα."
              rows={4}
            />
            <Button type="submit">
              <Save aria-hidden="true" className="h-4 w-4" />
              Αποθήκευση
            </Button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Μηνύματα με την επιχείρηση
          </h2>
          {appointment.messages.length > 0 ? (
            <ol className="mt-3 flex flex-col gap-3">
              {appointment.messages.map((message) => (
                <li
                  className="border-l-2 border-slate-200 pl-3 text-sm leading-relaxed text-slate-700"
                  key={message.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {authorLabel(message)}
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
            <p className="mt-3 text-sm text-slate-500">Δεν υπάρχουν μηνύματα.</p>
          )}
          <form
            action={postCustomerAppointmentMessage}
            className="mt-4 flex flex-col gap-3"
          >
            <input name="appointment_id" type="hidden" value={id} />
            <input name="token" type="hidden" value={token} />
            <Textarea
              maxLength={1000}
              name="body"
              placeholder="Γράψε μήνυμα προς την επιχείρηση."
              required
              rows={4}
            />
            <Button type="submit">
              <Send aria-hidden="true" className="h-4 w-4" />
              Αποστολή
            </Button>
          </form>
        </section>
      </section>
    </main>
  );
}
