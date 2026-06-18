import {
  Button,
  Heading,
  Section,
  Text
} from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout.js";

export type OwnerNewBookingAlertProps = {
  business_name: string;
  customer_email?: string;
  customer_name: string;
  customer_phone?: string;
  dashboard_url: string;
  formatted_date: string;
  formatted_price: string;
  formatted_time: string;
  note?: string;
  service_name: string;
};

/**
 * Renders the owner notification email for a new booking.
 *
 * @param props - Appointment, customer, and dashboard details formatted by the caller.
 * @returns A React Email document.
 */
export function OwnerNewBookingAlert({
  business_name,
  customer_email,
  customer_name,
  customer_phone,
  dashboard_url,
  formatted_date,
  formatted_price,
  formatted_time,
  note,
  service_name
}: OwnerNewBookingAlertProps): JSX.Element {
  return (
    <EmailLayout
      preview={`Νέα κράτηση για ${service_name} από ${customer_name}.`}
    >
            <Heading className="m-0 text-2xl font-semibold leading-tight text-slate-900">
              Νέα κράτηση
            </Heading>
            <Text className="mt-4 text-base leading-relaxed text-slate-700">
              Ο/η {customer_name} έκλεισε {service_name} στο {business_name}.
            </Text>
            <Section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Text className="m-0 text-sm text-slate-500">Πελάτης</Text>
              <Text className="mb-3 mt-1 text-base font-semibold text-slate-900">
                {customer_name}
              </Text>
              <Text className="m-0 text-sm text-slate-500">Επικοινωνία</Text>
              <Text className="mb-3 mt-1 text-base font-semibold text-slate-900">
                {customer_email ?? customer_phone ?? "Δεν δόθηκε"}
              </Text>
              <Text className="m-0 text-sm text-slate-500">Υπηρεσία</Text>
              <Text className="mb-3 mt-1 text-base font-semibold text-slate-900">
                {service_name}
              </Text>
              <Text className="m-0 text-sm text-slate-500">Ημέρα και ώρα</Text>
              <Text className="mb-3 mt-1 text-base font-semibold text-slate-900">
                {formatted_date}, {formatted_time}
              </Text>
              <Text className="m-0 text-sm text-slate-500">Τιμή</Text>
              <Text className="m-0 mt-1 text-base font-semibold text-slate-900">
                {formatted_price}
              </Text>
            </Section>
            {note ? (
              <Section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                <Text className="m-0 text-sm text-slate-500">Σημείωση</Text>
                <Text className="m-0 mt-1 text-base leading-relaxed text-slate-800">
                  {note}
                </Text>
              </Section>
            ) : null}
            <Button
              className="mt-5 rounded-xl bg-indigo-500 px-5 py-3 text-center text-base font-medium text-white"
              href={dashboard_url}
            >
              Άνοιγμα κράτησης
            </Button>
            <Text className="mt-5 text-sm leading-relaxed text-slate-500">
              Μπορείς να τη δεις από την καρτέλα Κρατήσεις.
            </Text>
            <Text className="mb-0 mt-5 text-base text-slate-700">
              Η ομάδα του Radevu
            </Text>
    </EmailLayout>
  );
}
