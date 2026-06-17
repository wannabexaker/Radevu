import Link from "next/link";
import { verifyEmailToken } from "@/lib/email-verification";

export const dynamic = "force-dynamic";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    email?: string;
    token?: string;
  }>;
};

export default async function VerifyEmailPage({
  searchParams
}: VerifyEmailPageProps): Promise<JSX.Element> {
  const { email, token } = await searchParams;
  const result =
    email && token ? await verifyEmailToken({ email, token }) : null;

  const title =
    result?.ok === true
      ? "Το Email επιβεβαιώθηκε"
      : result?.reason === "expired"
        ? "Ο σύνδεσμος έληξε"
        : "Επιβεβαίωση Email";

  const body =
    result?.ok === true
      ? "Ο λογαριασμός σου είναι πλέον επιβεβαιωμένος."
      : result?.reason === "expired"
        ? "Ζήτησε νέο Email επιβεβαίωσης από τη σελίδα σύνδεσης."
        : "Άνοιξε τον σύνδεσμο που έλαβες στο Email σου.";

  return (
    <main className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-8">
      <section className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-indigo-500">
          Radevu
        </p>
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="text-base leading-7 text-slate-600">{body}</p>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white"
          href="/login"
        >
          Σύνδεση
        </Link>
      </section>
    </main>
  );
}
