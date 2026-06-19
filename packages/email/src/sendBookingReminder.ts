import { render } from "@react-email/components";
import { Resend } from "resend";
import { BookingReminder } from "./templates/BookingReminder.js";

type ReminderEmailBusiness = {
  contactEmail: string | null;
  contactPhone: string | null;
  mapsUrl: string | null;
  name: string;
};

type ReminderEmailCustomer = {
  email: string | null;
  name: string;
  phone: string | null;
};

type ReminderEmailService = {
  name: string;
};

type ReminderEmailAppointment = {
  startsAt: Date;
};

export type SendBookingReminderArgs = {
  appointment: ReminderEmailAppointment;
  business: ReminderEmailBusiness;
  customer: ReminderEmailCustomer;
  resendApiKey: string;
  resendFromEmail: string;
  service: ReminderEmailService;
  timezone: string;
  to: string;
};

function dateKey(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric"
  }).formatToParts(date);

  const getPart = (type: string): string =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

function nextDateKey(date: Date, timezone: string): string {
  const [year = 0, month = 1, day = 1] = dateKey(date, timezone)
    .split("-")
    .map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 12));

  return dateKey(nextDay, timezone);
}

function formatFullDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "long",
    timeZone: timezone,
    weekday: "long"
  }).format(date);
}

function formatReminderDate(date: Date, timezone: string): string {
  return dateKey(date, timezone) === nextDateKey(new Date(), timezone)
    ? "αύριο"
    : formatFullDate(date, timezone);
}

function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("el-GR", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: timezone
  }).format(date);
}

/**
 * Sends a customer reminder email for an upcoming booking.
 *
 * @param args - Email credentials, recipient, and appointment details.
 * @returns The Resend message id.
 * @throws Error when Resend rejects the email.
 */
export async function sendBookingReminder(
  args: SendBookingReminderArgs
): Promise<{ id: string }> {
  const resend = new Resend(args.resendApiKey);
  const formattedDate = formatReminderDate(
    args.appointment.startsAt,
    args.timezone
  );
  const formattedTime = formatTime(args.appointment.startsAt, args.timezone);
  const html = await render(
    BookingReminder({
      business_email: args.business.contactEmail ?? undefined,
      business_maps_url: args.business.mapsUrl ?? undefined,
      business_name: args.business.name,
      business_phone: args.business.contactPhone ?? undefined,
      customer_name: args.customer.name,
      formatted_date: formattedDate,
      formatted_time: formattedTime,
      service_name: args.service.name
    })
  );
  const text = [
    `Υπενθύμιση κράτησης για ${args.service.name} στις ${args.business.name}.`,
    `Ημερομηνία: ${formattedDate}`,
    `Ώρα: ${formattedTime}`,
    args.business.contactPhone
      ? `Τηλέφωνο: ${args.business.contactPhone}`
      : null,
    args.business.mapsUrl ? `Χάρτης: ${args.business.mapsUrl}` : null
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
  const result = await resend.emails.send({
    from: `Radevu <${args.resendFromEmail}>`,
    html,
    subject: `Υπενθύμιση: ${formattedDate} ${formattedTime} — ${args.service.name} στις ${args.business.name}`,
    text,
    to: args.to
  });

  if (result.error) {
    throw new Error(`Resend booking reminder failed: ${result.error.message}`);
  }

  if (!result.data?.id) {
    throw new Error("Resend booking reminder failed without message id");
  }

  return {
    id: result.data.id
  };
}
