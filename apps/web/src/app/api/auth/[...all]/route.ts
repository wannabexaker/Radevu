import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import {
  auditLoginAttempt,
  normalizeLoginEmail
} from "@/lib/security/login-attempt-audit";

const handlers = toNextJsHandler(auth.handler);

export const GET = handlers.GET;

function isEmailSignIn(request: Request): boolean {
  return new URL(request.url).pathname === "/api/auth/sign-in/email";
}

async function attemptedEmail(request: Request): Promise<string> {
  try {
    const body = (await request.clone().json()) as unknown;

    if (!body || typeof body !== "object" || !("email" in body)) {
      return "";
    }

    return normalizeLoginEmail((body as { email?: unknown }).email);
  } catch {
    return "";
  }
}

function forwardedIp(request: Request): string | null {
  const value = request.headers.get("x-forwarded-for");
  const first = value?.split(",")[0]?.trim();
  return first ? first.slice(0, 255) : null;
}

function userAgent(request: Request): string | null {
  const value = request.headers.get("user-agent")?.trim();
  return value ? value.slice(0, 1024) : null;
}

export async function POST(request: Request): Promise<Response> {
  if (!isEmailSignIn(request)) {
    return handlers.POST(request);
  }

  const email = await attemptedEmail(request);
  const ip = forwardedIp(request);
  const requestUserAgent = userAgent(request);

  try {
    const response = await handlers.POST(request);

    auditLoginAttempt({
      email,
      ip,
      status: response.status,
      success: response.ok,
      userAgent: requestUserAgent
    });

    return response;
  } catch (error) {
    auditLoginAttempt({
      email,
      ip,
      status: 500,
      success: false,
      userAgent: requestUserAgent
    });
    throw error;
  }
}
