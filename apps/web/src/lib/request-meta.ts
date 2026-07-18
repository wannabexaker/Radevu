/** Minimal shape shared by `Request.headers` and `next/headers`. */
type HeaderReader = {
  get: (name: string) => string | null;
};

export type ClientMeta = {
  ip: string | null;
  userAgent: string | null;
};

/**
 * Reads the client IP and user agent from request headers.
 *
 * Single definition of what "the client address" means behind the Cloudflare
 * tunnel, so every audit and analytics trail agrees. Both values are capped to
 * the widths the database columns expect.
 *
 * @param headers - Headers of the incoming request.
 * @returns The client metadata, with nulls where headers are absent.
 */
export function clientMetaFromHeaders(headers: HeaderReader): ClientMeta {
  const forwardedFor = headers.get("x-forwarded-for");
  const firstIp = forwardedFor?.split(",")[0]?.trim();
  const userAgent = headers.get("user-agent")?.trim();

  return {
    ip: firstIp ? firstIp.slice(0, 255) : null,
    userAgent: userAgent ? userAgent.slice(0, 1024) : null
  };
}
