"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { Turnstile } from "@/components/auth/Turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function ForgotPasswordForm(): JSX.Element {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formStartedAt, setFormStartedAt] = useState(Date.now());
  const [honeypot, setHoneypot] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    setFormStartedAt(Date.now());
    setIsHydrated(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/auth/password/forgot", {
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          form_started_at: formStartedAt,
          honeypot,
          turnstile_token: turnstileToken
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        const body = await parseJson<ApiErrorResponse>(response);
        setError(
          body?.error?.message ??
            "Δεν μπορέσαμε να επεξεργαστούμε το αίτημα."
        );
        return;
      }

      setSuccess(true);
    } catch (caughtError) {
      console.error("Forgot password request failed", caughtError);
      setError("Η σύνδεση απέτυχε. Δοκίμασε ξανά.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-8">
      <form
        className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase text-indigo-500">
            Radevu
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            Ξέχασες τον κωδικό;
          </h1>
          <p className="text-base leading-7 text-slate-600">
            Γράψε το Email σου και θα στείλουμε σύνδεσμο αλλαγής κωδικού.
          </p>
        </div>

        <input
          autoComplete="off"
          className="hidden"
          name="company_website"
          onChange={(event) => setHoneypot(event.target.value)}
          tabIndex={-1}
          value={honeypot}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            autoComplete="email"
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>

        <Turnstile onTokenChange={setTurnstileToken} />

        {success ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
            Αν υπάρχει λογαριασμός, στείλαμε Email.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-red-500 bg-red-50 px-3 py-2 text-sm text-slate-800">
            {error}
          </p>
        ) : null}

        <Button
          className="w-full"
          disabled={!isHydrated || isSubmitting || !turnstileToken}
          type="submit"
        >
          {isSubmitting ? "Αποστολή..." : "Στείλε σύνδεσμο"}
        </Button>

        <p className="text-center text-sm text-slate-600">
          Θυμήθηκες τον κωδικό;{" "}
          <Link className="font-medium text-indigo-700" href="/login">
            Σύνδεση
          </Link>
        </p>
      </form>
    </main>
  );
}
