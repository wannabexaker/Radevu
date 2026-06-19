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
  react: JSX.Element
): Promise<{ id: string }> {
  const result = await new Resend(args.resendApiKey).emails.send({
    from: `Radevu <${args.resendFromEmail}>`,
    react,
    subject,
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

export function sendOwnerCancellationAlert(args: SendOwnerCancellationAlertArgs): Promise<{ id: string }> {
  return send(args, `Ακύρωση ραντεβού — ${args.customerName}`, OwnerCancellationAlert({
    business_name: args.businessName,
    customer_name: args.customerName,
    dashboard_url: args.dashboardUrl,
    formatted_date_time: formatDateTime(args.startsAt, args.timezone),
    reason: args.reason,
    service_name: args.serviceName
  }));
}

export type SendOwnerRescheduleRequestArgs = BaseArgs & AppointmentSummary & {
  currentStart: Date;
  dashboardUrl: string;
  requestedStart: Date;
};

export function sendOwnerRescheduleRequest(args: SendOwnerRescheduleRequestArgs): Promise<{ id: string }> {
  return send(args, `Αίτημα αλλαγής ώρας — ${args.customerName}`, OwnerRescheduleRequest({
    customer_name: args.customerName,
    dashboard_url: args.dashboardUrl,
    formatted_current: formatDateTime(args.currentStart, args.timezone),
    formatted_requested: formatDateTime(args.requestedStart, args.timezone),
    service_name: args.serviceName
  }));
}

export type SendCustomerRescheduleResultArgs = BaseArgs & AppointmentSummary & {
  startsAt: Date;
};

export function sendCustomerRescheduleApproved(args: SendCustomerRescheduleResultArgs): Promise<{ id: string }> {
  return send(args, `Νέα ώρα ραντεβού — ${args.serviceName}`, CustomerRescheduleApproved({
    business_name: args.businessName,
    customer_name: args.customerName,
    formatted_date_time: formatDateTime(args.startsAt, args.timezone),
    service_name: args.serviceName
  }));
}

export function sendCustomerRescheduleRejected(args: SendCustomerRescheduleResultArgs): Promise<{ id: string }> {
  return send(args, `Απόρριψη αλλαγής ώρας — ${args.serviceName}`, CustomerRescheduleRejected({
    business_name: args.businessName,
    customer_name: args.customerName,
    formatted_date_time: formatDateTime(args.startsAt, args.timezone),
    service_name: args.serviceName
  }));
}
