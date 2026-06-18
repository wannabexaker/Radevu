import { createHash } from "node:crypto";

type RateLimitRedis = {
  eval: (
    script: string,
    numberOfKeys: number,
    ...args: Array<number | string>
  ) => Promise<unknown>;
};

export type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
  prefix?: string;
  redis?: RateLimitRedis;
};

export type RateLimitResult = {
  allowed: boolean;
  count: number;
  key: string;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterMs: number;
};

const RATE_LIMIT_PREFIX = "radevu:rate-limit";

const incrementLua = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return { count, ttl }
`;

function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

function hashedKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

async function defaultRedis(): Promise<RateLimitRedis> {
  const redisModule = await import("../redis");
  return redisModule.redis;
}

function parseEvalResult(result: unknown, fallbackWindowMs: number): {
  count: number;
  ttlMs: number;
} {
  if (!Array.isArray(result)) {
    return {
      count: 1,
      ttlMs: fallbackWindowMs
    };
  }

  const [countRaw, ttlRaw] = result;
  const count = Number(countRaw);
  const ttlMs = Number(ttlRaw);

  return {
    count: Number.isFinite(count) && count > 0 ? count : 1,
    ttlMs: Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : fallbackWindowMs
  };
}

/**
 * Builds a privacy-preserving Redis key for a rate-limit bucket.
 *
 * @param parts - Stable bucket parts such as route, email, or IP.
 * @returns Redis key with hashed user-controlled data.
 */
export function rateLimitKey(parts: string[]): string {
  return hashedKey(parts.map((part) => part.trim().toLowerCase()).join("|"));
}

/**
 * Atomically increments and evaluates a Redis-backed fixed-window rate limit.
 *
 * @param input - Bucket key, limit, window, and optional test Redis client.
 * @returns Current allowance and retry metadata.
 */
export async function checkRateLimit(
  input: RateLimitInput
): Promise<RateLimitResult> {
  assertPositiveInteger("limit", input.limit);
  assertPositiveInteger("windowMs", input.windowMs);

  const key = `${input.prefix ?? RATE_LIMIT_PREFIX}:${hashedKey(input.key)}`;
  const redis = input.redis ?? (await defaultRedis());
  const { count, ttlMs } = parseEvalResult(
    await redis.eval(incrementLua, 1, key, input.windowMs),
    input.windowMs
  );
  const allowed = count <= input.limit;
  const retryAfterMs = allowed ? 0 : ttlMs;

  return {
    allowed,
    count,
    key,
    limit: input.limit,
    remaining: Math.max(input.limit - count, 0),
    resetAt: new Date(Date.now() + ttlMs),
    retryAfterMs
  };
}
