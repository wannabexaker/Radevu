"use client";

import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type IconButtonVariant = "default" | "danger";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  variant?: IconButtonVariant;
};

/**
 * Renders a square 44px touch target for icon-only actions.
 *
 * @param props - Button props plus icon, label, and variant.
 * @returns An accessible icon button.
 */
export function IconButton({
  className,
  icon: Icon,
  label,
  type = "button",
  variant = "default",
  ...props
}: IconButtonProps): JSX.Element {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500",
        variant === "danger"
          ? "text-slate-500 hover:bg-slate-100 hover:text-red-500 active:bg-slate-100"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:bg-slate-100",
        className
      )}
      type={type}
      {...props}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
