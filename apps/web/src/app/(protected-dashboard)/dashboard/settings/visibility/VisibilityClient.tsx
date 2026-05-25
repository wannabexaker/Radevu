"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

type VisibilityClientProps = {
  businessId: string;
  initialShowOnLanding: boolean;
};

type VisibilityErrorResponse = {
  error: {
    message?: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();

    if (
      isRecord(payload) &&
      isRecord(payload.error) &&
      typeof payload.error.message === "string"
    ) {
      return (payload as VisibilityErrorResponse).error.message ?? "";
    }
  } catch (error) {
    console.error("Failed to parse visibility API error response", {
      status: response.status,
      error
    });
  }

  return "Η αποθήκευση απέτυχε.";
}

/**
 * Renders and persists the landing showcase visibility switch.
 *
 * @param props - Business id and initial visibility state.
 * @returns The interactive visibility settings panel.
 */
export function VisibilityClient({
  businessId,
  initialShowOnLanding
}: VisibilityClientProps): JSX.Element {
  const router = useRouter();
  const [showOnLanding, setShowOnLanding] = useState(initialShowOnLanding);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateVisibility(nextValue: boolean): Promise<void> {
    const previousValue = showOnLanding;
    setShowOnLanding(nextValue);
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/businesses/${businessId}/visibility`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            show_on_landing: nextValue
          })
        }
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      router.refresh();
    } catch (updateError) {
      console.error("Failed to update landing visibility from dashboard", {
        businessId,
        error: updateError
      });
      setShowOnLanding(previousValue);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Η αποθήκευση απέτυχε."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold leading-tight text-slate-900">
          Εμφάνιση στο landing
        </h1>
        <p className="text-base leading-relaxed text-slate-500">
          Διάλεξε αν η επιχείρησή σου θα εμφανίζεται στη βιτρίνα του Radevu.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">
              Προβολή επιχείρησης
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              Όταν είναι ενεργό, το όνομα και το λογότυπό σου εμφανίζονται στο
              landing.
            </p>
          </div>
          <Switch
            aria-label="Εμφάνιση στο landing"
            checked={showOnLanding}
            disabled={isSubmitting}
            onCheckedChange={updateVisibility}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </section>
  );
}
