import {
  sendCustomerRescheduleApproved,
  sendCustomerRescheduleRejected,
  sendOwnerCancellationAlert,
  sendOwnerRescheduleRequest
} from "@radevu/email";
import { getResendEmailConfig } from "@/lib/email-config";
import { env } from "@/lib/env";

export type AppointmentActionEmailContext = {
  business: {
    contactEmail: string | null;
    name: string;
    ownerEmail: string | null;
    timezone: string;
  };
  customer: {
    email: string | null;
    name: string;
  };
  serviceName: string;
  startsAt: Date;
};

function dashboardUrl(): string {
  return new URL("/dashboard/appointments", env.BETTER_AUTH_URL).toString();
}

function ownerRecipient(context: AppointmentActionEmailContext): string | null {
  return env.BOOKING_OWNER_ALERT_EMAIL_OVERRIDE ??
    context.business.contactEmail ??
    context.business.ownerEmail;
}

export function notifyOwnerCancellation(
  context: AppointmentActionEmailContext,
  reason: string
): void {
  const config = getResendEmailConfig("Appointment cancellation");
  const to = ownerRecipient(context);
  if (!config || !to) return;

  void sendOwnerCancellationAlert({
    ...config,
    businessName: context.business.name,
    customerName: context.customer.name,
    dashboardUrl: dashboardUrl(),
    reason,
    serviceName: context.serviceName,
    startsAt: context.startsAt,
    timezone: context.business.timezone,
    to
  }).catch((error) => console.error("[owner cancellation email failed]", { error }));
}

export function notifyOwnerReschedule(
  context: AppointmentActionEmailContext,
  requestedStart: Date
): void {
  const config = getResendEmailConfig("Appointment reschedule request");
  const to = ownerRecipient(context);
  if (!config || !to) return;

  void sendOwnerRescheduleRequest({
    ...config,
    businessName: context.business.name,
    currentStart: context.startsAt,
    customerName: context.customer.name,
    dashboardUrl: dashboardUrl(),
    requestedStart,
    serviceName: context.serviceName,
    timezone: context.business.timezone,
    to
  }).catch((error) => console.error("[owner reschedule email failed]", { error }));
}

export function notifyCustomerRescheduleResult(
  context: AppointmentActionEmailContext,
  approved: boolean
): void {
  const config = getResendEmailConfig("Appointment reschedule result");
  if (!config || !context.customer.email) return;

  const sendResult = approved
    ? sendCustomerRescheduleApproved
    : sendCustomerRescheduleRejected;
  void sendResult({
    ...config,
    businessName: context.business.name,
    customerName: context.customer.name,
    serviceName: context.serviceName,
    startsAt: context.startsAt,
    timezone: context.business.timezone,
    to: context.customer.email
  }).catch((error) => console.error("[customer reschedule email failed]", { approved, error }));
}
