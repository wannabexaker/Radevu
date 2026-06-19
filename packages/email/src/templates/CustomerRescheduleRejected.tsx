import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout.js";

export type CustomerRescheduleRejectedProps = {
  business_name: string;
  customer_name: string;
  formatted_date_time: string;
  service_name: string;
};

export function CustomerRescheduleRejected({
  business_name,
  customer_name,
  formatted_date_time,
  service_name
}: CustomerRescheduleRejectedProps): JSX.Element {
  return (
    <EmailLayout preview={`Το αίτημα αλλαγής ώρας δεν εγκρίθηκε.`}>
      <Heading className="m-0 text-2xl font-semibold text-slate-900">
        Το αίτημα δεν εγκρίθηκε
      </Heading>
      <Text className="mt-4 text-base leading-relaxed text-slate-700">
        Γεια σου {customer_name}, το {business_name} δεν μπόρεσε να εγκρίνει τη νέα ώρα για {service_name}.
      </Text>
      <Section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Text className="m-0 text-sm text-slate-500">Το ραντεβού παραμένει</Text>
        <Text className="m-0 mt-1 font-semibold text-slate-900">{formatted_date_time}</Text>
      </Section>
    </EmailLayout>
  );
}
