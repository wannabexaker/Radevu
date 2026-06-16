"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BookingFlow,
  type BookingBusiness,
  type BookingPrefill,
  type BookingService
} from "./BookingFlow";

type BookingModalProps = {
  business: BookingBusiness;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  prefill?: BookingPrefill | null;
  services: BookingService[];
};

export function BookingModal({
  business,
  onOpenChange,
  open,
  prefill,
  services
}: BookingModalProps): JSX.Element {
  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/40" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-md">
          <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 px-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                {business.name}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-500">
                Online κράτηση
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button aria-label="Κλείσιμο" size="icon" type="button" variant="ghost">
                <X aria-hidden="true" className="h-5 w-5" />
              </Button>
            </Dialog.Close>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <BookingFlow
              business={business}
              onClose={() => onOpenChange(false)}
              prefill={prefill}
              services={services}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
