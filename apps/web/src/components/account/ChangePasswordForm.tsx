"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SubmitState = "idle" | "saving" | "success" | "error";

type ErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

export function ChangePasswordForm(): JSX.Element {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string>("");

  async function submitPasswordChange(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("current_password") ?? "");
    const newPassword = String(formData.get("new_password") ?? "");
    const confirmPassword = String(formData.get("confirm_new_password") ?? "");

    if (newPassword.length < 10) {
      setState("error");
      setMessage("Ο νέος κωδικός πρέπει να έχει τουλάχιστον 10 χαρακτήρες.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setState("error");
      setMessage("Οι νέοι κωδικοί δεν ταιριάζουν.");
      return;
    }

    setState("saving");
    setMessage("");

    try {
      const response = await fetch("/api/v1/me/change-password", {
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | ErrorResponse
          | null;

        if (body?.error?.code === "INVALID_CREDENTIALS") {
          throw new Error("Ο τρέχων κωδικός δεν είναι σωστός.");
        }

        throw new Error(
          body?.error?.message ?? "Δεν μπορέσαμε να αλλάξουμε τον κωδικό."
        );
      }

      form.reset();
      setState("success");
      setMessage("Ο κωδικός άλλαξε.");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Δεν μπορέσαμε να αλλάξουμε τον κωδικό."
      );
    }
  }

  const isSaving = state === "saving";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold text-slate-950">
          Αλλαγή κωδικού
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          Χρησιμοποίησε νέο κωδικό με τουλάχιστον 10 χαρακτήρες.
        </p>
      </div>

      <form className="space-y-4" onSubmit={submitPasswordChange}>
        <div className="space-y-2">
          <Label htmlFor="current_password">Τρέχων κωδικός</Label>
          <Input
            autoComplete="current-password"
            id="current_password"
            minLength={1}
            name="current_password"
            required
            type="password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new_password">Νέος κωδικός</Label>
          <Input
            autoComplete="new-password"
            id="new_password"
            maxLength={128}
            minLength={10}
            name="new_password"
            required
            type="password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_new_password">Επιβεβαίωση νέου κωδικού</Label>
          <Input
            autoComplete="new-password"
            id="confirm_new_password"
            maxLength={128}
            minLength={10}
            name="confirm_new_password"
            required
            type="password"
          />
        </div>

        {message ? (
          <p
            aria-live="polite"
            className={
              state === "success"
                ? "text-sm font-medium text-green-700"
                : "text-sm font-medium text-red-600"
            }
          >
            {message}
          </p>
        ) : null}

        <Button className="w-full" disabled={isSaving} type="submit">
          {isSaving ? "Αποθήκευση..." : "Αλλαγή κωδικού"}
        </Button>
      </form>
    </section>
  );
}
