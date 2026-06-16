import { ResetPasswordForm } from "./ResetPasswordForm";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams
}: ResetPasswordPageProps): Promise<JSX.Element> {
  const { token } = await searchParams;

  return <ResetPasswordForm token={token ?? ""} />;
}
