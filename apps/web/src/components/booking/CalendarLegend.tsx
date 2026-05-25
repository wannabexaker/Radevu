"use client";

const items = [
  {
    className: "bg-indigo-500",
    label: "ελεύθερο"
  },
  {
    className: "bg-amber-500",
    label: "γεμίζει"
  },
  {
    className: "bg-red-500",
    label: "γεμάτο"
  },
  {
    className: "bg-slate-300",
    label: "κλειστά"
  }
] as const;

/**
 * Renders the calendar availability legend with the locked Greek labels.
 *
 * @returns A compact legend strip for the month calendar.
 */
export function CalendarLegend(): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
      {items.map((item) => (
        <span className="inline-flex items-center gap-1.5" key={item.label}>
          <span className={`h-2 w-2 rounded-full ${item.className}`} />
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  );
}
