import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const GUEST_TOKEN_BYTES = 32;
const GUEST_TOKEN_TTL_DAYS = 90;

/**
 * Creates the raw guest token that is sent only to the customer.
 *
 * @returns URL-safe random token.
 */
export function createAppointmentGuestToken(): string {
  return randomBytes(GUEST_TOKEN_BYTES).toString("base64url");
}

/**
 * Hashes a guest token before persistence.
 *
 * @param token - Raw token from a booking link.
 * @returns SHA-256 hex digest.
 */
export function hashAppointmentGuestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Computes the guest token expiry timestamp.
 *
 * @param now - Reference time.
 * @returns Expiry date 90 days from the reference time.
 */
export function appointmentGuestTokenExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + GUEST_TOKEN_TTL_DAYS * 24 * 60 * 60_000);
}

/**
 * Validates a raw guest token against a stored hash and expiry.
 *
 * @param token - Raw token from the customer link.
 * @param storedHash - Persisted SHA-256 hash.
 * @param expiresAt - Persisted expiry date.
 * @returns True when the token matches and is still active.
 */
export function isAppointmentGuestTokenValid(
  token: string,
  storedHash: string | null,
  expiresAt: Date | null
): boolean {
  if (!storedHash || !expiresAt || expiresAt.getTime() <= Date.now()) {
    return false;
  }

  const candidateHash = hashAppointmentGuestToken(token);
  const storedBuffer = Buffer.from(storedHash, "hex");
  const candidateBuffer = Buffer.from(candidateHash, "hex");

  return (
    storedBuffer.length === candidateBuffer.length &&
    timingSafeEqual(storedBuffer, candidateBuffer)
  );
}
