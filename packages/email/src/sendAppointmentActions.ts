import { render } from "@react-email/components";
import { Resend } from "resend";
import { CustomerRescheduleApproved } from "./templates/CustomerRescheduleApproved.js";
import { CustomerRescheduleRejected } from "./templates/CustomerRescheduleRejected.js";
import { OwnerCancellationAlert } from "./templates/OwnerCancellationAlert.js";
import { OwnerRescheduleRequest } from "./templates/OwnerRescheduleRequest.js";

type BaseArgs = {
  resendApiKey: string;
  resendFromEmail: string;
  to: string;
};

type AppointmentSummary = {
  businessName: string;
  customerName: string;
  serviceName: string;
  timezone: string;
};

function formatDateTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("el-GR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone
  }).format(date);
}

async function send(
  args: BaseArgs,
  subject: string,
  component: JSX.Element,
  text: string
): Promise<{ id: string }> {
  const html = await render(component);
  const result = await new Resend(args.resendApiKey).emails.send({
    from: `Radevu <${args.resendFromEmail}>`,
    html,
    subject,
    text,
    to: args.to
  });

  if (result.error || !result.data?.id) {
    throw new Error(result.error?.message ?? "Resend appointment action email failed");
  }

  return { id: result.data.id };
}

export type SendOwnerCancellationAlertArgs = BaseArgs & AppointmentSummary & {
  dashboardUrl: string;
  reason: string;
  startsAt: Date;
};

export async function sendOwnerCancellationAlert(
  args: SendOwnerCancellationAlertArgs
): Promise<{ id: string }> {
  const formattedDateTime = formatDateTime(args.startsAt, args.timezone);

  return send(
    args,
    `Ακύρωση ραντεβού — ${args.customerName}`,
    OwnerCancellationAlert({
      business_name: args.businessName,
      customer_name: args.customerName,
      dashboard_url: args.dashboardUrl,
      formatted_date_time: formattedDateTime,
      reason: args.reason,
      service_name: args.serviceName
    }),
    `Ακυρώθηκε ραντεβού από τον πελάτη.\n\nΠελάτης: ${args.customerName}\nΥπηρεσία: ${args.serviceName}\nΏρα: ${formattedDateTime}\nΛόγος: ${args.reason}\n\nΔες τα ραντεβού: ${args.dashboardUrl}`
  );
}

export type SendOwnerRescheduleRequestArgs = BaseArgs & AppointmentSummary & {
  currentStart: Date;
  dashboardUrl: string;
  requestedStart: Date;
};

export async function sendOwnerRescheduleRequest(
  args: SendOwnerRescheduleRequestArgs
): Promise<{ id: string }> {
  const formattedCurrent = formatDateTime(args.currentStart, args.timezone);
  const formattedRequested = formatDateTime(
    args.requestedStart,
    args.timezone
  );

  return send(
    args,
    `Αίτημα αλλαγής ώρας — ${args.customerName}`,
    OwnerRescheduleRequest({
      customer_name: args.customerName,
      dashboard_url: args.dashboardUrl,
      formatted_current: formattedCurrent,
      formatted_requested: formattedRequested,
      service_name: args.serviceName
    }),
    `Νέο αίτημα αλλαγής ώρας.\n\nΠελάτης: ${args.customerName}\nΥπηρεσία: ${args.serviceName}\nΤρέχουσα ώρα: ${formattedCurrent}\nΠροτεινόμενη ώρα: ${formattedRequested}\n\nΑπάντησε από το dashboard: ${args.dashboardUrl}`
  );
}

export type SendCustomerRescheduleResultArgs = BaseArgs & AppointmentSummary & {
  startsAt: Date;
};

export async function sendCustomerRescheduleApproved(
  args: SendCustomerRescheduleResultArgs
): Promise<{ id: string }> {
  const formattedDateTime = formatDateTime(args.startsAt, args.timezone);

  return send(
    args,
    `Νέα ώρα ραντεβού — ${args.serviceName}`,
    CustomerRescheduleApproved({
      business_name: args.businessName,
      customer_name: args.customerName,
      formatted_date_time: formattedDateTime,
      service_name: args.serviceName
    }),
    `Η αλλαγή ώρας εγκρίθηκε.\n\nΕπιχείρηση: ${args.businessName}\nΥπηρεσία: ${args.serviceName}\nΝέα ώρα: ${formattedDateTime}`
  );
}

export async function sendCustomerRescheduleRejected(
  args: SendCustomerRescheduleResultArgs
): Promise<{ id: string }> {
  const formattedDateTime = formatDateTime(args.startsAt, args.timezone);

  return send(
    args,
    `Απόρριψη αλλαγής ώρας — ${args.serviceName}`,
    CustomerRescheduleRejected({
      business_name: args.businessName,
      customer_name: args.customerName,
      formatted_date_time: formattedDateTime,
      service_name: args.serviceName
    }),
    `Το αίτημα αλλαγής ώρας δεν εγκρίθηκε.\n\nΕπιχείρηση: ${args.businessName}\nΥπηρεσία: ${args.serviceName}\nΤο ραντεβού παραμένει: ${formattedDateTime}`
  );
}
