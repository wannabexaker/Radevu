import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

/**
 * Unauthenticated health endpoint, polled by external monitoring.
 *
 * Returns 200 with status, version, commit, and dependency state when healthy;
 * 503 otherwise. Aliased by `/api/health` for backward compatibility.
 */
export async function GET(): Promise<NextResponse> {
  const { body, httpStatus } = await checkHealth();
  return NextResponse.json(body, { status: httpStatus });
}
