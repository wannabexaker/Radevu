import { render } from "@react-email/components";
import { Resend } from "resend";
import {
  ContactRequestNotification,
  type ContactRequestNotificationProps
} from "./templates/ContactRequestNotification.js";

export { generateICS, type GenerateICSInput } from "./lib/ics.js";
export {
  sendBookingConfirmation,
  type SendBookingConfirmationArgs
} from "./sendBookingConfirmation.js";
export {
  sendOwnerNewBookingAlert,
  type SendOwnerNewBookingAlertArgs
} from "./sendOwnerNewBookingAlert.js";
export {
  sendBookingReminder,
  type SendBookingReminderArgs
} from "./sendBookingReminder.js";
export {
  sendEmailVerification,
  type SendEmailVerificationArgs
} from "./sendEmailVerification.js";
export {
  sendResetPasswordEmail,
  type SendResetPasswordEmailArgs
} from "./sendResetPasswordEmail.js";
export {
  sendCustomerRescheduleApproved,
  sendCustomerRescheduleRejected,
  sendOwnerCancellationAlert,
  sendOwnerRescheduleRequest,
  type SendCustomerRescheduleResultArgs,
  type SendOwnerCancellationAlertArgs,
  type SendOwnerRescheduleRequestArgs
} from "./sendAppointmentActions.js";

export type SendContactRequestEmailArgs = ContactRequestNotificationProps & {
  resendApiKey: string;
  resendFromEmail: string;
  to: string;
};

/**
 * Sends a landing contact request notification email to the founder.
 *
 * @param args - Email credentials, founder recipient, and validated contact request details.
 * @returns The Resend message id.
 * @throws Error when Resend rejects the message.
 */
export async function sendContactRequestEmail(
  args: SendContactRequestEmailArgs
): Promise<{ id: string }> {
  const resend = new Resend(args.resendApiKey);
  const html = await render(
    ContactRequestNotification({
      email: args.email,
      message: args.message,
      name: args.name,
      phone: args.phone
    })
  );
  const text = [
    "Νέο αίτημα επικοινωνίας.",
    `Όνομα: ${args.name}`,
    `Email: ${args.email}`,
    args.phone ? `Τηλέφωνο: ${args.phone}` : null,
    `Μήνυμα:\n${args.message}`
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");

  const result = await resend.emails.send({
    from: `Radevu <${args.resendFromEmail}>`,
    html,
    to: args.to,
    subject: `Νέο αίτημα επικοινωνίας - ${args.name}`,
    text
  });

  if (result.error) {
    throw new Error(`Resend contact request failed: ${result.error.message}`);
  }

  if (!result.data?.id) {
    throw new Error("Resend contact request failed without message id");
  }

  return {
    id: result.data.id
  };
}
