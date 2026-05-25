import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  let dbOk = false;
  let redisOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (error) {
    console.error("Health check failed for PostgreSQL", error);
    dbOk = false;
  }

  try {
    const pong = await redis.ping();
    redisOk = pong === "PONG";
  } catch (error) {
    console.error("Health check failed for Redis", error);
    redisOk = false;
  }

  const status = dbOk && redisOk ? "ok" : "error";
  const httpStatus = dbOk && redisOk ? 200 : 503;

  return NextResponse.json(
    {
      status,
      db: dbOk ? "ok" : "error",
      redis: redisOk ? "ok" : "error"
    },
    { status: httpStatus }
  );
}
