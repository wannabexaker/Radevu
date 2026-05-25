import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text
} from "@react-email/components";

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
    <Html lang="el">
      <Head />
      <Preview>Νέο contact request από {name}</Preview>
      <Body>
        <Container>
          <Heading>Νέο contact request</Heading>
          <Text>
            Ο/η {name} έστειλε μήνυμα από τη landing page του Radevu.
          </Text>
          <Hr />
          <Text>
            <strong>Όνομα:</strong> {name}
          </Text>
          <Text>
            <strong>Email:</strong> {email}
          </Text>
          <Text>
            <strong>Τηλέφωνο:</strong> {phone ?? "Δεν δόθηκε"}
          </Text>
          <Hr />
          <Text>
            <strong>Μήνυμα:</strong>
          </Text>
          <Text>{message}</Text>
        </Container>
      </Body>
    </Html>
  );
}
