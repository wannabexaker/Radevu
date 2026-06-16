import { env } from "@/lib/env";

export type ResendEmailConfig = {
  resendApiKey: string;
  resendFromEmail: string;
};

export function isValidResendApiKey(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().startsWith("re_");
}

export function getResendEmailConfig(
  context: string
): ResendEmailConfig | null {
  const hasValidApiKey = isValidResendApiKey(env.RESEND_API_KEY);
  const hasFromEmail = Boolean(env.RESEND_FROM_EMAIL);

  if (!hasValidApiKey || !hasFromEmail) {
    console.info(`${context} email skipped: Resend config not usable`, {
      has_resend_api_key: Boolean(env.RESEND_API_KEY),
      has_valid_resend_api_key: hasValidApiKey,
      has_resend_from_email: hasFromEmail,
      node_env: env.NODE_ENV
    });
    return null;
  }

  return {
    resendApiKey: env.RESEND_API_KEY as string,
    resendFromEmail: env.RESEND_FROM_EMAIL as string
  };
}
