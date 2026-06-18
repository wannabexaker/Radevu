import {
  Button,
  Heading,
  Text
} from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout.js";

export type ResetPasswordProps = {
  name: string;
  reset_url: string;
};

export function ResetPassword({
  name,
  reset_url
}: ResetPasswordProps): JSX.Element {
  return (
    <EmailLayout preview="Αλλαγή κωδικού στο Radevu">
      <Heading className="m-0 text-2xl font-semibold leading-tight text-slate-900">
        Αλλαγή κωδικού
      </Heading>
      <Text className="mt-4 text-base leading-relaxed text-slate-700">
        Γεια σου {name},
      </Text>
      <Text className="mt-2 text-base leading-relaxed text-slate-700">
        Πάτησε το κουμπί για να ορίσεις νέο κωδικό στον λογαριασμό σου στο
        Radevu.
      </Text>
      <Button
        className="mt-4 rounded-xl bg-indigo-500 px-5 py-3 text-center text-base font-medium text-white"
        href={reset_url}
      >
        Ορισμός νέου κωδικού
      </Button>
      <Text className="mb-0 mt-5 text-sm leading-relaxed text-slate-500">
        Αν δεν ζήτησες εσύ αλλαγή κωδικού, μπορείς να αγνοήσεις αυτό το Email.
      </Text>
    </EmailLayout>
  );
}
