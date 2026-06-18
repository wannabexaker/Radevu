import {
  Button,
  Heading,
  Text
} from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout.js";

export type EmailVerificationProps = {
  name: string;
  verification_url: string;
};

export function EmailVerification({
  name,
  verification_url
}: EmailVerificationProps): JSX.Element {
  return (
    <EmailLayout preview="Επιβεβαίωση Email στο Radevu">
      <Heading className="m-0 text-2xl font-semibold leading-tight text-slate-900">
        Επιβεβαίωσε το Email σου
      </Heading>
      <Text className="mt-4 text-base leading-relaxed text-slate-700">
        Γεια σου {name},
      </Text>
      <Text className="mt-2 text-base leading-relaxed text-slate-700">
        Πάτησε το κουμπί για να επιβεβαιώσεις τον λογαριασμό σου στο Radevu.
      </Text>
      <Button
        className="mt-4 rounded-xl bg-indigo-500 px-5 py-3 text-center text-base font-medium text-white"
        href={verification_url}
      >
        Επιβεβαίωση Email
      </Button>
      <Text className="mb-0 mt-5 text-sm leading-relaxed text-slate-500">
        Αν δεν ζήτησες εσύ αυτό το Email, μπορείς να το αγνοήσεις.
      </Text>
    </EmailLayout>
  );
}
