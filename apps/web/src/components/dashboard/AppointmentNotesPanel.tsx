"use client";

import { Lock, MessageSquare, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AppointmentWithRelations } from "@/lib/appointments";

type AppointmentMessage = AppointmentWithRelations["messages"][number];

type SavePrivateNotesAction = (
  appointmentId: string,
  notes: string
) => Promise<void>;

type PostMessageAction = (
  appointmentId: string,
  body: string
) => Promise<void>;

type AppointmentNotesPanelProps = {
  appointmentId: string;
  customerNote: string | null;
  messages: AppointmentMessage[];
  notes: string | null;
  onPostMessage: PostMessageAction;
  onSavePrivateNotes: SavePrivateNotesAction;
  timezone: string;
};

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

function authorLabel(authorRole: AppointmentMessage["authorRole"]): string {
  return authorRole === "business" ? "Επιχείρηση" : "Πελάτης";
}

export function AppointmentNotesPanel({
  appointmentId,
  customerNote,
  messages,
  notes,
  onPostMessage,
  onSavePrivateNotes,
  timezone
}: AppointmentNotesPanelProps): JSX.Element {
  const router = useRouter();
  const [privateNotes, setPrivateNotes] = useState(notes ?? "");
  const [messageBody, setMessageBody] = useState("");
  const [privateError, setPrivateError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [privateSuccess, setPrivateSuccess] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [isSavingPrivate, startSavingPrivate] = useTransition();
  const [isPostingMessage, startPostingMessage] = useTransition();
  const legacyCustomerNote =
    customerNote &&
    !messages.some(
      (message) =>
        message.authorRole === "customer" && message.body === customerNote
    )
      ? customerNote
      : null;

  function submitPrivateNotes(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setPrivateError(null);
    setPrivateSuccess(false);

    startSavingPrivate(() => {
      void onSavePrivateNotes(appointmentId, privateNotes)
        .then(() => {
          setPrivateSuccess(true);
          router.refresh();
        })
        .catch((error: unknown) => {
          console.error("Appointment private notes save failed", {
            appointmentId,
            error
          });
          setPrivateError("Δεν αποθηκεύτηκε. Δοκίμασε ξανά.");
        });
    });
  }

  function submitMessage(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setMessageError(null);
    setMessageSuccess(false);

    const trimmed = messageBody.trim();

    if (!trimmed) {
      setMessageError("Γράψε μήνυμα.");
      return;
    }

    startPostingMessage(() => {
      void onPostMessage(appointmentId, trimmed)
        .then(() => {
          setMessageBody("");
          setMessageSuccess(true);
          router.refresh();
        })
        .catch((error: unknown) => {
          console.error("Appointment owner message post failed", {
            appointmentId,
            error
          });
          setMessageError("Δεν στάλθηκε. Δοκίμασε ξανά.");
        });
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-slate-200 pt-4">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Lock aria-hidden="true" className="h-4 w-4 text-slate-500" />
          Ιδιωτική σημείωση επιχείρησης
        </div>
        <form className="flex flex-col gap-2" onSubmit={submitPrivateNotes}>
          <Textarea
            maxLength={500}
            onChange={(event) => setPrivateNotes(event.target.value)}
            placeholder="Μόνο για εσένα."
            rows={3}
            value={privateNotes}
          />
          <div className="flex items-center gap-2">
            <Button
              disabled={isSavingPrivate}
              size="sm"
              type="submit"
              variant="outline"
            >
              <Save aria-hidden="true" className="h-4 w-4" />
              Αποθήκευση
            </Button>
            {privateSuccess ? (
              <span className="text-sm text-slate-500">Αποθηκεύτηκε.</span>
            ) : null}
          </div>
          {privateError ? (
            <p className="rounded-md border border-red-500 bg-white px-3 py-2 text-sm text-slate-800">
              {privateError}
            </p>
          ) : null}
        </form>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MessageSquare aria-hidden="true" className="h-4 w-4 text-slate-500" />
          Μηνύματα με πελάτη
        </div>
        {legacyCustomerNote ? (
          <div className="border-l-2 border-slate-200 pl-3 text-sm leading-relaxed text-slate-700">
            <p className="font-medium text-slate-900">Πελάτης</p>
            <p>{legacyCustomerNote}</p>
          </div>
        ) : null}
        {messages.length > 0 ? (
          <ol className="flex flex-col gap-2">
            {messages.map((message) => (
              <li
                className="border-l-2 border-slate-200 pl-3 text-sm leading-relaxed text-slate-700"
                key={message.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">
                    {authorLabel(message.authorRole)}
                  </span>
                  <time className="text-xs text-slate-500">
                    {formatMessageTime(message.createdAt, timezone)}
                  </time>
                </div>
                <p>{message.body}</p>
              </li>
            ))}
          </ol>
        ) : legacyCustomerNote ? null : (
          <p className="text-sm text-slate-500">Δεν υπάρχουν μηνύματα.</p>
        )}
        <form className="flex flex-col gap-2" onSubmit={submitMessage}>
          <Textarea
            maxLength={1000}
            onChange={(event) => setMessageBody(event.target.value)}
            placeholder="Απάντηση προς τον πελάτη."
            rows={3}
            value={messageBody}
          />
          <div className="flex items-center gap-2">
            <Button
              disabled={isPostingMessage}
              size="sm"
              type="submit"
              variant="outline"
            >
              <Send aria-hidden="true" className="h-4 w-4" />
              Αποστολή
            </Button>
            {messageSuccess ? (
              <span className="text-sm text-slate-500">Στάλθηκε.</span>
            ) : null}
          </div>
          {messageError ? (
            <p className="rounded-md border border-red-500 bg-white px-3 py-2 text-sm text-slate-800">
              {messageError}
            </p>
          ) : null}
        </form>
      </section>
    </div>
  );
}
