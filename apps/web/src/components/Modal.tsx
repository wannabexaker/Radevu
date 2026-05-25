"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

/**
 * Renders an accessible centered dialog using the Radevu modal tokens.
 *
 * @param props - Controlled dialog props and modal content.
 * @returns A Radix Dialog wrapper.
 */
export function Modal({
  children,
  onOpenChange,
  open,
  title
}: ModalProps): JSX.Element {
  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl bg-white p-6 shadow-md focus:outline-none">
          <div className="mb-4 flex items-start justify-between gap-4">
            <Dialog.Title className="text-2xl font-semibold leading-tight text-slate-900">
              {title}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Κλείσιμο"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              type="button"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">{title}</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
