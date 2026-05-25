"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldName =
  | "owner_email"
  | "owner_password"
  | "business_name"
  | "slug";

type FieldErrors = Partial<Record<FieldName, string>>;

type ApiErrorResponse = {
  error: {
    code: string;
    details?: unknown;
    message?: string;
  };
};

const emptyFieldErrors: FieldErrors = {};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFieldName(value: string): value is FieldName {
  return (
    value === "owner_email" ||
    value === "owner_password" ||
    value === "business_name" ||
    value === "slug"
  );
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    isRecord(value) &&
    isRecord(value.error) &&
    typeof value.error.code === "string"
  );
}

function fieldErrorsFromDetails(details: unknown): FieldErrors {
  if (!Array.isArray(details)) {
    return emptyFieldErrors;
  }

  const nextErrors: FieldErrors = {};

  for (const detail of details) {
    if (!isRecord(detail) || !Array.isArray(detail.path)) {
      continue;
    }

    const firstPath = detail.path[0];
    if (
      typeof firstPath === "string" &&
      isFieldName(firstPath) &&
      typeof detail.message === "string"
    ) {
      nextErrors[firstPath] = detail.message;
    }
  }

  return nextErrors;
}

async function parseErrorResponse(
  response: Response
): Promise<ApiErrorResponse | null> {
  try {
    const value: unknown = await response.json();
    return isApiErrorResponse(value) ? value : null;
  } catch (error) {
    console.error("Failed to parse business registration error response", error);
    return null;
  }
}

function FieldError({ message }: { message?: string }): JSX.Element | null {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-500">{message}</p>;
}

export default function RegisterPage(): JSX.Element {
  const router = useRouter();
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyFieldErrors);
  const [formError, setFormError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const baseDomain = process.env.NEXT_PUBLIC_BOOKING_BASE_DOMAIN ?? "";

  const finalUrl = useMemo(() => {
    const cleanSlug = slug.trim().toLowerCase();
    return cleanSlug ? `${baseDomain}/${cleanSlug}` : `${baseDomain}/your-slug`;
  }, [baseDomain, slug]);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFieldErrors(emptyFieldErrors);
    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      owner_email: ownerEmail.trim(),
      owner_password: ownerPassword,
      business_name: businessName.trim(),
      slug: slug.trim().toLowerCase()
    };

    try {
      const response = await fetch("/api/v1/businesses", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 201) {
        router.push("/dashboard/today");
        router.refresh();
        return;
      }

      const errorResponse = await parseErrorResponse(response);

      if (errorResponse?.error.code === "SLUG_TAKEN") {
        setFieldErrors({ slug: "Αυτό το slug χρησιμοποιείται ήδη." });
        return;
      }

      if (errorResponse?.error.code === "EMAIL_TAKEN") {
        setFieldErrors({
          owner_email: "Υπάρχει ήδη λογαριασμός με αυτό το email."
        });
        return;
      }

      if (errorResponse?.error.details) {
        const nextFieldErrors = fieldErrorsFromDetails(
          errorResponse.error.details
        );
        if (Object.keys(nextFieldErrors).length > 0) {
          setFieldErrors(nextFieldErrors);
          return;
        }
      }

      setFormError(
        errorResponse?.error.message ??
          "Η εγγραφή απέτυχε. Δοκίμασε ξανά."
      );
    } catch (error) {
      console.error("Business registration request failed", error);
      setFormError("Η σύνδεση απέτυχε. Δοκίμασε ξανά.");
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
          <h1 className="text-3xl font-bold text-slate-900">
            Εγγραφή επιχείρησης
          </h1>
          <p className="text-base leading-7 text-slate-600">
            Ένας λογαριασμός ιδιοκτήτη και ένα δημόσιο προφίλ επιχείρησης.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="owner_email">Email</Label>
          <Input
            aria-invalid={Boolean(fieldErrors.owner_email)}
            autoComplete="email"
            id="owner_email"
            name="owner_email"
            onChange={(event) => setOwnerEmail(event.target.value)}
            required
            type="email"
            value={ownerEmail}
          />
          <FieldError message={fieldErrors.owner_email} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="owner_password">Κωδικός</Label>
          <Input
            aria-invalid={Boolean(fieldErrors.owner_password)}
            autoComplete="new-password"
            id="owner_password"
            minLength={8}
            name="owner_password"
            onChange={(event) => setOwnerPassword(event.target.value)}
            required
            type="password"
            value={ownerPassword}
          />
          <FieldError message={fieldErrors.owner_password} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="business_name">Όνομα επιχείρησης</Label>
          <Input
            aria-invalid={Boolean(fieldErrors.business_name)}
            id="business_name"
            minLength={2}
            name="business_name"
            onChange={(event) => setBusinessName(event.target.value)}
            required
            type="text"
            value={businessName}
          />
          <FieldError message={fieldErrors.business_name} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            aria-invalid={Boolean(fieldErrors.slug)}
            id="slug"
            maxLength={40}
            name="slug"
            onChange={(event) => setSlug(event.target.value)}
            pattern="[a-z0-9]([a-z0-9]*(-[a-z0-9]+)*)?"
            required
            type="text"
            value={slug}
          />
          <p className="text-sm leading-5 text-slate-500">
            Τελικός σύνδεσμος: {finalUrl}
          </p>
          <FieldError message={fieldErrors.slug} />
        </div>

        {formError ? (
          <p className="rounded-md border border-red-500 bg-red-50 px-3 py-2 text-sm text-slate-800">
            {formError}
          </p>
        ) : null}

        <Button
          className="w-full"
          disabled={!isHydrated || isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Παρακαλώ περιμένετε" : "Δημιουργία"}
        </Button>
      </form>
    </main>
  );
}
