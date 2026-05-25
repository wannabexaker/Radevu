type TodayHeaderProps = {
  counters: {
    cancelled: number;
    done: number;
    total: number;
  };
};

/**
 * Renders the Today dashboard counter summary.
 *
 * @param props - Total, done, and cancelled appointment counters.
 * @returns Header block for today's appointments.
 */
export function TodayHeader({ counters }: TodayHeaderProps): JSX.Element {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">Η μέρα σου</p>
      <p
        className="mt-2 text-base leading-relaxed text-slate-800"
        data-testid="today-counter"
      >
        {counters.total} ραντεβού σήμερα · {counters.done} ολοκληρωμένα ·{" "}
        {counters.cancelled} ακυρωμένα
      </p>
    </section>
  );
}
