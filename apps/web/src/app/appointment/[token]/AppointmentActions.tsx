"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StepDatePicker } from "@/components/booking/StepDatePicker";
import { StepSlotPicker } from "@/components/booking/StepSlotPicker";
import type { BookingService, BookingSlot } from "@/components/booking/BookingFlow";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  businessId: string;
  service: BookingService;
  status: "scheduled" | "done" | "cancelled";
  token: string;
  timezone: string;
};

type Notice = { kind: "error" | "success"; text: string } | null;

function dateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function errorMessage(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (payload && typeof payload === "object") {
    const error = (payload as { error?: unknown }).error;
    if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") {
      return (error as { message: string }).message;
    }
  }
  return "Η ενέργεια δεν ολοκληρώθηκε. Δοκίμασε ξανά.";
}

export function AppointmentActions({ businessId, service, status, token, timezone }: Props): JSX.Element {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [busy, setBusy] = useState<"cancel" | "reschedule" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  async function cancelAppointment(): Promise<void> {
    setBusy("cancel");
    setNotice(null);
    const response = await fetch(`/api/v1/appointment-actions/${token}/cancel`, {
      body: JSON.stringify({ reason }),
      headers: { "content-type": "application/json" },
      method: "POST"
    });
    if (!response.ok) {
      setNotice({ kind: "error", text: await errorMessage(response) });
      setBusy(null);
      return;
    }
    setNotice({ kind: "success", text: "Το ραντεβού ακυρώθηκε και η επιχείρηση ενημερώθηκε." });
    setBusy(null);
    router.refresh();
  }

  async function requestReschedule(slot: BookingSlot): Promise<void> {
    setBusy("reschedule");
    setNotice(null);
    const response = await fetch(`/api/v1/appointment-actions/${token}/reschedule-request`, {
      body: JSON.stringify({ starts_at: slot.starts_at }),
      headers: { "content-type": "application/json" },
      method: "POST"
    });
    if (!response.ok) {
      setNotice({ kind: "error", text: await errorMessage(response) });
      setBusy(null);
      return;
    }
    setNotice({ kind: "success", text: "Το αίτημα στάλθηκε. Θα ενημερωθείς με email μετά την απάντηση της επιχείρησης." });
    setBusy(null);
    router.refresh();
  }

  if (status !== "scheduled") return <></>;

  return (
    <div className="flex flex-col gap-5">
      {notice ? (
        <p className={`rounded-xl border p-4 text-sm ${notice.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`} role="status">
          {notice.text}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" id="reschedule">
        <h2 className="text-xl font-semibold text-slate-900">Αλλαγή ώρας</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Διάλεξε νέα διαθέσιμη ώρα. Η επιχείρηση θα εγκρίνει ή θα απορρίψει το αίτημα.
        </p>
        <div className="mt-5">
          {selectedDate ? (
            <StepSlotPicker
              businessId={businessId}
              dateISO={selectedDate}
              onBack={() => setSelectedDate(null)}
              onSelect={(slot) => void requestReschedule(slot)}
              service={service}
              timezone={timezone}
            />
          ) : (
            <StepDatePicker
              businessId={businessId}
              onDateSelect={(date) => setSelectedDate(dateISO(date))}
              service={service}
              timezone={timezone}
            />
          )}
        </div>
        {busy === "reschedule" ? <p className="mt-3 text-sm text-slate-500">Στέλνουμε το αίτημα…</p> : null}
      </section>

      <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm" id="cancel">
        <h2 className="text-xl font-semibold text-slate-900">Ακύρωση</h2>
        <label className="mt-4 block text-sm font-medium text-slate-800" htmlFor="cancellation-reason">
          Λόγος ακύρωσης
        </label>
        <Textarea
          className="mt-2"
          id="cancellation-reason"
          maxLength={500}
          minLength={3}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Γράψε σύντομα γιατί ακυρώνεις."
          required
          rows={4}
          value={reason}
        />
        <Button
          className="mt-4 min-h-12 w-full"
          disabled={busy !== null || reason.trim().length < 3}
          onClick={() => void cancelAppointment()}
          type="button"
          variant="destructive"
        >
          {busy === "cancel" ? "Ακύρωση…" : "Ακύρωση ραντεβού"}
        </Button>
      </section>
    </div>
  );
}
