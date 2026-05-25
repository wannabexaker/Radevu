"use client";

import type { MonthAvailabilityDayDTO } from "@radevu/shared";
import { cn } from "@/lib/utils";

type CalendarDayProps = {
  day: number;
  isPast: boolean;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
  state: MonthAvailabilityDayDTO["state"];
};

const stateLabels: Record<MonthAvailabilityDayDTO["state"], string> = {
  available: "ελεύθερο",
  closed: "κλειστά",
  full: "γεμάτο",
  open: "ελεύθερο",
  tight: "γεμίζει"
};

const dotClassByState: Record<MonthAvailabilityDayDTO["state"], string> = {
  available: "bg-indigo-500",
  closed: "bg-slate-300",
  full: "bg-red-500",
  open: "bg-emerald-500",
  tight: "bg-amber-500"
};

/**
 * Renders a single tappable calendar day with an availability density marker.
 *
 * @param props - Day number, visual state flags, density state, and click handler.
 * @returns A mobile-sized calendar day button.
 */
export function CalendarDay({
  day,
  isPast,
  isSelected,
  isToday,
  onClick,
  state
}: CalendarDayProps): JSX.Element {
  const disabled = isPast || state === "closed" || state === "full";
  const label = stateLabels[state];

  return (
    <button
      aria-label={`${day}, ${label}`}
      className={cn(
        "flex h-12 min-h-12 w-full flex-col items-center justify-center rounded-xl border border-transparent text-center text-sm font-semibold text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
        isToday && !isSelected && "border-indigo-500",
        isSelected && "bg-indigo-500 text-white",
        !isSelected && !disabled && "bg-white active:bg-slate-50",
        disabled && "cursor-not-allowed bg-slate-50 text-slate-400",
        isPast && "text-slate-300"
      )}
      data-state={state}
      data-testid="calendar-day"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span>{day}</span>
      {state === "closed" ? (
        <span
          className={cn(
            "mt-0.5 text-xs leading-none",
            isSelected ? "text-white" : "text-slate-400"
          )}
          data-state={state}
          data-testid="calendar-day-dot"
        >
          —
        </span>
      ) : (
        <span
          className={cn(
            "mt-1 h-1.5 w-1.5 rounded-full",
            isSelected ? "bg-white" : dotClassByState[state]
          )}
          data-state={state}
          data-testid="calendar-day-dot"
        />
      )}
    </button>
  );
}
