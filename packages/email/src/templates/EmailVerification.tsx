import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text
} from "@react-email/components";

export type EmailVerificationProps = {
  name: string;
  verification_url: string;
};

export function EmailVerification({
  name,
  verification_url
}: EmailVerificationProps): JSX.Element {
  return (
    <Html lang="el">
      <Head />
      <Preview>Επιβεβαίωση email στο Radevu</Preview>
      <Body>
        <Container>
          <Heading>Επιβεβαίωσε το email σου</Heading>
          <Text>Γεια σου {name},</Text>
          <Text>
            Πάτησε το κουμπί για να επιβεβαιώσεις τον λογαριασμό σου στο Radevu.
          </Text>
          <Button href={verification_url}>Επιβεβαίωση email</Button>
          <Text>
            Αν δεν ζήτησες εσύ αυτό το email, μπορείς να το αγνοήσεις.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
