import { prisma } from "@/lib/db";

export type LoginAttemptAuditInput = {
  email: string;
  ip: string | null;
  status: number;
  success: boolean;
  userAgent: string | null;
};

type LoginFailureReason =
  | "invalid_credentials"
  | "invalid_request"
  | "rate_limited"
  | "server_error"
  | "unknown_email"
  | "unknown_failure";

export function normalizeLoginEmail(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toLowerCase().slice(0, 320)
    : "";
}

function failureReason(
  status: number,
  userExists: boolean
): LoginFailureReason {
  if (status === 429) {
    return "rate_limited";
  }

  if (status === 401 || status === 403) {
    return userExists ? "invalid_credentials" : "unknown_email";
  }

  if (status === 400) {
    return "invalid_request";
  }

  if (status >= 500) {
    return "server_error";
  }

  return "unknown_failure";
}

async function persistLoginAttempt(input: LoginAttemptAuditInput): Promise<void> {
  const user = input.email
    ? await prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true }
      })
    : null;

  await prisma.loginAttempt.create({
    data: {
      email: input.email,
      failureReason: input.success
        ? null
        : failureReason(input.status, Boolean(user)),
      ip: input.ip,
      success: input.success,
      userAgent: input.userAgent,
      userId: user?.id ?? null
    }
  });
}

function reportAuditFailure(error: unknown, status: number): void {
  console.error("Failed to persist login attempt audit", {
    error: error instanceof Error ? error.message : "unknown_error",
    status
  });
}

export function auditLoginAttempt(input: LoginAttemptAuditInput): void {
  try {
    void persistLoginAttempt(input).catch((error: unknown) => {
      reportAuditFailure(error, input.status);
    });
  } catch (error) {
    reportAuditFailure(error, input.status);
  }
}
