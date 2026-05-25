"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";
import { cn } from "@/lib/utils";

export type SwitchProps = React.ComponentPropsWithoutRef<
  typeof SwitchPrimitive.Root
>;

/**
 * Renders an accessible switch with Radevu touch target sizing.
 *
 * @param props - Radix switch props and optional className.
 * @returns A styled switch control.
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      "peer inline-flex h-11 w-[68px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 data-[state=checked]:bg-primary",
      className
    )}
    ref={ref}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block h-8 w-8 rounded-full bg-white shadow-md transition-transform data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-1" />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
