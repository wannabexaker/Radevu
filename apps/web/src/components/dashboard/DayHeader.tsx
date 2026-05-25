type DayHeaderProps = {
  count: number;
  date: Date;
  timezone: string;
};

function formatDay(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "long",
    timeZone: timezone,
    weekday: "long"
  }).format(date);
}

/**
 * Renders a sticky day header for grouped appointment lists.
 *
 * @param props - Date, appointment count, and business timezone.
 * @returns Greek day label with count.
 */
export function DayHeader({
  count,
  date,
  timezone
}: DayHeaderProps): JSX.Element {
  return (
    <div className="sticky top-0 z-10 -mx-1 bg-white/95 px-1 py-2 backdrop-blur">
      <h2 className="text-sm font-semibold uppercase text-slate-500">
        {formatDay(date, timezone)} · {count}
      </h2>
    </div>
  );
}
