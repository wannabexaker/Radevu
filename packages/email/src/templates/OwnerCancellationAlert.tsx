import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout.js";

export type OwnerCancellationAlertProps = {
  business_name: string;
  customer_name: string;
  dashboard_url: string;
  formatted_date_time: string;
  reason: string;
  service_name: string;
};

export function OwnerCancellationAlert({
  business_name,
  customer_name,
  dashboard_url,
  formatted_date_time,
  reason,
  service_name
}: OwnerCancellationAlertProps): JSX.Element {
  return (
    <EmailLayout preview={`Ακύρωση ραντεβού από ${customer_name}.`}>
      <Heading className="m-0 text-2xl font-semibold text-slate-900">
        Ακύρωση ραντεβού
      </Heading>
      <Text className="mt-4 text-base leading-relaxed text-slate-700">
        Ο/η {customer_name} ακύρωσε το ραντεβού για {service_name} στο {business_name}.
      </Text>
      <Section className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
        <Text className="m-0 text-sm text-slate-500">Αρχική ώρα</Text>
        <Text className="mb-3 mt-1 font-semibold text-slate-900">{formatted_date_time}</Text>
        <Text className="m-0 text-sm text-slate-500">Λόγος ακύρωσης</Text>
        <Text className="m-0 mt-1 text-base text-slate-900">{reason}</Text>
      </Section>
      <Button className="mt-5 rounded-xl bg-indigo-500 px-5 py-3 text-white" href={dashboard_url}>
        Άνοιγμα κρατήσεων
      </Button>
    </EmailLayout>
  );
}
