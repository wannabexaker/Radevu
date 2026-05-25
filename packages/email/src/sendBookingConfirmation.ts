import { Resend } from "resend";
import { generateICS } from "./lib/ics.js";
import { BookingConfirmation } from "./templates/BookingConfirmation.js";

type BookingEmailBusiness = {
  contactEmail: string | null;
  contactPhone: string | null;
  mapsUrl: string | null;
  name: string;
};

type BookingEmailCustomer = {
  email: string | null;
  name: string;
  phone: string | null;
};

type BookingEmailService = {
  currency: string;
  durationMinutes: number;
  name: string;
  priceCents: number;
};

type BookingEmailAppointment = {
  endsAt: Date;
  id: string;
  notes: string | null;
  startsAt: Date;
};

export type SendBookingConfirmationArgs = {
  appointment: BookingEmailAppointment;
  business: BookingEmailBusiness;
  customer: BookingEmailCustomer;
  resendApiKey: string;
  resendFromEmail: string;
  service: BookingEmailService;
  timezone: string;
  to: string;
};

function formatDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("el-GR", {
    day: "numeric",
    month: "long",
    timeZone: timezone,
    weekday: "long"
  }).format(date);
}

function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("el-GR", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: timezone
  }).format(date);
}

function formatPrice(priceCents: number, currency: string): string {
  const amount = priceCents / 100;

  if (Number.isInteger(amount) && currency === "EUR") {
    return `€${amount}`;
  }

  return new Intl.NumberFormat("el-GR", {
    currency,
    style: "currency"
  }).format(amount);
}

function buildDescription(args: SendBookingConfirmationArgs): string {
  return [
    args.appointment.notes ? `Σημείωση: ${args.appointment.notes}` : null,
    args.business.contactPhone
      ? `Τηλέφωνο επιχείρησης: ${args.business.contactPhone}`
      : null,
    args.business.contactEmail
      ? `Email επιχείρησης: ${args.business.contactEmail}`
      : null,
    args.business.mapsUrl ? `Χάρτης: ${args.business.mapsUrl}` : null
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

/**
 * Sends the customer booking confirmation email with an attached calendar invite.
 *
 * @param args - Email credentials, recipient, and appointment details.
 * @returns The Resend message id.
 * @throws Error when Resend rejects the email.
 */
export async function sendBookingConfirmation(
  args: SendBookingConfirmationArgs
): Promise<{ id: string }> {
  const resend = new Resend(args.resendApiKey);
  const formattedDate = formatDate(args.appointment.startsAt, args.timezone);
  const formattedTime = formatTime(args.appointment.startsAt, args.timezone);
  const formattedPrice = formatPrice(
    args.service.priceCents,
    args.service.currency
  );
  const ics = generateICS({
    attendee_email: args.to,
    attendee_name: args.customer.name,
    description: buildDescription(args),
    ends_at: args.appointment.endsAt,
    location: args.business.mapsUrl ?? "",
    organizer_email: args.business.contactEmail ?? args.resendFromEmail,
    starts_at: args.appointment.startsAt,
    summary: `${args.service.name} — ${args.business.name}`,
    timezone: args.timezone,
    uid: `${args.appointment.id}@radevu`
  });

  const result = await resend.emails.send({
    attachments: [
      {
        content: ics,
        contentType: "text/calendar; charset=utf-8; method=REQUEST",
        filename: "radevu-rantevou.ics"
      }
    ],
    from: `Radevu <${args.resendFromEmail}>`,
    react: BookingConfirmation({
      business_email: args.business.contactEmail ?? undefined,
      business_maps_url: args.business.mapsUrl ?? undefined,
      business_name: args.business.name,
      business_phone: args.business.contactPhone ?? undefined,
      customer_name: args.customer.name,
      duration_minutes: args.service.durationMinutes,
      formatted_date: formattedDate,
      formatted_price: formattedPrice,
      formatted_time: formattedTime,
      note: args.appointment.notes ?? undefined,
      service_name: args.service.name
    }),
    subject: `Επιβεβαίωση κράτησης — ${args.service.name} στις ${args.business.name}`,
    to: args.to
  });

  if (result.error) {
    throw new Error(`Resend booking confirmation failed: ${result.error.message}`);
  }

  if (!result.data?.id) {
    throw new Error("Resend booking confirmation failed without message id");
  }

  return {
    id: result.data.id
  };
}
