"use client";

import { CalendarRange } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ChangeEvent } from "react";
import {
  todayRangeLabels,
  todayRangeOptions,
  type TodayRangeDays
} from "@/components/dashboard/today-range";

type TodayRangeSelectorProps = {
  selectedRange: TodayRangeDays;
};

/**
 * Renders a URL-driven dropdown for the dashboard program window.
 *
 * @param props - Current selected day range.
 * @returns A compact select control with 7, 14, and 30 day options.
 */
export function TodayRangeSelector({
  selectedRange
}: TodayRangeSelectorProps): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateRange(event: ChangeEvent<HTMLSelectElement>): void {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", event.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <section
      aria-label="Εύρος προβολής κρατήσεων"
      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
      data-testid="today-range-selector"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <CalendarRange aria-hidden="true" className="h-5 w-5 text-indigo-500" />
        <span>Προβολή</span>
      </div>
      <label className="sr-only" htmlFor="today-range">
        Ημέρες προγράμματος
      </label>
      <select
        className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        id="today-range"
        onChange={updateRange}
        value={selectedRange}
      >
        {todayRangeOptions.map((range) => (
          <option key={range} value={range}>
            {todayRangeLabels[range]}
          </option>
        ))}
      </select>
    </section>
  );
}
