import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Renders a shadcn-style input with a 44px mobile touch target.
 *
 * @param props - Native input props and optional className.
 * @returns A styled input element.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      className={cn(
        "flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-base text-slate-900 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 md:text-sm",
        className
      )}
      ref={ref}
      type={type}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
