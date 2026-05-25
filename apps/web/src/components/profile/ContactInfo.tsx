import { Mail, Phone } from "lucide-react";

type ContactInfoProps = {
  email: string | null;
  phone: string | null;
};

export function ContactInfo({ email, phone }: ContactInfoProps): JSX.Element | null {
  if (!email && !phone) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Επικοινωνία</h2>
      <div className="mt-4 flex flex-col gap-3">
        {phone ? (
          <a
            className="inline-flex min-h-11 items-center gap-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            href={`tel:${phone}`}
          >
            <Phone aria-hidden="true" className="h-5 w-5 text-indigo-500" />
            <span className="text-base font-medium">{phone}</span>
          </a>
        ) : null}
        {email ? (
          <a
            className="inline-flex min-h-11 items-center gap-3 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            href={`mailto:${email}`}
          >
            <Mail aria-hidden="true" className="h-5 w-5 text-indigo-500" />
            <span className="break-all text-base font-medium">{email}</span>
          </a>
        ) : null}
      </div>
    </section>
  );
}
