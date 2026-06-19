"use client";

import { createAuthClient } from "better-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const authClient = createAuthClient();

type CompletionState = "signing-out" | "error";

export default function ChangeEmailCompletePage(): JSX.Element {
  const started = useRef(false);
  const [state, setState] = useState<CompletionState>("signing-out");
  const [message, setMessage] = useState(
    "Η αλλαγή ολοκληρώθηκε. Σε αποσυνδέουμε με ασφάλεια..."
  );

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;
    const callbackError = new URLSearchParams(window.location.search).get(
      "error"
    );

    if (callbackError) {
      setState("error");
      setMessage(
        "Ο σύνδεσμος δεν είναι έγκυρος ή άνοιξε χωρίς την ενεργή συνεδρία που ζήτησε την αλλαγή."
      );
      return;
    }

    void authClient
      .signOut()
      .then((result) => {
        if (result.error) {
          setState("error");
          setMessage(
            "Η αλλαγή έγινε, αλλά η αποσύνδεση απέτυχε. Δοκίμασε ξανά."
          );
          return;
        }

        window.location.replace("/login?email_changed=1");
      })
      .catch(() => {
        setState("error");
        setMessage(
          "Η αλλαγή έγινε, αλλά η αποσύνδεση απέτυχε. Δοκίμασε ξανά."
        );
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-8">
      <section className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase text-indigo-500">Radevu</p>
        <h1 className="text-2xl font-semibold text-slate-950">
          Αλλαγή email σύνδεσης
        </h1>
        <p aria-live="polite" className="text-sm leading-6 text-slate-600">
          {message}
        </p>
        {state === "error" ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white"
            href="/login"
          >
            Επιστροφή
          </Link>
        ) : null}
      </section>
    </main>
  );
}
