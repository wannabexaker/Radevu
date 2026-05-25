import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional()
);

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_URL: z.string().url(),
  BOOKING_BASE_DOMAIN: z.string().min(1),
  ROUTING_MODE: z.enum(["subpath", "subdomain"]),
  RESEND_API_KEY: optionalNonEmptyString,
  RESEND_FROM_EMAIL: optionalNonEmptyString,
  CONTACT_NOTIFICATION_EMAIL: optionalNonEmptyString,
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development")
});

const isNextProductionBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build";

const buildTimeEnv = {
  DATABASE_URL: "postgresql://radevu:radevu@localhost:5432/radevu",
  REDIS_URL: "redis://localhost:6379",
  BETTER_AUTH_SECRET: "build_time_secret_not_used_at_runtime",
  BETTER_AUTH_URL: "http://localhost:3000",
  BOOKING_BASE_DOMAIN: "localhost",
  ROUTING_MODE: "subpath",
  CONTACT_NOTIFICATION_EMAIL: "founder@example.com",
  NODE_ENV: process.env.NODE_ENV ?? "production"
};

const rawEnv = isNextProductionBuild
  ? {
      ...buildTimeEnv,
      ...process.env
    }
  : process.env;

const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid Radevu environment: ${details}`);
}

if (
  parsedEnv.data.NODE_ENV === "production" &&
  !parsedEnv.data.CONTACT_NOTIFICATION_EMAIL
) {
  throw new Error(
    "Invalid Radevu environment: CONTACT_NOTIFICATION_EMAIL is required in production"
  );
}

export const env = parsedEnv.data;
export type Env = typeof env;
export type RoutingMode = Env["ROUTING_MODE"];
