import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-slate-300 disabled:text-white [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-indigo-600 active:bg-indigo-700",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-red-600 active:bg-red-700",
        outline:
          "border border-border bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-slate-200 active:bg-slate-100",
        ghost: "text-slate-700 hover:bg-slate-100 active:bg-slate-100",
        link: "min-h-0 text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "min-h-11 px-5 py-2.5",
        sm: "min-h-10 px-4 py-2",
        lg: "min-h-12 px-6 py-3",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

/**
 * Renders a shadcn-style button with Radevu touch-target sizes.
 *
 * @param props - Button attributes, variant options, and optional asChild slotting.
 * @returns A styled button or slotted child.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, className, size, variant, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ className, size, variant }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
