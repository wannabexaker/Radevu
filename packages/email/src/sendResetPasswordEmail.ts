import { render } from "@react-email/components";
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
  const html = await render(
    ResetPassword({
      name: args.name,
      reset_url: args.resetUrl
    })
  );
  const result = await resend.emails.send({
    from: `Radevu <${args.resendFromEmail}>`,
    html,
    subject: "Αλλαγή κωδικού στο Radevu",
    text: `Γεια σου ${args.name},\n\nΆλλαξε τον κωδικό σου στο Radevu:\n${args.resetUrl}\n\nΑν δεν ζήτησες αλλαγή κωδικού, αγνόησε αυτό το μήνυμα.`,
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
