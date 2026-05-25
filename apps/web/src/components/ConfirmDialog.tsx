"use client";

import { Modal } from "@/components/Modal";

type ConfirmDialogProps = {
  body: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

/**
 * Renders a destructive confirmation dialog.
 *
 * @param props - Dialog copy, open state, and confirm handler.
 * @returns A confirmation modal.
 */
export function ConfirmDialog({
  body,
  confirmLabel = "Διαγραφή",
  isSubmitting = false,
  onConfirm,
  onOpenChange,
  open,
  title
}: ConfirmDialogProps): JSX.Element {
  async function handleConfirm(): Promise<void> {
    try {
      await onConfirm();
    } catch (error) {
      console.error("Confirm dialog action failed", {
        title,
        error
      });
    }
  }

  return (
    <Modal onOpenChange={onOpenChange} open={open} title={title}>
      <div className="flex flex-col gap-5">
        <p className="text-base leading-relaxed text-slate-500">{body}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-medium text-slate-800 transition-colors hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Άκυρο
          </button>
          <button
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-red-500 active:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={isSubmitting}
            onClick={handleConfirm}
            type="button"
          >
            {isSubmitting ? "Διαγραφή..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
