"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type VerifyEmailBannerProps = {
  email: string;
};

type SendState = "idle" | "sending" | "sent" | "error";

export function VerifyEmailBanner({
  email
}: VerifyEmailBannerProps): JSX.Element {
  const [sendState, setSendState] = useState<SendState>("idle");
  const [message, setMessage] = useState<string>("");

  async function resendVerification(): Promise<void> {
    setSendState("sending");
    setMessage("");

    try {
      const response = await fetch("/api/v1/me/verification/resend", {
        method: "POST"
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(
          body?.error?.message ?? "Δεν μπορέσαμε να στείλουμε το email."
        );
      }

      setSendState("sent");
      setMessage("Στάλθηκε ✓");
    } catch (error) {
      setSendState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Δεν μπορέσαμε να στείλουμε το email."
      );
    }
  }

  const isSending = sendState === "sending";

  return (
    <section className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Επιβεβαίωση email</p>
          <p className="text-sm leading-6">
            Επιβεβαίωσε το email σου ({email}) για να ενεργοποιήσεις όλες τις
            λειτουργίες.
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
          disabled={isSending}
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
