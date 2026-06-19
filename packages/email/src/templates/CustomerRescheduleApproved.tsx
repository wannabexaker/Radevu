import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout.js";

export type CustomerRescheduleApprovedProps = {
  business_name: string;
  customer_name: string;
  formatted_date_time: string;
  service_name: string;
};

export function CustomerRescheduleApproved({
  business_name,
  customer_name,
  formatted_date_time,
  service_name
}: CustomerRescheduleApprovedProps): JSX.Element {
  return (
    <EmailLayout preview={`Η νέα ώρα για ${service_name} εγκρίθηκε.`}>
      <Heading className="m-0 text-2xl font-semibold text-slate-900">
        Η αλλαγή ώρας εγκρίθηκε
      </Heading>
      <Text className="mt-4 text-base leading-relaxed text-slate-700">
        Γεια σου {customer_name}, το {business_name} επιβεβαίωσε τη νέα ώρα για {service_name}.
      </Text>
      <Section className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <Text className="m-0 text-sm text-slate-500">Νέα ημέρα και ώρα</Text>
        <Text className="m-0 mt-1 font-semibold text-slate-900">{formatted_date_time}</Text>
      </Section>
    </EmailLayout>
  );
}
