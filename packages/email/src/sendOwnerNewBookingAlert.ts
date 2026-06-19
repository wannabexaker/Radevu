import { render } from "@react-email/components";
import { Resend } from "resend";
import { OwnerNewBookingAlert } from "./templates/OwnerNewBookingAlert.js";

type OwnerEmailBusiness = {
  name: string;
};

type OwnerEmailCustomer = {
  email: string | null;
  name: string;
  phone: string | null;
};

type OwnerEmailService = {
  currency: string;
  name: string;
  priceCents: number;
};

type OwnerEmailAppointment = {
  notes: string | null;
  startsAt: Date;
};

export type SendOwnerNewBookingAlertArgs = {
  appointment: OwnerEmailAppointment;
  business: OwnerEmailBusiness;
  customer: OwnerEmailCustomer;
  dashboardUrl: string;
  resendApiKey: string;
  resendFromEmail: string;
  service: OwnerEmailService;
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

/**
 * Sends an owner alert email for a new guest booking.
 *
 * @param args - Email credentials, owner recipient, dashboard URL, and appointment details.
 * @returns The Resend message id.
 * @throws Error when Resend rejects the email.
 */
export async function sendOwnerNewBookingAlert(
  args: SendOwnerNewBookingAlertArgs
): Promise<{ id: string }> {
  const resend = new Resend(args.resendApiKey);
  const formattedDate = formatDate(args.appointment.startsAt, args.timezone);
  const formattedPrice = formatPrice(
    args.service.priceCents,
    args.service.currency
  );
  const formattedTime = formatTime(args.appointment.startsAt, args.timezone);
  const html = await render(
    OwnerNewBookingAlert({
      business_name: args.business.name,
      customer_email: args.customer.email ?? undefined,
      customer_name: args.customer.name,
      customer_phone: args.customer.phone ?? undefined,
      dashboard_url: args.dashboardUrl,
      formatted_date: formattedDate,
      formatted_price: formattedPrice,
      formatted_time: formattedTime,
      note: args.appointment.notes ?? undefined,
      service_name: args.service.name
    })
  );
  const result = await resend.emails.send({
    from: `Radevu <${args.resendFromEmail}>`,
    html,
    subject: `Νέα κράτηση — ${args.customer.name} για ${args.service.name}`,
    text: `Νέα κράτηση στις ${args.business.name}.\n\nΠελάτης: ${args.customer.name}\nΥπηρεσία: ${args.service.name}\nΗμερομηνία: ${formattedDate}\nΏρα: ${formattedTime}\nΤιμή: ${formattedPrice}\n\nΔες την κράτηση: ${args.dashboardUrl}`,
    to: args.to
  });

  if (result.error) {
    throw new Error(`Resend owner booking alert failed: ${result.error.message}`);
  }

  if (!result.data?.id) {
    throw new Error("Resend owner booking alert failed without message id");
  }

  return {
    id: result.data.id
  };
}
