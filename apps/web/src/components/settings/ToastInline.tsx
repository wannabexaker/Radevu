import { Check } from "lucide-react";

type ToastInlineProps = {
  message: string;
};

/**
 * Renders a small inline success message for settings forms.
 *
 * @param props - Message to display next to the check icon.
 * @returns Inline confirmation text.
 */
export function ToastInline({ message }: ToastInlineProps): JSX.Element {
  return (
    <p
      aria-live="polite"
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-500 bg-white px-3 py-2 text-sm font-medium text-slate-800"
    >
      <Check aria-hidden="true" className="h-4 w-4 text-emerald-500" />
      {message}
    </p>
  );
}
