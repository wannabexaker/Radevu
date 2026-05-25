"use client";

import type { DayKey, WorkingHoursInput } from "@radevu/shared";
import { CalendarClock } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { HoursDayCard } from "@/components/settings/HoursDayCard";
import { ToastInline } from "@/components/settings/ToastInline";
import type { HoursActionResult } from "./actions";

const orderedDays: Array<{
  key: DayKey;
  label: string;
}> = [
  { key: "mon", label: "Δευτέρα" },
  { key: "tue", label: "Τρίτη" },
  { key: "wed", label: "Τετάρτη" },
  { key: "thu", label: "Πέμπτη" },
  { key: "fri", label: "Παρασκευή" },
  { key: "sat", label: "Σάββατο" },
  { key: "sun", label: "Κυριακή" }
];

type HoursEditorProps = {
  initialWorkingHours: WorkingHoursInput;
  saveHoursAction: (workingHours: WorkingHoursInput) => Promise<HoursActionResult>;
};

function validateHours(workingHours: WorkingHoursInput): string | null {
  for (const day of orderedDays) {
    const intervals = workingHours[day.key];

    for (const interval of intervals) {
      if (interval.open >= interval.close) {
        return `${day.label}: η ώρα λήξης πρέπει να είναι μετά την ώρα έναρξης.`;
      }
    }

    const sortedIntervals = [...intervals].sort((left, right) =>
      left.open.localeCompare(right.open)
    );

    for (let index = 1; index < sortedIntervals.length; index += 1) {
      const previous = sortedIntervals[index - 1];
      const current = sortedIntervals[index];

      if (previous && current && previous.close > current.open) {
        return `${day.label}: τα ωράρια δεν πρέπει να καλύπτουν την ίδια ώρα.`;
      }
    }
  }

  return null;
}

/**
 * Renders the weekly working-hours editor.
 *
 * @param props - Initial working hours and save server action.
 * @returns A mobile-friendly weekly hours form.
 */
export function HoursEditor({
  initialWorkingHours,
  saveHoursAction
}: HoursEditorProps): JSX.Element {
  const [workingHours, setWorkingHours] =
    useState<WorkingHoursInput>(initialWorkingHours);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => setSuccess(null), 2200);
    return () => window.clearTimeout(timer);
  }, [success]);

  function saveHours(): void {
    const validationError = validateHours(workingHours);

    if (validationError) {
      setError(validationError);
      setSuccess(null);
      return;
    }

    startTransition(async () => {
      const result = await saveHoursAction(workingHours);

      if (!result.ok) {
        setError(result.error);
        setSuccess(null);
        return;
      }

      setError(null);
      setSuccess("Το ωράριο αποθηκεύτηκε.");
    });
  }

  return (
    <div className="space-y-5 pb-20">
      <header className="space-y-2">
        <p className="text-sm font-medium text-indigo-700">Ρυθμίσεις</p>
        <h1 className="text-2xl font-semibold text-slate-950">
          Ωράριο λειτουργίας
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">
          Αλλαγές στο ωράριο επηρεάζουν τις διαθέσιμες ώρες στο calendar των
          πελατών σου.
        </p>
      </header>

      <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
        <CalendarClock aria-hidden="true" className="mt-0.5 h-5 w-5" />
        <p className="leading-relaxed">
          Άνοιξε μόνο τις ημέρες που δουλεύεις. Μπορείς να βάλεις και δεύτερο
          ωράριο για διάλειμμα μέσα στη μέρα.
        </p>
      </div>

      <div className="space-y-3">
        {orderedDays.map((day) => (
          <HoursDayCard
            dayKey={day.key}
            dayLabel={day.label}
            intervals={workingHours[day.key]}
            key={day.key}
            onChange={(intervals) =>
              setWorkingHours((current) => ({
                ...current,
                [day.key]: intervals
              }))
            }
          />
        ))}
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {success ? <ToastInline message={success} /> : null}

      <div className="sticky bottom-20 z-10 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <Button
          className="w-full"
          data-testid="settings-hours-save"
          disabled={isPending}
          onClick={saveHours}
          type="button"
        >
          Αποθήκευση
        </Button>
      </div>
    </div>
  );
}
