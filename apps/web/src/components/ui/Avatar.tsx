import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  alt?: string;
  className?: string;
  name?: string | null;
  size?: AvatarSize;
  src?: string | null;
};

const sizeClass: Record<AvatarSize, string> = {
  sm: "h-11 w-11",
  md: "h-14 w-14",
  lg: "h-20 w-20"
};

const markSize: Record<AvatarSize, number> = {
  sm: 28,
  md: 36,
  lg: 52
};

/**
 * Shared branded avatar for business and customer profile surfaces.
 */
export function Avatar({
  alt,
  className,
  name,
  size = "md",
  src
}: AvatarProps): JSX.Element {
  const label = alt ?? name ?? "Εικόνα Radevu";

  if (src) {
    return (
      <img
        alt={label}
        className={cn(
          sizeClass[size],
          "shrink-0 rounded-full border border-slate-200 bg-white object-cover shadow-sm",
          className
        )}
        src={src}
      />
    );
  }

  return (
    <span
      aria-label={label}
      className={cn(
        sizeClass[size],
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-indigo-100 bg-white shadow-sm",
        className
      )}
      role="img"
    >
      <Image
        alt=""
        aria-hidden="true"
        className="object-contain"
        height={markSize[size]}
        src="/radevu-mark.png"
        width={markSize[size]}
      />
    </span>
  );
}
