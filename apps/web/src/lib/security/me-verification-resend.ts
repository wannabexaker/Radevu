export const ME_VERIFICATION_RESEND_LIMIT = 3;
export const ME_VERIFICATION_RESEND_WINDOW_MS = 15 * 60_000;

export function meVerificationResendRateLimitKey(userId: string): string {
  return `me-verify-resend|${userId}`;
}
