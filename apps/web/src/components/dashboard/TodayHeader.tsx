type TodayHeaderProps = {
  counters: {
    cancelled: number;
    done: number;
    total: number;
  };
  rangeDays: 7 | 14 | 30;
};

/**
 * Renders the dashboard counter summary for the selected upcoming window.
 *
 * @param props - Total, done, cancelled counters, and selected day range.
 * @returns Header block for upcoming appointments.
 */
export function TodayHeader({
  counters,
  rangeDays
}: TodayHeaderProps): JSX.Element {
  const rangeLabel =
    rangeDays === 30
      ? "στις επόμενες 30 ημέρες"
      : `στις επόμενες ${rangeDays} ημέρες`;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">Το πρόγραμμα σου</p>
      <p
        className="mt-2 text-base leading-relaxed text-slate-800"
        data-testid="today-counter"
      >
        {counters.total} ραντεβού {rangeLabel} · {counters.done} ολοκληρωμένα ·{" "}
        {counters.cancelled} ακυρωμένα
      </p>
    </section>
  );
}
