"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";
type LogoShape = "square" | "triangle";

type LogoProps = {
  priority?: boolean;
  shape?: LogoShape;
  size?: LogoSize;
};

const sizeMap: Record<LogoSize, number> = {
  sm: 32,
  md: 56,
  lg: 72
};

/**
 * Renders the founder-provided Radevu PNG mark with a typography fallback.
 *
 * @param props - Logo size, optional priority loading, and optional clipped shape.
 * @returns The Radevu logo mark or fallback wordmark.
 */
export function Logo({
  priority = false,
  shape = "square",
  size = "md"
}: LogoProps): JSX.Element {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSize = sizeMap[size];
  const logoSrc = shape === "square" ? "/radevu-mark.png" : "/radevu.png";

  if (imageFailed) {
    return (
      <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-xl font-semibold tracking-tight text-transparent">
        radevu
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-md",
        shape === "triangle" &&
          "rounded-none [clip-path:polygon(50%_0%,0%_100%,100%_100%)]"
      )}
    >
      <Image
        alt="Radevu"
        height={imageSize}
        onError={() => setImageFailed(true)}
        priority={priority}
        src={logoSrc}
        width={imageSize}
      />
    </span>
  );
}
