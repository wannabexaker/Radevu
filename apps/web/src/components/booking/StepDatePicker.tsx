"use client";

import {
  addMonths,
  type MonthAvailabilityDayDTO,
  type MonthAvailabilityDTO
} from "@radevu/shared";
import { useEffect, useMemo, useState } from "react";
import { CalendarMonth } from "./CalendarMonth";
import type { BookingService } from "./BookingFlow";

type StepDatePickerProps = {
  businessId: string;
  onDateSelect: (date: Date) => void;
  service: BookingService;
  timezone: string;
};

type MonthCursor = {
  month: number;
  year: number;
};

function datePartsInTimeZone(
  date: Date,
  timezone: string
): { day: string; month: string; year: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric"
  }).formatToParts(date);

  const getPart = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day")
  };
}

function todayDateISO(timezone: string): string {
  const parts = datePartsInTimeZone(new Date(), timezone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function cursorForDate(date: Date, timezone: string): MonthCursor {
  const parts = datePartsInTimeZone(date, timezone);
  return {
    year: Number(parts.year),
    month: Number(parts.month)
  };
}

function cursorFromUtcDate(date: Date): MonthCursor {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1
  };
}

function cursorDate(cursor: MonthCursor): Date {
  return new Date(Date.UTC(cursor.year, cursor.month - 1, 1, 12));
}

function shiftCursor(cursor: MonthCursor, delta: number): MonthCursor {
  return cursorFromUtcDate(addMonths(cursorDate(cursor), delta));
}

function compareCursors(a: MonthCursor, b: MonthCursor): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

function dateFromISO(dateISO: string): Date {
  const [year = 0, month = 1, day = 1] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function isMonthAvailabilityDTO(value: unknown): value is MonthAvailabilityDTO {
  if (!value || typeof value !== "object") {
    return false;
  }

  const days = (value as { days?: unknown }).days;

  return (
    Array.isArray(days) &&
    days.every((day: unknown): day is MonthAvailabilityDayDTO => {
      if (!day || typeof day !== "object") {
        return false;
      }

      const candidate = day as Partial<MonthAvailabilityDayDTO>;
      return (
        typeof candidate.date === "string" &&
        typeof candidate.slot_count === "number" &&
        (candidate.state === "closed" ||
          candidate.state === "full" ||
          candidate.state === "tight" ||
          candidate.state === "available" ||
          candidate.state === "open")
      );
    })
  );
}

function CalendarLoading(): JSX.Element {
  return (
    <div className="grid grid-cols-7 gap-0.5" data-testid="calendar-loading">
      {Array.from({ length: 35 }, (_, index) => (
        <span
          className="h-12 rounded-xl bg-slate-100"
          key={`calendar-loading-${index}`}
        />
      ))}
    </div>
  );
}

/**
 * Loads and renders month availability for the selected booking service.
 *
 * @param props - Business/service context plus selected-date callback.
 * @returns The date step with a month-grid calendar.
 */
export function StepDatePicker({
  businessId,
  onDateSelect,
  service,
  timezone
}: StepDatePickerProps): JSX.Element {
  const currentMonth = useMemo(() => cursorForDate(new Date(), timezone), [
    timezone
  ]);
  const maxMonth = useMemo(
    () =>
      cursorForDate(new Date(Date.now() + 90 * 24 * 60 * 60_000), timezone),
    [timezone]
  );
  const [cursor, setCursor] = useState<MonthCursor>(currentMonth);
  const [days, setDays] = useState<MonthAvailabilityDayDTO[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const todayDate = todayDateISO(timezone);
  const canGoPrev = compareCursors(cursor, currentMonth) > 0;
  const canGoNext = compareCursors(cursor, maxMonth) < 0;

  useEffect(() => {
    const controller = new AbortController();

    async function loadMonth(): Promise<void> {
      setStatus("loading");

      try {
        const params = new URLSearchParams({
          service_id: service.id,
          year: cursor.year.toString(),
          month: cursor.month.toString()
        });
        const response = await fetch(
          `/api/v1/businesses/${businessId}/availability/month?${params.toString()}`,
          {
            signal: controller.signal
          }
        );

        if (!response.ok) {
          console.error("Month availability request returned an error", {
            businessId,
            month: cursor.month,
            serviceId: service.id,
            status: response.status,
            year: cursor.year
          });
          setStatus("error");
          return;
        }

        const payload: unknown = await response.json();

        if (!isMonthAvailabilityDTO(payload)) {
          console.error("Month availability response had unexpected shape", {
            businessId,
            month: cursor.month,
            payload,
            serviceId: service.id,
            year: cursor.year
          });
          setStatus("error");
          return;
        }

        setDays(payload.days);
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) {
          // The request was intentionally cancelled when the month changed.
          return;
        }

        console.error("Month availability request failed", {
          businessId,
          month: cursor.month,
          serviceId: service.id,
          year: cursor.year,
          error
        });
        setStatus("error");
      }
    }

    void loadMonth();

    return () => controller.abort();
  }, [businessId, cursor.month, cursor.year, service.id]);

  function selectDate(dateISO: string): void {
    setSelectedDate(dateISO);
    onDateSelect(dateFromISO(dateISO));
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">
          Διάλεξε ημέρα
        </h2>
        <p className="mt-2 text-base text-slate-500">
          Για {service.name}, {service.durationMinutes} λεπτά.
        </p>
      </div>

      {status === "loading" ? <CalendarLoading /> : null}

      {status === "error" ? (
        <p className="rounded-xl border border-red-500 bg-white p-4 text-sm text-slate-800">
          Δεν μπορέσαμε να φορτώσουμε τις ημέρες. Δοκίμασε ξανά.
        </p>
      ) : null}

      {status === "ready" ? (
        <CalendarMonth
          canGoNext={canGoNext}
          canGoPrev={canGoPrev}
          days={days}
          month={cursor.month}
          onDayClick={selectDate}
          onNextMonth={() => setCursor((value) => shiftCursor(value, 1))}
          onPrevMonth={() => setCursor((value) => shiftCursor(value, -1))}
          selectedDate={selectedDate}
          todayDate={todayDate}
          year={cursor.year}
        />
      ) : null}
    </section>
  );
}
