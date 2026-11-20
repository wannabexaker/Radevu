import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

// Stamped into the image at build time (see apps/web/Dockerfile + CI). Read
// once at module load; "unknown" locally where they are not set.
const APP_VERSION = process.env.APP_VERSION?.trim() || "unknown";
const GIT_COMMIT = process.env.GIT_COMMIT?.trim() || "unknown";

export type HealthBody = {
  status: "ok" | "error";
  version: string;
  commit: string;
  db: "ok" | "error";
  redis: "ok" | "error";
};

export type HealthResult = {
  body: HealthBody;
  httpStatus: 200 | 503;
};

/**
 * Checks the service's own dependencies and reports build provenance.
 *
 * Shared by `/healthz` and `/api/health`. Never throws: each dependency check
 * is isolated so one failure is reported, not propagated.
 *
 * @returns The health body and the HTTP status that should carry it.
 */
export async function checkHealth(): Promise<HealthResult> {
  let dbOk = false;
  let redisOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (error) {
    console.error("Health check failed for PostgreSQL", error);
  }

  try {
    const pong = await redis.ping();
    redisOk = pong === "PONG";
  } catch (error) {
    console.error("Health check failed for Redis", error);
  }

  const ok = dbOk && redisOk;

  return {
    body: {
      status: ok ? "ok" : "error",
      version: APP_VERSION,
      commit: GIT_COMMIT,
      db: dbOk ? "ok" : "error",
      redis: redisOk ? "ok" : "error"
    },
    httpStatus: ok ? 200 : 503
  };
}
