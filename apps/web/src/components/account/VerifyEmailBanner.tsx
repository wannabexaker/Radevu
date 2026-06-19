"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type AccountEmail = {
  email: string;
  emailVerified: boolean;
};

type SendState = "idle" | "sending" | "sent" | "error";

type MeResponse = {
  user?: {
    email?: string;
    email_verified?: boolean;
  };
};

export function VerifyEmailBanner(): JSX.Element | null {
  const [accountEmail, setAccountEmail] = useState<AccountEmail | null>(null);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [message, setMessage] = useState<string>("");

  const refreshAccountEmail = useCallback(
    async (): Promise<AccountEmail | null> => {
      const response = await fetch("/api/v1/me", {
        cache: "no-store",
        credentials: "include"
      });

      if (!response.ok) {
        setAccountEmail(null);
        return null;
      }

      const body = (await response.json()) as MeResponse;
      const email = body.user?.email;

      if (!email) {
        setAccountEmail(null);
        return null;
      }

      const nextAccountEmail = {
        email,
        emailVerified: body.user?.email_verified === true
      };

      setAccountEmail(nextAccountEmail);
      return nextAccountEmail;
    },
    []
  );

  useEffect(() => {
    void refreshAccountEmail();

    function refreshOnFocus(): void {
      void refreshAccountEmail();
    }

    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [refreshAccountEmail]);

  async function resendVerification(): Promise<void> {
    setSendState("sending");
    setMessage("");

    try {
      const currentAccount = await refreshAccountEmail();

      if (!currentAccount || currentAccount.emailVerified) {
        setSendState("idle");
        return;
      }

      const response = await fetch("/api/v1/me/verification/resend", {
        method: "POST"
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(
          body?.error?.message ?? "Δεν μπορέσαμε να στείλουμε το Email."
        );
      }

      setSendState("sent");
      setMessage("Στάλθηκε ✓");
    } catch (error) {
      setSendState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Δεν μπορέσαμε να στείλουμε το Email."
      );
    }
  }

  const isSending = sendState === "sending";

  if (!accountEmail || accountEmail.emailVerified) {
    return null;
  }

  return (
    <section className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Επιβεβαίωση Email</p>
          <p className="text-sm leading-6">
            Επιβεβαίωσε το Email σύνδεσης ({accountEmail.email}) για να
            ενεργοποιήσεις όλες τις λειτουργίες.
          </p>
          {message ? (
            <p
              aria-live="polite"
              className={
                sendState === "error"
                  ? "text-sm font-medium text-red-700"
                  : "text-sm font-medium text-amber-950"
              }
            >
              {message}
            </p>
          ) : null}
        </div>
        <Button
          className="w-full border-amber-400 bg-white text-amber-950 hover:bg-amber-100 sm:w-auto"
          disabled={isSending || !accountEmail}
          onClick={resendVerification}
          type="button"
          variant="outline"
        >
          {isSending ? "Στέλνεται..." : "Στείλε ξανά"}
        </Button>
      </div>
    </section>
  );
}
