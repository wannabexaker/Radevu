import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional class names and resolves conflicting Tailwind utilities.
 *
 * @param inputs - Class values accepted by clsx.
 * @returns A merged className string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
