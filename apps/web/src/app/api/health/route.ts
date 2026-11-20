import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

/**
 * Health endpoint kept for backward compatibility (the container HEALTHCHECK
 * and the Pi update script poll this path). `/healthz` is the shared alias.
 */
export async function GET(): Promise<NextResponse> {
  const { body, httpStatus } = await checkHealth();
  return NextResponse.json(body, { status: httpStatus });
}
