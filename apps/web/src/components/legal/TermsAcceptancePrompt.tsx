import Link from "next/link";
import { Button } from "@/components/ui/button";
import { acceptTermsAction } from "@/lib/legal/actions";

/**
 * Asks a signed-in user to accept the current legal documents.
 *
 * Shown to accounts created before terms acceptance was captured, and to
 * accounts that accepted an older version. Deliberately not dismissible: the
 * alternative would be having no record at all for these users.
 *
 * @returns The acceptance prompt.
 */
export function TermsAcceptancePrompt(): JSX.Element {
  return (
    <section className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <h2 className="text-base font-semibold text-amber-950">
        Ενημερώσαμε τους όρους
      </h2>
      <p className="mt-1 text-sm leading-6 text-amber-900">
        Δημοσιεύσαμε τους Όρους Χρήσης και την Πολιτική Απορρήτου του Radevu.
        Ρίξε μια ματιά και επιβεβαίωσε για να συνεχίσεις κανονικά.
      </p>
      <form action={acceptTermsAction}>
        <label className="mt-3 flex items-start gap-3 text-sm leading-6 text-amber-950">
          <input
            className="mt-1 h-4 w-4"
            name="accepted_terms"
            required
            type="checkbox"
          />
          <span>
            Έχω διαβάσει και αποδέχομαι τους{" "}
            <Link
              className="font-medium underline"
              href="/legal/terms"
              rel="noopener noreferrer"
              target="_blank"
            >
              Όρους Χρήσης
            </Link>{" "}
            και την{" "}
            <Link
              className="font-medium underline"
              href="/legal/privacy"
              rel="noopener noreferrer"
              target="_blank"
            >
              Πολιτική Απορρήτου
            </Link>
            .
          </span>
        </label>
        <Button className="mt-3 w-full sm:w-auto" type="submit">
          Αποδέχομαι
        </Button>
      </form>
    </section>
  );
}
