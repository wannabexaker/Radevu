import { parseWorkingHours, type DayKey } from "@radevu/shared";

type WorkingHoursSummaryProps = {
  workingHours: unknown;
};

const dayLabels: Record<DayKey, string> = {
  mon: "Δευτέρα",
  tue: "Τρίτη",
  wed: "Τετάρτη",
  thu: "Πέμπτη",
  fri: "Παρασκευή",
  sat: "Σάββατο",
  sun: "Κυριακή"
};

const orderedDays: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function WorkingHoursSummary({
  workingHours
}: WorkingHoursSummaryProps): JSX.Element {
  const parsedWorkingHours = parseWorkingHours(workingHours);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Ωράριο</h2>
      <div className="mt-4 flex flex-col gap-3">
        {orderedDays.map((day) => {
          const intervals = parsedWorkingHours[day];
          const label =
            intervals.length > 0
              ? intervals
                  .map((interval) => `${interval.open} - ${interval.close}`)
                  .join(", ")
              : "Κλειστά";

          return (
            <div
              className="flex items-start justify-between gap-4 text-sm"
              key={day}
            >
              <span className="font-medium text-slate-800">{dayLabels[day]}</span>
              <span className="text-right text-slate-500">{label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
