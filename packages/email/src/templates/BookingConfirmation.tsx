import {
  Button,
  Heading,
  Section,
  Text
} from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout.js";

export type BookingConfirmationProps = {
  business_email?: string;
  business_maps_url?: string;
  business_name: string;
  business_phone?: string;
  cancel_url?: string;
  customer_name: string;
  duration_minutes: number;
  formatted_date: string;
  formatted_price: string;
  formatted_time: string;
  manage_url?: string;
  note?: string;
  reschedule_url?: string;
  service_name: string;
};

/**
 * Renders the customer confirmation email for a completed booking.
 *
 * @param props - Appointment details formatted by the caller.
 * @returns A React Email document.
 */
export function BookingConfirmation({
  business_email,
  business_maps_url,
  business_name,
  business_phone,
  cancel_url,
  customer_name,
  duration_minutes,
  formatted_date,
  formatted_price,
  formatted_time,
  manage_url,
  note,
  reschedule_url,
  service_name
}: BookingConfirmationProps): JSX.Element {
  return (
    <EmailLayout
      preview={`Επιβεβαίωση κράτησης για ${service_name} στο ${business_name}.`}
    >
            <Heading className="m-0 text-2xl font-semibold leading-tight text-slate-900">
              Έγινε η κράτηση!
            </Heading>
            <Text className="mt-4 text-base leading-relaxed text-slate-700">
              Γεια σου {customer_name},
            </Text>
            <Text className="mt-2 text-base leading-relaxed text-slate-700">
              Η κράτηση για {service_name} στο {business_name} καταχωρήθηκε.
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
              <Text className="mb-3 mt-1 text-base font-semibold text-slate-900">
                {formatted_date}, {formatted_time}
              </Text>
              <Text className="m-0 text-sm text-slate-500">Διάρκεια</Text>
              <Text className="mb-3 mt-1 text-base font-semibold text-slate-900">
                {duration_minutes} λεπτά
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
            <Text className="mt-5 text-base leading-relaxed text-slate-700">
              Θα βρεις την πρόσκληση ημερολογίου συνημμένη στο Email.
            </Text>
            {manage_url ? (
              <Button
                className="mt-2 rounded-xl bg-indigo-500 px-5 py-3 text-center text-base font-medium text-white"
                href={manage_url}
              >
                Σημειώσεις και μηνύματα
              </Button>
            ) : null}
            {reschedule_url ? (
              <Button
                className="mt-2 rounded-xl bg-indigo-500 px-5 py-3 text-center text-base font-medium text-white"
                href={reschedule_url}
              >
                Αλλαγή ώρας
              </Button>
            ) : null}
            {cancel_url ? (
              <Button
                className="mt-2 rounded-xl border border-red-300 bg-white px-5 py-3 text-center text-base font-medium text-red-700"
                href={cancel_url}
              >
                Ακύρωση
              </Button>
            ) : null}
            {business_maps_url ? (
              <Button
                className="mt-2 rounded-xl bg-indigo-500 px-5 py-3 text-center text-base font-medium text-white"
                href={business_maps_url}
              >
                Άνοιγμα χάρτη
              </Button>
            ) : null}
            <Text className="mt-5 text-sm leading-relaxed text-slate-500">
              Αν χρειάζεσαι βοήθεια, επικοινώνησε απευθείας με την επιχείρηση
              {business_phone ? ` στο ${business_phone}` : ""}
              {business_email ? ` ή στο ${business_email}` : ""}.
            </Text>
            <Text className="mb-0 mt-5 text-base text-slate-700">
              Η ομάδα του Radevu
            </Text>
    </EmailLayout>
  );
}
