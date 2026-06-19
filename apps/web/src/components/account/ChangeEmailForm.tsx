"use client";

import { createAuthClient } from "better-auth/react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const authClient = createAuthClient();

type ChangeEmailFormProps = {
  currentEmail: string;
  emailVerified: boolean;
};

type SubmitState = "idle" | "saving" | "success" | "error";

async function signOutAndRedirect(path: string): Promise<void> {
  const result = await authClient.signOut();

  if (result.error) {
    throw new Error("Η αποσύνδεση απέτυχε. Δοκίμασε ξανά.");
  }

  window.location.replace(path);
}

export function ChangeEmailForm({
  currentEmail,
  emailVerified
}: ChangeEmailFormProps): JSX.Element {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submitEmailChange(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const newEmail = String(formData.get("new_email") ?? "")
      .trim()
      .toLowerCase();

    if (newEmail === currentEmail.toLowerCase()) {
      setState("error");
      setMessage("Το νέο email είναι ίδιο με το τρέχον email σύνδεσης.");
      return;
    }

    setState("saving");
    setMessage("");

    try {
      const result = await authClient.changeEmail({
        callbackURL: `${window.location.origin}/change-email/complete`,
        newEmail
      });

      if (result.error) {
        throw new Error(
          result.error.message ?? "Δεν μπορέσαμε να αλλάξουμε το email σύνδεσης."
        );
      }

      if (result.data?.user) {
        const verificationResponse = await fetch(
          "/api/v1/me/verification/resend",
          { method: "POST" }
        );
        await signOutAndRedirect(
          verificationResponse.ok
            ? "/login?email_changed=1&verification_sent=1"
            : "/login?email_changed=1&verification_error=1"
        );
        return;
      }

      form.reset();
      setState("success");
      setMessage(
        `Στείλαμε σύνδεσμο επιβεβαίωσης στο ${currentEmail}. Άνοιξέ τον στον ίδιο browser για να ολοκληρωθεί η αλλαγή.`
      );
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Δεν μπορέσαμε να αλλάξουμε το email σύνδεσης."
      );
    }
  }

  const isSaving = state === "saving";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold text-slate-950">
          Αλλαγή email σύνδεσης
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          Τρέχον email: <span className="font-medium">{currentEmail}</span>
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-sm leading-6 text-amber-950">
        {emailVerified
          ? "Θα στείλουμε σύνδεσμο επιβεβαίωσης στο τρέχον email. Μετά την επιβεβαίωση θα αποσυνδεθείς και θα συνδεθείς ξανά με το νέο email."
          : "Το email θα αλλάξει άμεσα και θα στείλουμε επιβεβαίωση στο νέο email. Έπειτα θα αποσυνδεθείς."}
      </div>

      <form className="space-y-4" onSubmit={submitEmailChange}>
        <div className="space-y-2">
          <Label htmlFor="new_email">Νέο email σύνδεσης</Label>
          <Input
            autoComplete="email"
            id="new_email"
            name="new_email"
            required
            type="email"
          />
        </div>

        {message ? (
          <p
            aria-live="polite"
            className={
              state === "success"
                ? "text-sm font-medium leading-6 text-green-700"
                : "text-sm font-medium leading-6 text-red-600"
            }
          >
            {message}
          </p>
        ) : null}

        <Button className="w-full" disabled={isSaving} type="submit">
          {isSaving ? "Αποστολή..." : "Αλλαγή email σύνδεσης"}
        </Button>
      </form>
    </section>
  );
}
