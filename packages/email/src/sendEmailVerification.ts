import { Resend } from "resend";
import { EmailVerification } from "./templates/EmailVerification.js";

export type SendEmailVerificationArgs = {
  name: string;
  resendApiKey: string;
  resendFromEmail: string;
  to: string;
  verificationUrl: string;
};

export async function sendEmailVerification(
  args: SendEmailVerificationArgs
): Promise<{ id: string }> {
  const resend = new Resend(args.resendApiKey);
  const result = await resend.emails.send({
    from: `Radevu <${args.resendFromEmail}>`,
    react: EmailVerification({
      name: args.name,
      verification_url: args.verificationUrl
    }),
    subject: "Επιβεβαίωση email στο Radevu",
    to: args.to
  });

  if (result.error) {
    throw new Error(`Resend email verification failed: ${result.error.message}`);
  }

  if (!result.data?.id) {
    throw new Error("Resend email verification failed without message id");
  }

  return {
    id: result.data.id
  };
}
