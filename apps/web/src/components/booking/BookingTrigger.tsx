"use client";

import { CalendarCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookingModal } from "./BookingModal";
import type { BookingBusiness, BookingService } from "./BookingFlow";

type BookingTriggerProps = {
  business: BookingBusiness;
  services: BookingService[];
};

export function BookingTrigger({
  business,
  services
}: BookingTriggerProps): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-4">
        <div className="mx-auto max-w-md">
          <Button
            className="h-14 w-full shadow-md"
            data-testid="booking-trigger"
            disabled={services.length === 0}
            onClick={() => setOpen(true)}
            size="lg"
            type="button"
          >
            <CalendarCheck aria-hidden="true" className="h-5 w-5" />
            Κράτησε ραντεβού
          </Button>
        </div>
      </div>
      {open ? (
        <BookingModal
          business={business}
          onOpenChange={setOpen}
          open={open}
          services={services}
        />
      ) : null}
    </>
  );
}
