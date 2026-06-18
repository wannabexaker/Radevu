"use client";

import { createAuthClient } from "better-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const authClient = createAuthClient();

type MeResponse = {
  user?: {
    user_type?: "business_owner" | "customer";
  };
};

async function nextPathAfterLogin(): Promise<string> {
  try {
    const response = await fetch("/api/v1/me", {
      credentials: "include"
    });
    const payload = (await response.json()) as MeResponse;

    return payload.user?.user_type === "business_owner"
      ? "/dashboard/today"
      : "/account";
  } catch {
    return "/dashboard/today";
  }
}

export function LoginForm(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password
      });

      if (result.error) {
        console.error("better-auth login returned an error", result.error);
        setError("Τα στοιχεία σύνδεσης δεν είναι σωστά.");
        return;
      }

      router.push(await nextPathAfterLogin());
      router.refresh();
    } catch (loginError) {
      console.error("Login request failed", loginError);
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
        <div className="flex items-center gap-4">
          <Image
            alt="Radevu"
            className="h-20 w-20 shrink-0 object-contain"
            height={80}
            priority
            src="/radevu.png"
            width={80}
          />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-slate-900">Σύνδεση</h1>
            <p className="text-base leading-7 text-slate-600">
              Μπες στον λογαριασμό σου.
            </p>
          </div>
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

        <div className="text-right">
          <Link className="text-sm font-medium text-indigo-700" href="/forgot-password">
            Ξέχασες τον κωδικό σου;
          </Link>
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
          {isSubmitting ? "Σύνδεση..." : "Σύνδεση"}
        </Button>

        <p className="text-center text-sm text-slate-600">
          Δεν έχεις λογαριασμό;{" "}
          <Link className="font-medium text-indigo-700" href="/register">
            Εγγραφή
          </Link>
        </p>
      </form>
    </main>
  );
}
