"use client";

import { ArrowRight, CalendarDays, CheckCircle2 } from "lucide-react";
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
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <h1 className="text-5xl font-bold leading-tight text-slate-900 md:text-7xl">
              Online ραντεβού για μικρές επιχειρήσεις.
            </h1>
          </MotionDiv>

          <MotionDiv
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 18 }}
            transition={{ delay: 0.12, duration: 0.45, ease: "easeOut" }}
          >
            <p className="max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
              Δώσε στους πελάτες σου ένα link. Κρατάνε μόνοι τους, εσύ
              βλέπεις τη μέρα σου από το κινητό. Χωρίς χαρτιά, χωρίς
              τηλέφωνα.
            </p>
          </MotionDiv>

          <MotionDiv
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 16 }}
            transition={{ delay: 0.24, duration: 0.45, ease: "easeOut" }}
          >
            <Button asChild size="lg">
              <a href="#contact">
                Επικοινώνησε μαζί μου
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </a>
            </Button>
          </MotionDiv>
        </div>

        <div className="relative min-h-[420px]">
          <div className="absolute left-8 top-2 h-64 w-64 animate-blob rounded-full bg-gradient-to-br from-blue-400 to-violet-400 opacity-60" />
          <div className="relative mx-auto flex max-w-sm flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo shape="triangle" size="lg" />
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Σήμερα
                  </p>
                  <p className="text-xl font-semibold text-slate-900">
                    Test Shop
                  </p>
                </div>
              </div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                <CalendarDays aria-hidden="true" className="h-5 w-5" />
              </span>
            </div>

            <div className="grid gap-3">
              {[
                ["10:00", "Ανδρικό κούρεμα", "30 λεπτά"],
                ["11:30", "Καθαρισμός", "45 λεπτά"],
                ["13:00", "Δοκιμαστικό μάθημα", "20 λεπτά"]
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
