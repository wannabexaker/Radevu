"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Turnstile } from "@/components/auth/Turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserType = "business_owner" | "customer";

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

type RegisterResponse = {
  redirect_to?: string;
};

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function RegisterForm(): JSX.Element {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formStartedAt, setFormStartedAt] = useState(Date.now());
  const [honeypot, setHoneypot] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [slug, setSlug] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileVersion, setTurnstileVersion] = useState(0);
  const [userType, setUserType] = useState<UserType>("business_owner");
  const configuredBaseDomain =
    process.env.NEXT_PUBLIC_BOOKING_BASE_DOMAIN?.trim();
  const baseDomain =
    configuredBaseDomain && !configuredBaseDomain.startsWith("localhost")
      ? configuredBaseDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "")
      : "radevu.olamov.com";

  useEffect(() => {
    setFormStartedAt(Date.now());
    setIsHydrated(true);
  }, []);

  const finalUrl = useMemo(() => {
    const cleanSlug = normalizeSlug(slug);
    return cleanSlug ? `${baseDomain}/${cleanSlug}` : `${baseDomain}/your-slug`;
  }, [baseDomain, slug]);

  function resetTurnstile(): void {
    setTurnstileToken("");
    setTurnstileVersion((current) => current + 1);
  }

  function selectUserType(nextUserType: UserType): void {
    if (nextUserType === userType) {
      return;
    }

    setError(null);
    setUserType(nextUserType);
    resetTurnstile();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const commonPayload = {
      email: email.trim().toLowerCase(),
      form_started_at: formStartedAt,
      honeypot,
      marketing_opt_in: marketingOptIn,
      name: name.trim(),
      password,
      phone: phone.trim() || undefined,
      turnstile_token: turnstileToken,
      user_type: userType
    };
    const payload =
      userType === "business_owner"
        ? {
            ...commonPayload,
            business_name: businessName.trim(),
            slug: normalizeSlug(slug)
          }
        : commonPayload;

    try {
      const response = await fetch("/api/v1/auth/register", {
        body: JSON.stringify(payload),
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        const errorPayload = await parseJson<ApiErrorResponse>(response);
        setError(
          errorPayload?.error?.message ??
            "Η εγγραφή απέτυχε. Έλεγξε τα στοιχεία και δοκίμασε ξανά."
        );
        resetTurnstile();
        return;
      }

      const result = await parseJson<RegisterResponse>(response);
      router.push(result?.redirect_to ?? "/account");
      router.refresh();
    } catch (caughtError) {
      console.error("Registration request failed", caughtError);
      setError("Η σύνδεση απέτυχε. Δοκίμασε ξανά.");
      resetTurnstile();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <form
        className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center gap-4">
          <Link
            aria-label="Πήγαινε στην αρχική σελίδα Radevu"
            className="inline-flex h-20 w-20 shrink-0"
            href="https://radevu.olamov.com"
          >
            <Image
              alt="Radevu"
              className="h-20 w-20 object-contain"
              height={80}
              priority
              src="/radevu.png"
              width={80}
            />
          </Link>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-slate-900">Εγγραφή</h1>
            <p className="text-base leading-7 text-slate-600">
              Δημιούργησε λογαριασμό χρήστη ή επαγγελματικό προφίλ.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            className={`min-h-11 rounded-lg text-sm font-medium ${
              userType === "business_owner"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-600"
            }`}
            onClick={() => selectUserType("business_owner")}
            type="button"
          >
            Επιχείρηση
          </button>
          <button
            className={`min-h-11 rounded-lg text-sm font-medium ${
              userType === "customer"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-600"
            }`}
            onClick={() => selectUserType("customer")}
            type="button"
          >
            Χρήστης
          </button>
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
          <Label htmlFor="name">Ονοματεπώνυμο</Label>
          <Input
            autoComplete="name"
            id="name"
            minLength={2}
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            autoComplete="email"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Κωδικός</Label>
          <Input
            autoComplete="new-password"
            id="password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Τηλέφωνο</Label>
          <Input
            autoComplete="tel"
            id="phone"
            inputMode="tel"
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            value={phone}
          />
        </div>

        {userType === "business_owner" ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="business_name">Όνομα επιχείρησης</Label>
              <Input
                id="business_name"
                minLength={2}
                onChange={(event) => setBusinessName(event.target.value)}
                required
                value={businessName}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="slug">Σύνδεσμος Radevu</Label>
              <Input
                id="slug"
                maxLength={40}
                onChange={(event) => setSlug(event.target.value)}
                pattern="[a-z0-9]([a-z0-9]*(-[a-z0-9]+)*)?"
                required
                value={slug}
              />
              <p className="text-sm leading-5 text-slate-500">
                Τελικός σύνδεσμος: {finalUrl}
              </p>
            </div>
          </>
        ) : null}

        <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
          <input
            checked={marketingOptIn}
            className="mt-1 h-4 w-4"
            onChange={(event) => setMarketingOptIn(event.target.checked)}
            type="checkbox"
          />
          Να λαμβάνω ενημερώσεις για το Radevu.
        </label>

        <Turnstile
          key={turnstileVersion}
          onTokenChange={setTurnstileToken}
        />

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
          {isSubmitting ? "Δημιουργία..." : "Δημιουργία λογαριασμού"}
        </Button>

        <p className="text-center text-sm text-slate-600">
          Έχεις ήδη λογαριασμό;{" "}
          <Link className="font-medium text-indigo-700" href="/login">
            Σύνδεση
          </Link>
        </p>
      </form>
    </main>
  );
}
