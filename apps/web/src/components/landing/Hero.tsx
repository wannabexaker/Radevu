"use client";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Gift,
  Search
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { MotionDiv } from "./MotionWrapper";

/**
 * Renders the animated landing hero and primary contact CTA.
 *
 * @returns The marketing hero section.
 */
export function Hero(): JSX.Element {
  return (
    <section className="overflow-hidden px-4 pb-16 pt-12 md:px-8 md:pb-20 md:pt-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_500px] lg:items-center">
        <div className="flex flex-col items-start gap-6">
          <MotionDiv
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              href="/register"
            >
              <Gift aria-hidden="true" className="h-4 w-4" />
              Δωρεάν εγγραφή
            </Link>
          </MotionDiv>

          <MotionDiv
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <h1 className="text-5xl font-bold leading-tight text-slate-900 md:text-7xl">
              Διαδικτυακά ραντεβού για μικρές επιχειρήσεις.
            </h1>
          </MotionDiv>

          <MotionDiv
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 18 }}
            transition={{ delay: 0.12, duration: 0.45, ease: "easeOut" }}
          >
            <p className="max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
              Δώσε στους πελάτες σου έναν σύνδεσμο. Κρατάνε μόνοι τους, εσύ
              βλέπεις τη μέρα σου από το κινητό. Χωρίς χαρτιά, χωρίς
              τηλέφωνα.
            </p>
          </MotionDiv>

          <MotionDiv
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 16 }}
            transition={{ delay: 0.24, duration: 0.45, ease: "easeOut" }}
          >
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Φτιάξε δωρεάν το προφίλ σου
                  <ArrowRight aria-hidden="true" className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/epaggelmaties">
                  <Search aria-hidden="true" className="h-5 w-5" />
                  Βρες επαγγελματία
                </Link>
              </Button>
            </div>
          </MotionDiv>
        </div>

        <div aria-hidden="true" className="relative min-h-[420px]">
          <div className="relative mx-auto flex max-w-sm flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo size="md" />
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Σήμερα
                  </p>
                  <p className="text-lg font-semibold leading-tight text-slate-900 sm:text-xl">
                    Αντώνης - Αυτοκίνητα &amp; Μηχανές
                  </p>
                </div>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                <CalendarDays aria-hidden="true" className="h-5 w-5" />
              </span>
            </div>

            <div className="grid gap-3">
              {[
                ["09:30", "Έλεγχος πριν την αγορά", "60 λεπτά"],
                ["11:30", "Εκτίμηση αξίας οχήματος", "30 λεπτά"],
                ["13:00", "Εύρεση ανταλλακτικών", "30 λεπτά"]
              ].map(([time, title, duration]) => (
                <div
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  key={time}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-indigo-500">
                        {time}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {duration}
                      </p>
                    </div>
                    <CheckCircle2
                      aria-hidden="true"
                      className="h-5 w-5 text-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
