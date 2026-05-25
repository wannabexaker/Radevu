"use client";

import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const authClient = createAuthClient();

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password
      });

      if (result.error) {
        console.error("better-auth login returned an error", result.error);
        setError("Τα στοιχεία σύνδεσης δεν είναι σωστά.");
        return;
      }

      router.push("/dashboard/today");
      router.refresh();
    } catch (loginError) {
      console.error("Login request failed", loginError);
      setError("Η σύνδεση απέτυχε. Δοκίμασε ξανά.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center px-4 py-8">
      <form
        className="mx-auto flex w-full max-w-md flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase text-indigo-500">
            Radevu
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Σύνδεση</h1>
          <p className="text-base leading-7 text-slate-600">
            Άνοιξε το dashboard της επιχείρησής σου.
          </p>
        </div>

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

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Κωδικός</Label>
          <Input
            autoComplete="current-password"
            id="password"
            minLength={8}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        {error ? (
          <p className="rounded-md border border-red-500 bg-red-50 px-3 py-2 text-sm text-slate-800">
            {error}
          </p>
        ) : null}

        <Button
          className="w-full"
          disabled={!isHydrated || isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Παρακαλώ περιμένετε" : "Σύνδεση"}
        </Button>
      </form>
    </main>
  );
}
