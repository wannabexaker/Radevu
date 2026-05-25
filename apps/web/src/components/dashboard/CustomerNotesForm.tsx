"use client";

import { type FormEvent, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SaveCustomerNotesAction = (
  customerId: string,
  formData: FormData
) => Promise<void>;

type CustomerNotesFormProps = {
  customerId: string;
  futureRecommendation: string | null;
  notes: string | null;
  onSave: SaveCustomerNotesAction;
};

/**
 * Renders the minimal CRM notes form for a customer.
 *
 * @param props - Current notes, recommendation, and server action callback.
 * @returns A customer notes form with a short success message.
 */
export function CustomerNotesForm({
  customerId,
  futureRecommendation,
  notes,
  onSave
}: CustomerNotesFormProps): JSX.Element {
  const [notesValue, setNotesValue] = useState(notes ?? "");
  const [recommendationValue, setRecommendationValue] = useState(
    futureRecommendation ?? ""
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(() => setMessage(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.set("notes", notesValue);
    formData.set("future_recommendation", recommendationValue);

    startTransition(() => {
      void onSave(customerId, formData)
        .then(() => {
          setMessage("Αποθηκεύτηκε");
        })
        .catch((caughtError: unknown) => {
          console.error("Customer notes save failed", {
            customerId,
            error: caughtError
          });
          setError("Δεν αποθηκεύτηκε. Δοκίμασε ξανά.");
        });
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Σημειώσεις</h2>
        <div className="mt-4 flex flex-col gap-2">
          <Label htmlFor="customer-notes">Σημειώσεις για τον πελάτη</Label>
          <Textarea
            id="customer-notes"
            maxLength={2000}
            onChange={(event) => setNotesValue(event.target.value)}
            rows={4}
            value={notesValue}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          Επόμενη πρόταση
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          <Label htmlFor="future-recommendation">Επόμενη πρόταση</Label>
          <Input
            id="future-recommendation"
            maxLength={500}
            onChange={(event) => setRecommendationValue(event.target.value)}
            placeholder="π.χ. Καθαρισμός σε 6 μήνες"
            value={recommendationValue}
          />
        </div>
      </section>

      {message ? (
        <p
          aria-live="polite"
          className="rounded-md border border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-slate-800"
        >
          {message}
        </p>
      ) : null}

      {error ? (
        <p
          aria-live="polite"
          className="rounded-md border border-red-500 bg-white px-3 py-2 text-sm text-slate-800"
        >
          {error}
        </p>
      ) : null}

      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Αποθήκευση..." : "Αποθήκευση"}
      </Button>
    </form>
  );
}
