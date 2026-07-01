"use client";

import { BUSINESS_CATEGORIES } from "@radevu/shared";
import Link from "next/link";
import { type FormEvent, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateBusinessResult } from "./actions";

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

type CreateBusinessFormProps = {
  action: (formData: FormData) => Promise<CreateBusinessResult>;
};

export function CreateBusinessForm({
  action
}: CreateBusinessFormProps): JSX.Element {
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const cleanSlug = useMemo(() => normalizeSlug(slug), [slug]);
  const baseDomain =
    process.env.NEXT_PUBLIC_BOOKING_BASE_DOMAIN?.replace(/^https?:\/\//, "") ??
    "radevu.olamov.com";

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("slug", cleanSlug);
    setError(null);

    startTransition(async () => {
      const result = await action(formData);

      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-slate-950">
          Δημιούργησε την επιχείρησή σου
        </h1>
        <p className="text-sm leading-relaxed text-slate-600">
          Φτιάξε το προφίλ σου και δέξου online ραντεβού. Κρατάς και τον
          λογαριασμό πελάτη σου.
        </p>
      </div>

      <form
        className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="business_name">Όνομα επιχείρησης</Label>
          <Input
            id="business_name"
            minLength={2}
            name="business_name"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="slug">Σύνδεσμος Radevu</Label>
          <Input
            id="slug"
            maxLength={40}
            name="slug"
            onChange={(event) => setSlug(event.target.value)}
            required
            value={slug}
          />
          <p className="text-sm leading-5 text-slate-500">
            Τελικός σύνδεσμος: {baseDomain}/{cleanSlug || "to-slug-sou"}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Κατηγορία</Label>
          <select
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            defaultValue=""
            id="category"
            name="category"
            required
          >
            <option disabled value="">
              Διάλεξε κατηγορία
            </option>
            {BUSINESS_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className="rounded-md border border-red-500 bg-red-50 px-3 py-2 text-sm text-slate-800">
            {error}
          </p>
        ) : null}

        <Button className="w-full" disabled={isPending} type="submit">
          {isPending ? "Δημιουργία..." : "Δημιουργία επιχείρησης"}
        </Button>

        <Link
          className="text-center text-sm font-medium text-slate-600"
          href="/account"
        >
          Ακύρωση
        </Link>
      </form>
    </div>
  );
}
