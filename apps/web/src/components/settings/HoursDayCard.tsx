"use client";

import type { DayKey, WorkingHours } from "@radevu/shared";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { IntervalRow } from "@/components/settings/IntervalRow";

type HoursDayCardProps = {
  dayKey: DayKey;
  dayLabel: string;
  intervals: WorkingHours[DayKey];
  onChange: (intervals: WorkingHours[DayKey]) => void;
};

const defaultInterval = {
  open: "09:00",
  close: "17:00"
};

/**
 * Renders one day card for the owner hours editor.
 *
 * @param props - Day key, label, current intervals, and change callback.
 * @returns A card with open/closed switch and native time inputs.
 */
export function HoursDayCard({
  dayKey,
  dayLabel,
  intervals,
  onChange
}: HoursDayCardProps): JSX.Element {
  const isOpen = intervals.length > 0;

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-4"
      data-day={dayKey}
      data-testid={`hours-day-${dayKey}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{dayLabel}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isOpen ? "Ανοιχτά" : "Κλειστά"}
          </p>
        </div>
        <Switch
          aria-label={`${dayLabel} ανοιχτά`}
          checked={isOpen}
          onCheckedChange={(checked) =>
            onChange(checked ? [defaultInterval] : [])
          }
        />
      </div>

      {isOpen ? (
        <div className="mt-4 flex flex-col gap-3">
          {intervals.map((interval, index) => (
            <IntervalRow
              interval={interval}
              key={`${dayKey}-${index}`}
              onChange={(nextInterval) =>
                onChange(
                  intervals.map((currentInterval, currentIndex) =>
                    currentIndex === index ? nextInterval : currentInterval
                  )
                )
              }
              onRemove={() =>
                onChange(
                  intervals.filter((_, currentIndex) => currentIndex !== index)
                )
              }
            />
          ))}
          <Button
            className="w-full"
            onClick={() => onChange([...intervals, defaultInterval])}
            type="button"
            variant="outline"
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
            Προσθήκη ωραρίου
          </Button>
        </div>
      ) : null}
    </section>
  );
}
