export const DEFAULT_HONEYPOT_MINIMUM_MS = 800;
export const DEFAULT_HONEYPOT_MAXIMUM_MS = 24 * 60 * 60_000;

export type HoneypotInput = {
  formStartedAt: number | string | null | undefined;
  now?: number;
  trapValue: string | null | undefined;
  maximumMs?: number;
  minimumMs?: number;
};

export type HoneypotValidationResult =
  | {
      ok: true;
      elapsedMs: number;
    }
  | {
      ok: false;
      code: "BOT_FIELD_FILLED" | "FORM_TOO_FAST" | "FORM_TOO_OLD" | "INVALID_START";
      elapsedMs?: number;
    };

function parseStartedAt(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Validates hidden honeypot form fields before expensive auth work.
 *
 * @param input - Hidden trap value and client-side form start timestamp.
 * @returns A typed spam check result.
 */
export function validateHoneypot(
  input: HoneypotInput
): HoneypotValidationResult {
  if ((input.trapValue ?? "").trim().length > 0) {
    return {
      ok: false,
      code: "BOT_FIELD_FILLED"
    };
  }

  const startedAt = parseStartedAt(input.formStartedAt);

  if (!startedAt) {
    return {
      ok: false,
      code: "INVALID_START"
    };
  }

  const now = input.now ?? Date.now();
  const elapsedMs = now - startedAt;
  const minimumMs = input.minimumMs ?? DEFAULT_HONEYPOT_MINIMUM_MS;
  const maximumMs = input.maximumMs ?? DEFAULT_HONEYPOT_MAXIMUM_MS;

  if (elapsedMs < minimumMs) {
    return {
      ok: false,
      code: "FORM_TOO_FAST",
      elapsedMs
    };
  }

  if (elapsedMs > maximumMs) {
    return {
      ok: false,
      code: "FORM_TOO_OLD",
      elapsedMs
    };
  }

  return {
    ok: true,
    elapsedMs
  };
}
