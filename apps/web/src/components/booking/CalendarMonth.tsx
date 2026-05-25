"use client";

import {
  formatGreekMonth,
  type MonthAvailabilityDayDTO
} from "@radevu/shared";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarDay } from "./CalendarDay";
import { CalendarLegend } from "./CalendarLegend";

type CalendarMonthProps = {
  canGoNext: boolean;
  canGoPrev: boolean;
  days: MonthAvailabilityDayDTO[];
  month: number;
  onDayClick: (dateISO: string) => void;
  onNextMonth: () => void;
  onPrevMonth: () => void;
  selectedDate: string | null;
  todayDate: string;
  year: number;
};

const dayLabels = ["Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ", "Κυρ"];

function dayNumber(dateISO: string): number {
  const [, , day = "0"] = dateISO.split("-");
  return Number(day);
}

function firstDayOffset(year: number, month: number): number {
  const firstDay = new Date(Date.UTC(year, month - 1, 1, 12));
  return (firstDay.getUTCDay() + 6) % 7;
}

/**
 * Renders one month of availability as a calm, mobile-sized calendar grid.
 *
 * @param props - Month identity, day density data, selected/today state, and navigation handlers.
 * @returns A full month calendar with density dots and legend.
 */
export function CalendarMonth({
  canGoNext,
  canGoPrev,
  days,
  month,
  onDayClick,
  onNextMonth,
  onPrevMonth,
  selectedDate,
  todayDate,
  year
}: CalendarMonthProps): JSX.Element {
  const blanks = Array.from({ length: firstDayOffset(year, month) });
  const monthLabel = formatGreekMonth(new Date(Date.UTC(year, month - 1, 1, 12)));

  return (
    <div className="flex flex-col gap-3" data-testid="calendar-month">
      <div className="flex items-center justify-between gap-2">
        <Button
          aria-label="Προηγούμενος μήνας"
          data-testid="calendar-prev-month"
          disabled={!canGoPrev}
          onClick={onPrevMonth}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h3
          className="text-center text-xl font-semibold text-slate-900"
          data-testid="calendar-month-header"
        >
          {monthLabel}
        </h3>
        <Button
          aria-label="Επόμενος μήνας"
          data-testid="calendar-next-month"
          disabled={!canGoNext}
          onClick={onNextMonth}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-semibold text-slate-500">
        {dayLabels.map((label) => (
          <span className="py-1" key={label}>
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {blanks.map((_, index) => (
          <span aria-hidden="true" key={`blank-${index}`} />
        ))}
        {days.map((day) => (
          <CalendarDay
            day={dayNumber(day.date)}
            isPast={day.date < todayDate}
            isSelected={day.date === selectedDate}
            isToday={day.date === todayDate}
            key={day.date}
            onClick={() => onDayClick(day.date)}
            state={day.state}
          />
        ))}
      </div>

      <CalendarLegend />
    </div>
  );
}
