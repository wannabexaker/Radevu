import { render } from "@react-email/components";
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
  const html = await render(
    EmailVerification({
      name: args.name,
      verification_url: args.verificationUrl
    })
  );
  const result = await resend.emails.send({
    from: `Radevu <${args.resendFromEmail}>`,
    html,
    subject: "Επιβεβαίωση email στο Radevu",
    text: `Γεια σου ${args.name},\n\nΕπιβεβαίωσε το email σου στο Radevu:\n${args.verificationUrl}\n\nΑν δεν δημιούργησες λογαριασμό, αγνόησε αυτό το μήνυμα.`,
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
