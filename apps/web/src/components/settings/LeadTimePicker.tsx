"use client";

import type { ReminderLeadMinutes } from "@radevu/shared";
import { cn } from "@/lib/utils";

const leadOptions: Array<{
  label: string;
  value: ReminderLeadMinutes;
}> = [
  { label: "12 ώρες πριν", value: 720 },
  { label: "24 ώρες πριν", value: 1440 },
  { label: "48 ώρες πριν", value: 2880 }
];

type LeadTimePickerProps = {
  name: string;
  onChange: (value: ReminderLeadMinutes) => void;
  value: ReminderLeadMinutes;
};

/**
 * Renders radio-card options for reminder lead time.
 *
 * @param props - Field name, selected value, and change callback.
 * @returns A mobile-friendly lead-time picker.
 */
export function LeadTimePicker({
  name,
  onChange,
  value
}: LeadTimePickerProps): JSX.Element {
  return (
    <div className="grid gap-2">
      {leadOptions.map((option) => {
        const selected = option.value === value;

        return (
          <label
            className={cn(
              "flex min-h-12 cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition-colors",
              selected && "border-indigo-500 bg-indigo-50 text-indigo-900"
            )}
            data-testid={`lead-time-${option.value}`}
            key={option.value}
          >
            <span>{option.label}</span>
            <input
              checked={selected}
              className="h-5 w-5 accent-indigo-500"
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
          </label>
        );
      })}
    </div>
  );
}
