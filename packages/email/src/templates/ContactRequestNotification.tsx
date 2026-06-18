import {
  Heading,
  Hr,
  Text
} from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout.js";

export type ContactRequestNotificationProps = {
  email: string;
  message: string;
  name: string;
  phone?: string;
};

/**
 * Renders the founder notification email for landing contact requests.
 *
 * @param props - Contact request fields submitted from the landing page.
 * @returns A plain React Email document.
 */
export function ContactRequestNotification({
  email,
  message,
  name,
  phone
}: ContactRequestNotificationProps): JSX.Element {
  return (
    <EmailLayout preview={`Νέο αίτημα επικοινωνίας από ${name}`}>
      <Heading className="m-0 text-2xl font-semibold leading-tight text-slate-900">
        Νέο αίτημα επικοινωνίας
      </Heading>
      <Text className="mt-4 text-base leading-relaxed text-slate-700">
        Ο/η {name} έστειλε μήνυμα από τη σελίδα του Radevu.
      </Text>
      <Hr className="my-5 border-slate-200" />
      <Text className="my-2 text-base text-slate-700">
        <strong>Όνομα:</strong> {name}
      </Text>
      <Text className="my-2 text-base text-slate-700">
        <strong>Email:</strong> {email}
      </Text>
      <Text className="my-2 text-base text-slate-700">
        <strong>Τηλέφωνο:</strong> {phone ?? "Δεν δόθηκε"}
      </Text>
      <Hr className="my-5 border-slate-200" />
      <Text className="my-2 text-sm font-semibold text-slate-500">
        Μήνυμα
      </Text>
      <Text className="mb-0 mt-2 text-base leading-relaxed text-slate-800">
        {message}
      </Text>
    </EmailLayout>
  );
}
