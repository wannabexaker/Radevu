import { ChevronRight } from "lucide-react";
import Link from "next/link";

type LegalLayoutProps = {
  children: React.ReactNode;
  otherDocumentHref: string;
  otherDocumentLabel: string;
  title: string;
  updatedAt: string;
};

/**
 * Shared chrome for the legal documents.
 *
 * Wider than the app shell on purpose: legal prose is unreadable at the 360px
 * card width used elsewhere, so this caps at a comfortable measure instead.
 *
 * @param props - Document title, version date, and a link to the sibling doc.
 * @returns The legal page wrapper.
 */
export function LegalLayout({
  children,
  otherDocumentHref,
  otherDocumentLabel,
  title,
  updatedAt
}: LegalLayoutProps): JSX.Element {
  return (
    <main className="min-h-screen bg-white px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-sm text-slate-500">
            <li>
              <Link className="inline-flex min-h-11 items-center" href="/">
                Αρχική
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-4 w-4" />
            </li>
            <li className="font-medium text-slate-900">{title}</li>
          </ol>
        </nav>

        <header className="flex flex-col gap-2 border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-bold leading-tight text-slate-900">
            {title}
          </h1>
          <p className="text-sm text-slate-500">
            Τελευταία ενημέρωση: {updatedAt}
          </p>
        </header>

        <article className="flex flex-col gap-7 pb-10">{children}</article>

        <footer className="border-t border-slate-200 pt-5">
          <Link
            className="inline-flex min-h-11 items-center text-sm font-medium text-indigo-700"
            href={otherDocumentHref}
          >
            {otherDocumentLabel}
          </Link>
        </footer>
      </div>
    </main>
  );
}

type LegalSectionProps = {
  children: React.ReactNode;
  id: string;
  title: string;
};

/**
 * A numbered-heading section inside a legal document.
 *
 * @param props - Section anchor id, heading, and body.
 * @returns The section element.
 */
export function LegalSection({
  children,
  id,
  title
}: LegalSectionProps): JSX.Element {
  return (
    <section className="flex flex-col gap-3" id={id}>
      <h2 className="text-xl font-semibold leading-snug text-slate-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

type LegalParagraphProps = {
  children: React.ReactNode;
};

/**
 * Body copy with the reading-friendly line height used across the documents.
 *
 * @param props - Paragraph content.
 * @returns The paragraph element.
 */
export function LegalParagraph({ children }: LegalParagraphProps): JSX.Element {
  return <p className="text-base leading-7 text-slate-700">{children}</p>;
}

type LegalListProps = {
  items: React.ReactNode[];
};

/**
 * Bulleted list matching the paragraph rhythm.
 *
 * @param props - List items.
 * @returns The list element.
 */
export function LegalList({ items }: LegalListProps): JSX.Element {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 text-base leading-7 text-slate-700">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
