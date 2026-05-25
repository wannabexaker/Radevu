import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";
import { cn } from "@/lib/utils";

export type LabelProps = React.ComponentPropsWithoutRef<
  typeof LabelPrimitive.Root
>;

/**
 * Renders an accessible label with Radevu form typography.
 *
 * @param props - Radix label props and optional className.
 * @returns A styled label element.
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    className={cn(
      "text-sm font-medium leading-none text-slate-800 peer-disabled:cursor-not-allowed peer-disabled:text-slate-500",
      className
    )}
    ref={ref}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
