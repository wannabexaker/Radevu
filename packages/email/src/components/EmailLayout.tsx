import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text
} from "@react-email/components";

type EmailLayoutChild = JSX.Element | false | null;

type EmailLayoutProps = {
  children: EmailLayoutChild | EmailLayoutChild[];
  preview: string;
};

/**
 * Provides the shared Radevu frame for every transactional email.
 */
export function EmailLayout({
  children,
  preview
}: EmailLayoutProps): JSX.Element {
  return (
    <Html lang="el">
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="m-0 bg-slate-100 px-4 py-8 font-sans text-base text-slate-800">
          <Container className="mx-auto max-w-[520px]">
            <Section className="mb-4 border-l-4 border-indigo-500 pl-4">
              <Text className="m-0 text-2xl font-bold leading-tight text-slate-950">
                Radevu
              </Text>
              <Text className="mb-0 mt-1 text-sm font-medium text-indigo-700">
                Διαδικτυακά ραντεβού
              </Text>
            </Section>

            <Section className="rounded-xl border border-slate-200 bg-white p-6">
              {children}
            </Section>

            <Text className="mb-0 mt-5 text-center text-sm text-slate-500">
              Radevu · Διαδικτυακά ραντεβού
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
