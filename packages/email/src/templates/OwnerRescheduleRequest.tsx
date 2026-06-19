import { Button, Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout.js";

export type OwnerRescheduleRequestProps = {
  customer_name: string;
  dashboard_url: string;
  formatted_current: string;
  formatted_requested: string;
  service_name: string;
};

export function OwnerRescheduleRequest({
  customer_name,
  dashboard_url,
  formatted_current,
  formatted_requested,
  service_name
}: OwnerRescheduleRequestProps): JSX.Element {
  return (
    <EmailLayout preview={`Αίτημα αλλαγής ώρας από ${customer_name}.`}>
      <Heading className="m-0 text-2xl font-semibold text-slate-900">
        Αίτημα αλλαγής ώρας
      </Heading>
      <Text className="mt-4 text-base leading-relaxed text-slate-700">
        Ο/η {customer_name} ζήτησε νέα ώρα για {service_name}.
      </Text>
      <Section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <Text className="m-0 text-sm text-slate-500">Τρέχουσα ώρα</Text>
        <Text className="mb-3 mt-1 font-semibold text-slate-900">{formatted_current}</Text>
        <Text className="m-0 text-sm text-slate-500">Προτεινόμενη ώρα</Text>
        <Text className="m-0 mt-1 font-semibold text-slate-900">{formatted_requested}</Text>
      </Section>
      <Button className="mt-5 rounded-xl bg-indigo-500 px-5 py-3 text-white" href={dashboard_url}>
        Έγκριση ή απόρριψη
      </Button>
    </EmailLayout>
  );
}
