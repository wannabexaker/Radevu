export const CHANGE_PASSWORD_LIMIT = 3;
export const CHANGE_PASSWORD_WINDOW_MS = 10 * 60_000;

export function changePasswordRateLimitKey(userId: string): string {
  return `change-password|${userId}`;
}
