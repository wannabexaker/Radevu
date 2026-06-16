const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileFetch = typeof fetch;

export type TurnstileVerifyInput = {
  remoteIp?: string;
  secretKey?: string;
  token: string | null | undefined;
  fetchImpl?: TurnstileFetch;
};

export type TurnstileVerifyResult =
  | {
      ok: true;
      action?: string;
      challengeTs?: string;
      cdata?: string;
      hostname?: string;
    }
  | {
      ok: false;
      code:
        | "MISSING_SECRET"
        | "MISSING_TOKEN"
        | "NETWORK_ERROR"
        | "VERIFY_FAILED";
      errors: string[];
    };

type TurnstileApiResponse = {
  success?: boolean;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
  challenge_ts?: string;
  hostname?: string;
};

function configuredSecretKey(secretKey?: string): string | null {
  const value = secretKey ?? process.env.TURNSTILE_SECRET_KEY;
  const trimmed = value?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function normalizedToken(token: string | null | undefined): string | null {
  const trimmed = token?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : null;
}

/**
 * Verifies one Cloudflare Turnstile token using the server-side secret key.
 *
 * @param input - Token, optional remote IP, and test-injectable fetch/secret.
 * @returns A typed success or failure result.
 */
export async function verifyTurnstileToken(
  input: TurnstileVerifyInput
): Promise<TurnstileVerifyResult> {
  const token = normalizedToken(input.token);

  if (!token) {
    return {
      ok: false,
      code: "MISSING_TOKEN",
      errors: ["missing-input-response"]
    };
  }

  const secretKey = configuredSecretKey(input.secretKey);

  if (!secretKey) {
    return {
      ok: false,
      code: "MISSING_SECRET",
      errors: ["missing-input-secret"]
    };
  }

  const body = new URLSearchParams({
    response: token,
    secret: secretKey
  });

  if (input.remoteIp) {
    body.set("remoteip", input.remoteIp);
  }

  try {
    const response = await (input.fetchImpl ?? fetch)(TURNSTILE_VERIFY_URL, {
      body,
      method: "POST"
    });
    const payload = (await response.json()) as TurnstileApiResponse;

    if (!response.ok || payload.success !== true) {
      return {
        ok: false,
        code: "VERIFY_FAILED",
        errors: payload["error-codes"] ?? [`http-${response.status}`]
      };
    }

    return {
      ok: true,
      action: payload.action,
      cdata: payload.cdata,
      challengeTs: payload.challenge_ts,
      hostname: payload.hostname
    };
  } catch (error) {
    return {
      ok: false,
      code: "NETWORK_ERROR",
      errors: [error instanceof Error ? error.message : "unknown-error"]
    };
  }
}
