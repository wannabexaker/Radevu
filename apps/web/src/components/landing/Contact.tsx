"use client";

import { Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ContactStatus = "idle" | "success" | "error";

function trimToUndefined(value: string): string | undefined {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

/**
 * Renders the landing contact form and posts contact requests to the API.
 *
 * @returns The primary contact section.
 */
export function Contact(): JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setStatus("idle");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/contact-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: trimToUndefined(phone),
          message: message.trim()
        })
      });

      if (!response.ok) {
        console.error("Landing contact request returned an error", {
          status: response.status
        });
        setStatus("error");
        return;
      }

      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setStatus("success");
    } catch (error) {
      console.error("Landing contact request failed", { error });
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="px-4 py-12 md:px-8 md:py-20" id="contact">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase text-indigo-500">
            Επικοινωνία
          </p>
          <h2 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
            Θέλεις να δοκιμάσεις το Radevu;
          </h2>
          <p className="text-base leading-relaxed text-slate-600">
            Στείλε μήνυμα και θα μιλήσουμε απλά. Αν ταιριάζει στην επιχείρησή
            σου, το στήνουμε μαζί.
          </p>
        </div>

        <form
          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-name">Όνομα</Label>
              <Input
                autoComplete="name"
                id="contact-name"
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                autoComplete="email"
                id="contact-email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-phone">Τηλέφωνο</Label>
            <Input
              autoComplete="tel"
              id="contact-phone"
              minLength={5}
              onChange={(event) => setPhone(event.target.value)}
              type="tel"
              value={phone}
            />
            <p className="text-sm text-slate-500">Προαιρετικό.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-message">Μήνυμα</Label>
            <Textarea
              id="contact-message"
              maxLength={2000}
              minLength={10}
              onChange={(event) => setMessage(event.target.value)}
              required
              value={message}
            />
          </div>

          {status === "success" ? (
            <p
              aria-live="polite"
              className="rounded-md border border-emerald-500 bg-emerald-50 px-3 py-2 text-sm text-slate-800"
            >
              Το μήνυμα στάλθηκε. Θα επικοινωνήσω μαζί σου σύντομα.
            </p>
          ) : null}

          {status === "error" ? (
            <p
              aria-live="polite"
              className="rounded-md border border-red-500 bg-red-50 px-3 py-2 text-sm text-slate-800"
            >
              Δοκίμασε ξανά.
            </p>
          ) : null}

          <Button disabled={isSubmitting} type="submit">
            <Send aria-hidden="true" className="h-5 w-5" />
            {isSubmitting ? "Αποστολή..." : "Αποστολή"}
          </Button>
        </form>
      </div>
    </section>
  );
}
