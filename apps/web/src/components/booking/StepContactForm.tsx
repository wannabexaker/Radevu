"use client";

import { formatGreekDateTime } from "@radevu/shared";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  BookingService,
  BookingSlot,
  ConfirmedAppointment
} from "./BookingFlow";

type StepContactFormProps = {
  businessId: string;
  onConfirmed: (
    appointment: ConfirmedAppointment,
    customerEmail: string | null
  ) => void;
  service: BookingService;
  slot: BookingSlot;
  timezone: string;
};

type AppointmentResponse = {
  appointment: ConfirmedAppointment;
};

function optionalValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isAppointmentResponse(value: unknown): value is AppointmentResponse {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    Boolean((value as { appointment?: unknown }).appointment)
  );
}

export function StepContactForm({
  businessId,
  onConfirmed,
  service,
  slot,
  timezone
}: StepContactFormProps): JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitBooking(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = optionalValue(email);
    const trimmedPhone = optionalValue(phone);
    const trimmedNote = optionalValue(note);

    if (trimmedName.length < 2) {
      setError("Γράψε το όνομά σου.");
      return;
    }

    if (!trimmedEmail && !trimmedPhone) {
      setError("Γράψε email ή τηλέφωνο.");
      return;
    }

    if (trimmedPhone && trimmedPhone.length < 5) {
      setError("Το τηλέφωνο είναι πολύ μικρό.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/v1/appointments", {
        body: JSON.stringify({
          business_id: businessId,
          service_id: service.id,
          starts_at: slot.starts_at,
          customer: {
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone
          },
          note: trimmedNote
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        console.error("Appointment booking returned an error", {
          businessId,
          serviceId: service.id,
          startsAt: slot.starts_at,
          status: response.status
        });
        setError(
          response.status === 409
            ? "Η ώρα δεν είναι πλέον διαθέσιμη. Διάλεξε άλλη ώρα."
            : "Δεν μπορέσαμε να ολοκληρώσουμε την κράτηση."
        );
        return;
      }

      const payload: unknown = await response.json();

      if (!isAppointmentResponse(payload)) {
        console.error("Appointment response had unexpected shape", {
          businessId,
          serviceId: service.id,
          startsAt: slot.starts_at,
          payload
        });
        setError("Δεν μπορέσαμε να ολοκληρώσουμε την κράτηση.");
        return;
      }

      onConfirmed(payload.appointment, trimmedEmail ?? null);
    } catch (caughtError) {
      console.error("Appointment booking request failed", {
        businessId,
        serviceId: service.id,
        startsAt: slot.starts_at,
        error: caughtError
      });
      setError("Δεν μπορέσαμε να ολοκληρώσουμε την κράτηση.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Τα στοιχεία σου
        </h2>
        <p className="mt-2 text-base text-slate-500">
          {service.name} ·{" "}
          {formatGreekDateTime(new Date(slot.starts_at), timezone)}
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={submitBooking}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="booking-name">Όνομα</Label>
          <Input
            autoComplete="name"
            id="booking-name"
            minLength={2}
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="booking-email">Email</Label>
          <Input
            autoComplete="email"
            id="booking-email"
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            value={email}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="booking-phone">Τηλέφωνο</Label>
          <Input
            autoComplete="tel"
            id="booking-phone"
            minLength={5}
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            value={phone}
          />
          <p className="text-sm text-slate-500">Χρειάζεται email ή τηλέφωνο.</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="booking-note">Σημείωση</Label>
          <Textarea
            id="booking-note"
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            value={note}
          />
        </div>

        {error ? (
          <p
            aria-live="polite"
            className="rounded-md border border-red-500 bg-white px-3 py-2 text-sm text-slate-800"
          >
            {error}
          </p>
        ) : null}

        <Button className="mt-2 w-full" disabled={submitting} type="submit">
          {submitting ? "Ολοκληρώνουμε την κράτηση..." : "Επιβεβαίωση"}
        </Button>
      </form>
    </section>
  );
}
