import {
  Button,
  Heading,
  Section,
  Text
} from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout.js";

export type BookingReminderProps = {
  business_email?: string;
  business_maps_url?: string;
  business_name: string;
  business_phone?: string;
  customer_name: string;
  formatted_date: string;
  formatted_time: string;
  service_name: string;
};

/**
 * Renders the customer reminder email for an upcoming professional booking.
 *
 * @param props - Appointment details formatted by the caller.
 * @returns A React Email document.
 */
export function BookingReminder({
  business_email,
  business_maps_url,
  business_name,
  business_phone,
  customer_name,
  formatted_date,
  formatted_time,
  service_name
}: BookingReminderProps): JSX.Element {
  return (
    <EmailLayout
      preview={`Υπενθύμιση κράτησης για ${service_name} στο ${business_name}.`}
    >
            <Heading className="m-0 text-2xl font-semibold leading-tight text-slate-900">
              Η κράτησή σου πλησιάζει
            </Heading>
            <Text className="mt-4 text-base leading-relaxed text-slate-700">
              Γεια σου {customer_name},
            </Text>
            <Text className="mt-2 text-base leading-relaxed text-slate-700">
              Σου θυμίζουμε την κράτηση για {service_name} στο {business_name}.
            </Text>
            <Section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Text className="m-0 text-sm text-slate-500">Επιχείρηση</Text>
              <Text className="mb-3 mt-1 text-base font-semibold text-slate-900">
                {business_name}
              </Text>
              <Text className="m-0 text-sm text-slate-500">Υπηρεσία</Text>
              <Text className="mb-3 mt-1 text-base font-semibold text-slate-900">
                {service_name}
              </Text>
              <Text className="m-0 text-sm text-slate-500">Ημέρα και ώρα</Text>
              <Text className="m-0 mt-1 text-base font-semibold text-slate-900">
                {formatted_date}, {formatted_time}
              </Text>
            </Section>
            {business_maps_url ? (
              <Button
                className="mt-5 rounded-xl bg-indigo-500 px-5 py-3 text-center text-base font-medium text-white"
                href={business_maps_url}
              >
                Άνοιγμα χάρτη
              </Button>
            ) : null}
            <Text className="mt-5 text-sm leading-relaxed text-slate-500">
              Αν χρειάζεται αλλαγή ώρας, επικοινώνησε με την επιχείρηση
              {business_phone ? ` στο ${business_phone}` : ""}
              {business_email ? ` ή στο ${business_email}` : ""}.
            </Text>
            <Text className="mb-0 mt-5 text-base text-slate-700">
              Η ομάδα του Radevu
            </Text>
    </EmailLayout>
  );
}
