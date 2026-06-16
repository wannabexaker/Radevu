import assert from "node:assert/strict";
import test from "node:test";

type HoneypotModule = typeof import("../../src/lib/security/honeypot");
type ChangePasswordModule = typeof import("../../src/lib/security/change-password");
type MeVerificationResendModule = typeof import("../../src/lib/security/me-verification-resend");
type RateLimitModule = typeof import("../../src/lib/security/rate-limit");
type TurnstileModule = typeof import("../../src/lib/security/turnstile");

class FakeRateLimitRedis {
  private buckets = new Map<string, { count: number; expiresAt: number }>();
  public now = 1_000;

  async eval(
    _script: string,
    _numberOfKeys: number,
    ...args: Array<number | string>
  ): Promise<[number, number]> {
    const [keyRaw, windowMsRaw] = args;
    const key = String(keyRaw);
    const windowMs = Number(windowMsRaw);
    const existing = this.buckets.get(key);

    if (!existing || existing.expiresAt <= this.now) {
      const expiresAt = this.now + windowMs;
      this.buckets.set(key, {
        count: 1,
        expiresAt
      });
      return [1, windowMs];
    }

    existing.count += 1;
    return [existing.count, existing.expiresAt - this.now];
  }
}

async function loadHoneypot(): Promise<HoneypotModule> {
  const moduleUrl = new URL(
    "../../src/lib/security/honeypot.ts",
    import.meta.url
  ).href;

  return (await import(moduleUrl)) as HoneypotModule;
}

async function loadChangePassword(): Promise<ChangePasswordModule> {
  const moduleUrl = new URL(
    "../../src/lib/security/change-password.ts",
    import.meta.url
  ).href;

  return (await import(moduleUrl)) as ChangePasswordModule;
}

async function loadRateLimit(): Promise<RateLimitModule> {
  const moduleUrl = new URL(
    "../../src/lib/security/rate-limit.ts",
    import.meta.url
  ).href;

  return (await import(moduleUrl)) as RateLimitModule;
}

async function loadMeVerificationResend(): Promise<MeVerificationResendModule> {
  const moduleUrl = new URL(
    "../../src/lib/security/me-verification-resend.ts",
    import.meta.url
  ).href;

  return (await import(moduleUrl)) as MeVerificationResendModule;
}

async function loadTurnstile(): Promise<TurnstileModule> {
  const moduleUrl = new URL(
    "../../src/lib/security/turnstile.ts",
    import.meta.url
  ).href;

  return (await import(moduleUrl)) as TurnstileModule;
}

test("honeypot rejects filled trap, too-fast, and stale submissions", async () => {
  const { validateHoneypot } = await loadHoneypot();

  assert.deepEqual(
    validateHoneypot({
      formStartedAt: 1_000,
      now: 3_000,
      trapValue: "spam"
    }),
    {
      ok: false,
      code: "BOT_FIELD_FILLED"
    }
  );

  assert.deepEqual(
    validateHoneypot({
      formStartedAt: 1_000,
      minimumMs: 800,
      now: 1_200,
      trapValue: ""
    }),
    {
      ok: false,
      code: "FORM_TOO_FAST",
      elapsedMs: 200
    }
  );

  assert.deepEqual(
    validateHoneypot({
      formStartedAt: 1_000,
      maximumMs: 2_000,
      now: 4_000,
      trapValue: ""
    }),
    {
      ok: false,
      code: "FORM_TOO_OLD",
      elapsedMs: 3_000
    }
  );
});

test("honeypot accepts an empty trap after the minimum delay", async () => {
  const { validateHoneypot } = await loadHoneypot();

  assert.deepEqual(
    validateHoneypot({
      formStartedAt: "1000",
      minimumMs: 800,
      now: 2_000,
      trapValue: ""
    }),
    {
      ok: true,
      elapsedMs: 1_000
    }
  );
});

test("rate limiter allows up to the limit and blocks the next hit", async () => {
  const { checkRateLimit } = await loadRateLimit();
  const redis = new FakeRateLimitRedis();
  const base = {
    key: "register|user@example.com|127.0.0.1",
    limit: 2,
    prefix: "test:rate-limit",
    redis,
    windowMs: 60_000
  };

  const first = await checkRateLimit(base);
  const second = await checkRateLimit(base);
  const third = await checkRateLimit(base);

  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 1);
  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 0);
  assert.equal(third.allowed, false);
  assert.equal(third.remaining, 0);
  assert.equal(third.retryAfterMs, 60_000);
  assert.match(third.key, /^test:rate-limit:[a-f0-9]{64}$/);
});

test("rate limiter resets after the window", async () => {
  const { checkRateLimit } = await loadRateLimit();
  const redis = new FakeRateLimitRedis();
  const base = {
    key: "verify|user@example.com",
    limit: 1,
    prefix: "test:rate-limit",
    redis,
    windowMs: 1_000
  };

  assert.equal((await checkRateLimit(base)).allowed, true);
  assert.equal((await checkRateLimit(base)).allowed, false);
  redis.now += 1_001;
  assert.equal((await checkRateLimit(base)).allowed, true);
});

test("authenticated verification resend is limited to three attempts per user every fifteen minutes", async () => {
  const { checkRateLimit } = await loadRateLimit();
  const {
    ME_VERIFICATION_RESEND_LIMIT,
    ME_VERIFICATION_RESEND_WINDOW_MS,
    meVerificationResendRateLimitKey
  } = await loadMeVerificationResend();
  const redis = new FakeRateLimitRedis();
  const key = meVerificationResendRateLimitKey("user_123");

  assert.equal(key, "me-verify-resend|user_123");
  assert.equal(ME_VERIFICATION_RESEND_LIMIT, 3);
  assert.equal(ME_VERIFICATION_RESEND_WINDOW_MS, 15 * 60_000);

  const base = {
    key,
    limit: ME_VERIFICATION_RESEND_LIMIT,
    prefix: "test:rate-limit",
    redis,
    windowMs: ME_VERIFICATION_RESEND_WINDOW_MS
  };

  assert.equal((await checkRateLimit(base)).allowed, true);
  assert.equal((await checkRateLimit(base)).allowed, true);
  assert.equal((await checkRateLimit(base)).allowed, true);

  const fourth = await checkRateLimit(base);
  assert.equal(fourth.allowed, false);
  assert.equal(fourth.retryAfterMs, 15 * 60_000);
});

test("change password is limited with the authenticated user bucket", async () => {
  const { checkRateLimit } = await loadRateLimit();
  const {
    CHANGE_PASSWORD_LIMIT,
    CHANGE_PASSWORD_WINDOW_MS,
    changePasswordRateLimitKey
  } = await loadChangePassword();
  const redis = new FakeRateLimitRedis();
  const key = changePasswordRateLimitKey("user_123");

  assert.equal(key, "change-password|user_123");
  assert.equal(CHANGE_PASSWORD_LIMIT, 3);
  assert.equal(CHANGE_PASSWORD_WINDOW_MS, 10 * 60_000);

  const base = {
    key,
    limit: CHANGE_PASSWORD_LIMIT,
    prefix: "test:rate-limit",
    redis,
    windowMs: CHANGE_PASSWORD_WINDOW_MS
  };

  assert.equal((await checkRateLimit(base)).allowed, true);
  assert.equal((await checkRateLimit(base)).allowed, true);
  assert.equal((await checkRateLimit(base)).allowed, true);

  const fourth = await checkRateLimit(base);
  assert.equal(fourth.allowed, false);
  assert.equal(fourth.retryAfterMs, 10 * 60_000);
});

test("turnstile validates configuration and token before network calls", async () => {
  const { verifyTurnstileToken } = await loadTurnstile();

  assert.deepEqual(await verifyTurnstileToken({ token: "" }), {
    ok: false,
    code: "MISSING_TOKEN",
    errors: ["missing-input-response"]
  });

  assert.deepEqual(
    await verifyTurnstileToken({
      secretKey: "",
      token: "token"
    }),
    {
      ok: false,
      code: "MISSING_SECRET",
      errors: ["missing-input-secret"]
    }
  );
});

test("turnstile returns typed success and failure results", async () => {
  const { verifyTurnstileToken } = await loadTurnstile();
  const successfulFetch = async () =>
    new Response(
      JSON.stringify({
        success: true,
        action: "register",
        challenge_ts: "2026-06-15T12:00:00Z",
        hostname: "radevu.local"
      }),
      { status: 200 }
    );
  const failedFetch = async () =>
    new Response(
      JSON.stringify({
        success: false,
        "error-codes": ["invalid-input-response"]
      }),
      { status: 200 }
    );

  assert.deepEqual(
    await verifyTurnstileToken({
      fetchImpl: successfulFetch,
      secretKey: "secret",
      token: "token"
    }),
    {
      ok: true,
      action: "register",
      challengeTs: "2026-06-15T12:00:00Z",
      cdata: undefined,
      hostname: "radevu.local"
    }
  );

  assert.deepEqual(
    await verifyTurnstileToken({
      fetchImpl: failedFetch,
      secretKey: "secret",
      token: "token"
    }),
    {
      ok: false,
      code: "VERIFY_FAILED",
      errors: ["invalid-input-response"]
    }
  );
});
