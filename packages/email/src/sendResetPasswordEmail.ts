import { Resend } from "resend";
import { ResetPassword } from "./templates/ResetPassword.js";

export type SendResetPasswordEmailArgs = {
  name: string;
  resendApiKey: string;
  resendFromEmail: string;
  resetUrl: string;
  to: string;
};

export async function sendResetPasswordEmail(
  args: SendResetPasswordEmailArgs
): Promise<{ id: string }> {
  const resend = new Resend(args.resendApiKey);
  const result = await resend.emails.send({
    from: `Radevu <${args.resendFromEmail}>`,
    react: ResetPassword({
      name: args.name,
      reset_url: args.resetUrl
    }),
    subject: "Αλλαγή κωδικού στο Radevu",
    to: args.to
  });

  if (result.error) {
    throw new Error(`Resend password reset failed: ${result.error.message}`);
  }

  if (!result.data?.id) {
    throw new Error("Resend password reset failed without message id");
  }

  return {
    id: result.data.id
  };
}
