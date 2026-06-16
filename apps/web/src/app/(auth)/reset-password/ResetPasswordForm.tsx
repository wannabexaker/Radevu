"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

type ResetPasswordFormProps = {
  token: string;
};

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function ResetPasswordForm({
  token
}: ResetPasswordFormProps): JSX.Element {
  const router = useRouter();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!token) {
      setError("Ο σύνδεσμος αλλαγής κωδικού δεν είναι έγκυρος.");
      return;
    }

    if (newPassword.length < 10) {
      setError("Ο νέος κωδικός πρέπει να έχει τουλάχιστον 10 χαρακτήρες.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Οι νέοι κωδικοί δεν ταιριάζουν.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/auth/password/reset", {
        body: JSON.stringify({
          new_password: newPassword,
          token
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        const body = await parseJson<ApiErrorResponse>(response);
        setError(
          body?.error?.message ?? "Δεν μπορέσαμε να αλλάξουμε τον κωδικό."
        );
        return;
      }

      setSuccess(true);
      window.setTimeout(() => {
        router.push("/login");
      }, 700);
    } catch (caughtError) {
      console.error("Reset password request failed", caughtError);
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
            Νέος κωδικός
          </h1>
          <p className="text-base leading-7 text-slate-600">
            Διάλεξε νέο κωδικό με τουλάχιστον 10 χαρακτήρες.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="new_password">Νέος κωδικός</Label>
          <Input
            autoComplete="new-password"
            disabled={!token}
            id="new_password"
            maxLength={128}
            minLength={10}
            name="new_password"
            onChange={(event) => setNewPassword(event.target.value)}
            required
            type="password"
            value={newPassword}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm_password">Επιβεβαίωση νέου κωδικού</Label>
          <Input
            autoComplete="new-password"
            disabled={!token}
            id="confirm_password"
            maxLength={128}
            minLength={10}
            name="confirm_password"
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </div>

        {success ? (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
            Ο κωδικός άλλαξε. Σε πάμε στη σύνδεση.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-red-500 bg-red-50 px-3 py-2 text-sm text-slate-800">
            {error}
          </p>
        ) : null}

        <Button className="w-full" disabled={isSubmitting || !token} type="submit">
          {isSubmitting ? "Αποθήκευση..." : "Αλλαγή κωδικού"}
        </Button>

        <p className="text-center text-sm text-slate-600">
          <Link className="font-medium text-indigo-700" href="/login">
            Επιστροφή στη σύνδεση
          </Link>
        </p>
      </form>
    </main>
  );
}
