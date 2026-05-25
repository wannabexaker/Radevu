import Link from "next/link";

export default function NotFound(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col justify-center px-4 py-10">
      <section className="mx-auto flex max-w-screen-sm flex-col gap-4">
        <p className="text-sm font-semibold uppercase text-indigo-500">
          404
        </p>
        <h1 className="text-3xl font-bold text-neutral-950">
          Η σελίδα δεν βρέθηκε
        </h1>
        <p className="text-base leading-7 text-neutral-700">
          Ο σύνδεσμος που άνοιξες δεν αντιστοιχεί σε διαθέσιμη σελίδα.
        </p>
        <Link
          className="flex min-h-11 w-full items-center justify-center rounded-md bg-neutral-950 px-4 py-3 text-center text-base font-semibold text-white active:bg-neutral-800"
          href="/"
        >
          Επιστροφή στην αρχική
        </Link>
      </section>
    </main>
  );
}
