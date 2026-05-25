"use client";

import { formatGreekTime } from "@radevu/shared";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BookingService, BookingSlot } from "./BookingFlow";

type StepSlotPickerProps = {
  businessId: string;
  dateISO: string;
  onBack: () => void;
  onSelect: (slot: BookingSlot) => void;
  service: BookingService;
  timezone: string;
};

type SlotsResponse = {
  slots: BookingSlot[];
};

function isSlotsResponse(value: unknown): value is SlotsResponse {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    Array.isArray((value as { slots?: unknown }).slots)
  );
}

export function StepSlotPicker({
  businessId,
  dateISO,
  onBack,
  onSelect,
  service,
  timezone
}: StepSlotPickerProps): JSX.Element {
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadSlots(): Promise<void> {
      setStatus("loading");

      try {
        const response = await fetch(
          `/api/v1/businesses/${businessId}/availability?service_id=${service.id}&date=${dateISO}`,
          {
            signal: controller.signal
          }
        );

        if (!response.ok) {
          console.error("Availability request returned an error", {
            businessId,
            dateISO,
            serviceId: service.id,
            status: response.status
          });
          setStatus("error");
          return;
        }

        const payload: unknown = await response.json();

        if (!isSlotsResponse(payload)) {
          console.error("Availability response had unexpected shape", {
            businessId,
            dateISO,
            serviceId: service.id,
            payload
          });
          setStatus("error");
          return;
        }

        setSlots(payload.slots);
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) {
          // The request was intentionally cancelled when the step changed or unmounted.
          return;
        }

        console.error("Availability request failed", {
          businessId,
          dateISO,
          serviceId: service.id,
          error
        });
        setStatus("error");
      }
    }

    void loadSlots();

    return () => controller.abort();
  }, [businessId, dateISO, service.id]);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Διάλεξε ώρα
        </h2>
        <p className="mt-2 text-base text-slate-500">{service.name}</p>
      </div>

      {status === "loading" ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Φορτώνουμε τις διαθέσιμες ώρες.
        </p>
      ) : null}

      {status === "error" ? (
        <div className="rounded-xl border border-red-500 bg-white p-4">
          <p className="text-sm text-slate-800">
            Δεν μπορέσαμε να φορτώσουμε τις ώρες. Δοκίμασε ξανά.
          </p>
          <Button className="mt-4" onClick={onBack} type="button" variant="outline">
            Πίσω
          </Button>
        </div>
      ) : null}

      {status === "ready" && slots.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm leading-relaxed text-slate-800">
            Δεν υπάρχουν διαθέσιμες ώρες αυτή τη μέρα. Δοκίμασε άλλη μέρα.
          </p>
          <Button className="mt-4" onClick={onBack} type="button" variant="outline">
            Πίσω
          </Button>
        </div>
      ) : null}

      {status === "ready" && slots.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {slots.map((slot) => (
            <button
              className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-900 shadow-sm transition-colors active:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              data-testid="slot-option"
              key={slot.starts_at}
              onClick={() => onSelect(slot)}
              type="button"
            >
              {formatGreekTime(new Date(slot.starts_at), timezone)}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
