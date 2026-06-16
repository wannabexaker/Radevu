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

export type ResetPasswordProps = {
  name: string;
  reset_url: string;
};

export function ResetPassword({
  name,
  reset_url
}: ResetPasswordProps): JSX.Element {
  return (
    <Html lang="el">
      <Head />
      <Preview>Αλλαγή κωδικού στο Radevu</Preview>
      <Body>
        <Container>
          <Heading>Αλλαγή κωδικού</Heading>
          <Text>Γεια σου {name},</Text>
          <Text>
            Πάτησε το κουμπί για να ορίσεις νέο κωδικό στον λογαριασμό σου στο
            Radevu.
          </Text>
          <Button href={reset_url}>Ορισμός νέου κωδικού</Button>
          <Text>
            Αν δεν ζήτησες εσύ αλλαγή κωδικού, μπορείς να αγνοήσεις αυτό το
            email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
