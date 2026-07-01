import { Check, ChevronRight, Circle } from "lucide-react";
import Link from "next/link";
import type { OnboardingStep } from "@/lib/onboarding";

type OnboardingChecklistProps = {
  steps: OnboardingStep[];
};

/**
 * Shows a dismissible-on-complete onboarding checklist for new business owners.
 * Renders nothing once every step is done.
 */
export function OnboardingChecklist({
  steps
}: OnboardingChecklistProps): JSX.Element | null {
  if (steps.length === 0) {
    return null;
  }

  const doneCount = steps.filter((step) => step.done).length;

  if (doneCount === steps.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-indigo-950">Ξεκίνα εδώ</h2>
        <span className="text-sm font-medium text-indigo-700">
          {doneCount}/{steps.length}
        </span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-indigo-800">
        Ολοκλήρωσε το προφίλ σου για να σε βρίσκουν και να δέχεσαι ραντεβού.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              className="flex min-h-11 items-center gap-3 rounded-xl border border-indigo-100 bg-white px-3 py-2 transition-colors active:bg-indigo-100"
              href={step.href}
            >
              {step.done ? (
                <Check
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-emerald-500"
                />
              ) : (
                <Circle
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-indigo-300"
                />
              )}
              <span
                className={
                  step.done
                    ? "flex-1 text-sm text-slate-400 line-through"
                    : "flex-1 text-sm font-medium text-slate-800"
                }
              >
                {step.label}
              </span>
              {step.done ? null : (
                <ChevronRight
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-indigo-400"
                />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
