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

export type SendContactRequestEmailInput = ContactRequestNotificationProps;

type EmailEnv = {
  contactNotificationEmail: string;
  resendApiKey: string;
  resendFromEmail: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required email environment variable: ${name}`);
  }

  return value;
}

function readEmailEnv(): EmailEnv {
  return {
    contactNotificationEmail: requiredEnv("CONTACT_NOTIFICATION_EMAIL"),
    resendApiKey: requiredEnv("RESEND_API_KEY"),
    resendFromEmail: requiredEnv("RESEND_FROM_EMAIL")
  };
}

/**
 * Sends a landing contact request notification email to the founder.
 *
 * @param input - Contact request details validated by the API layer.
 * @throws Error when required email environment variables are missing or Resend rejects the message.
 */
export async function sendContactRequestEmail(
  input: SendContactRequestEmailInput
): Promise<void> {
  const emailEnv = readEmailEnv();
  const resend = new Resend(emailEnv.resendApiKey);

  const result = await resend.emails.send({
    from: emailEnv.resendFromEmail,
    to: emailEnv.contactNotificationEmail,
    subject: `Νέο contact request — ${input.name}`,
    react: ContactRequestNotification(input)
  });

  if (result.error) {
    throw new Error(`Resend contact request failed: ${result.error.message}`);
  }
}
