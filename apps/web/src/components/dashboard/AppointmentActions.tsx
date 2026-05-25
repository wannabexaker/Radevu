"use client";

import { Check, Euro, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";

type AppointmentAction = (appointmentId: string) => Promise<void>;

type AppointmentActionsProps = {
  appointmentId: string;
  onCancel: AppointmentAction;
  onMarkDone: AppointmentAction;
  onTogglePaid: AppointmentAction;
  paid: boolean;
  status: "scheduled" | "done" | "cancelled";
};

/**
 * Renders one-tap appointment action buttons with client-side pending state.
 *
 * @param props - Appointment id, state, and server action callbacks.
 * @returns Action controls for done, cancel, and paid state.
 */
export function AppointmentActions({
  appointmentId,
  onCancel,
  onMarkDone,
  onTogglePaid,
  paid,
  status
}: AppointmentActionsProps): JSX.Element {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canChangeStatus = status === "scheduled";

  function runAction(action: AppointmentAction, label: string): void {
    setError(null);
    startTransition(() => {
      void action(appointmentId)
        .then(() => {
          router.refresh();
        })
        .catch((caughtError: unknown) => {
          console.error("Dashboard appointment action failed", {
            appointmentId,
            label,
            error: caughtError
          });
          setError("Δεν έγινε η αλλαγή. Δοκίμασε ξανά.");
        });
    });
  }

  async function confirmCancel(): Promise<void> {
    setError(null);

    try {
      await onCancel(appointmentId);
      setCancelOpen(false);
      router.refresh();
    } catch (caughtError) {
      console.error("Dashboard appointment cancel failed", {
        appointmentId,
        error: caughtError
      });
      setError("Δεν έγινε η ακύρωση. Δοκίμασε ξανά.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <Button
          className="px-2 text-xs"
          disabled={!canChangeStatus || isPending}
          onClick={() => runAction(onMarkDone, "mark_done")}
          type="button"
          variant="outline"
        >
          <Check aria-hidden="true" className="h-4 w-4" />
          Έγινε
        </Button>
        <Button
          className="px-2 text-xs"
          disabled={!canChangeStatus || isPending}
          onClick={() => setCancelOpen(true)}
          type="button"
          variant="outline"
        >
          <X aria-hidden="true" className="h-4 w-4" />
          Ακύρωση
        </Button>
        <Button
          className="px-2 text-xs"
          disabled={isPending}
          onClick={() => runAction(onTogglePaid, "toggle_paid")}
          type="button"
          variant={paid ? "secondary" : "outline"}
        >
          <Euro aria-hidden="true" className="h-4 w-4" />
          Πληρώθηκε
        </Button>
      </div>
      {error ? (
        <p className="rounded-md border border-red-500 bg-white px-3 py-2 text-sm text-slate-800">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        body="Σίγουρα να ακυρωθεί αυτή η κράτηση;"
        confirmLabel="Ακύρωση κράτησης"
        isSubmitting={isPending}
        onConfirm={confirmCancel}
        onOpenChange={setCancelOpen}
        open={cancelOpen}
        title="Ακύρωση κράτησης"
      />
    </div>
  );
}
