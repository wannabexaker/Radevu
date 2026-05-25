"use client";

import {
  createServiceSchema,
  updateServiceSchema,
  type CreateServiceInput,
  type UpdateServiceInput
} from "@radevu/shared";
import { type FormEvent, useState } from "react";

type ServiceFormInitialValue = {
  description: string | null;
  duration_minutes: number;
  name: string;
  price_cents: number;
};

type ServiceFormProps =
  | {
      initialValue?: undefined;
      isSubmitting?: boolean;
      mode: "create";
      onSubmit: (value: CreateServiceInput) => Promise<void>;
      submitLabel: string;
    }
  | {
      initialValue: ServiceFormInitialValue;
      isSubmitting?: boolean;
      mode: "edit";
      onSubmit: (value: UpdateServiceInput) => Promise<void>;
      submitLabel: string;
    };

type FieldName = "name" | "duration_minutes" | "price_cents" | "description";
type FieldErrors = Partial<Record<FieldName, string>>;

function priceToInput(priceCents: number | undefined): string {
  if (priceCents === undefined) {
    return "";
  }

  return String(priceCents / 100).replace(".", ",");
}

function parsePriceCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

function firstFieldErrors(
  issues: Array<{
    path: Array<string | number>;
    message: string;
  }>
): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of issues) {
    const firstPath = issue.path[0];
    if (
      typeof firstPath === "string" &&
      (firstPath === "name" ||
        firstPath === "duration_minutes" ||
        firstPath === "price_cents" ||
        firstPath === "description")
    ) {
      errors[firstPath] = issue.message;
    }
  }

  return errors;
}

function fieldErrorText(field: FieldName, message: string | undefined): string | undefined {
  if (!message) {
    return undefined;
  }

  if (field === "name") {
    return "Το όνομα πρέπει να έχει 2-80 χαρακτήρες.";
  }

  if (field === "duration_minutes") {
    return "Η διάρκεια πρέπει να είναι 5-720 λεπτά.";
  }

  if (field === "price_cents") {
    return "Η τιμή πρέπει να είναι από €0 έως €10.000.";
  }

  return "Η περιγραφή πρέπει να είναι έως 500 χαρακτήρες.";
}

/**
 * Renders the create/edit service form and validates values before submit.
 *
 * @param props - Form mode, initial values, submit label, and submit handler.
 * @returns A controlled service form.
 */
export function ServiceForm(props: ServiceFormProps): JSX.Element {
  const { initialValue, mode, submitLabel } = props;
  const isSubmitting = props.isSubmitting ?? false;
  const [name, setName] = useState(initialValue?.name ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    initialValue?.duration_minutes ? String(initialValue.duration_minutes) : ""
  );
  const [priceEuros, setPriceEuros] = useState(
    priceToInput(initialValue?.price_cents)
  );
  const [description, setDescription] = useState(
    initialValue?.description ?? ""
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const parsedDuration = Number(durationMinutes);
    const parsedPriceCents = parsePriceCents(priceEuros);

    if (!Number.isInteger(parsedDuration)) {
      setFieldErrors({
        duration_minutes: "Η διάρκεια πρέπει να είναι ακέραιος αριθμός."
      });
      return;
    }

    if (parsedPriceCents === null) {
      setFieldErrors({
        price_cents: "Η τιμή πρέπει να είναι αριθμός."
      });
      return;
    }

    const value = {
      name: name.trim(),
      duration_minutes: parsedDuration,
      price_cents: parsedPriceCents,
      description: description.trim()
    };

    try {
      if (mode === "create") {
        const parsed = createServiceSchema.safeParse(value);

        if (!parsed.success) {
          setFieldErrors(firstFieldErrors(parsed.error.issues));
          return;
        }

        await props.onSubmit(parsed.data);
      } else {
        const parsed = updateServiceSchema.safeParse(value);

        if (!parsed.success) {
          setFieldErrors(firstFieldErrors(parsed.error.issues));
          return;
        }

        await props.onSubmit(parsed.data);
      }
    } catch (error) {
      console.error("Service form submit failed", {
        mode,
        error
      });
      setFormError("Η αποθήκευση απέτυχε. Δοκίμασε ξανά.");
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-800" htmlFor="name">
          Όνομα
        </label>
        <input
          className="w-full min-h-[44px] rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
          id="name"
          name="name"
          onChange={(event) => setName(event.target.value)}
          required
          type="text"
          value={name}
        />
        {fieldErrors.name ? (
          <p className="text-sm text-red-500">
            {fieldErrorText("name", fieldErrors.name)}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="duration_minutes"
          >
            Διάρκεια σε λεπτά
          </label>
          <input
            className="w-full min-h-[44px] rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
            id="duration_minutes"
            inputMode="numeric"
            min={5}
            name="duration_minutes"
            onChange={(event) => setDurationMinutes(event.target.value)}
            required
            type="number"
            value={durationMinutes}
          />
          {fieldErrors.duration_minutes ? (
            <p className="text-sm text-red-500">
              {fieldErrorText(
                "duration_minutes",
                fieldErrors.duration_minutes
              )}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="price_euros"
          >
            Τιμή
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-500">
              €
            </span>
            <input
              className="w-full min-h-[44px] rounded-md border border-slate-200 bg-white px-3 py-2 pl-8 text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
              id="price_euros"
              inputMode="decimal"
              name="price_euros"
              onChange={(event) => setPriceEuros(event.target.value)}
              placeholder="15"
              required
              type="text"
              value={priceEuros}
            />
          </div>
          {fieldErrors.price_cents ? (
            <p className="text-sm text-red-500">
              {fieldErrorText("price_cents", fieldErrors.price_cents)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-slate-800"
          htmlFor="description"
        >
          Περιγραφή
        </label>
        <textarea
          className="w-full min-h-[96px] rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
          id="description"
          maxLength={500}
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          value={description}
        />
        {fieldErrors.description ? (
          <p className="text-sm text-red-500">
            {fieldErrorText("description", fieldErrors.description)}
          </p>
        ) : (
          <p className="text-sm text-slate-500">Προαιρετικό.</p>
        )}
      </div>

      {formError ? <p className="text-sm text-red-500">{formError}</p> : null}

      <button
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-600 active:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Αποθήκευση..." : submitLabel}
      </button>
    </form>
  );
}
