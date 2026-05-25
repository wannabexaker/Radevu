"use client";

import dynamic from "next/dynamic";
import {
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useRef
} from "react";

type MotionValue = number | string;

type MotionState = {
  opacity?: number;
  x?: MotionValue;
  y?: MotionValue;
};

type MotionTransition = {
  delay?: number;
  duration?: number;
  ease?: "linear" | "easeIn" | "easeOut" | "easeInOut";
};

export type MotionDivProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  animate?: MotionState;
  children: ReactNode;
  initial?: MotionState;
  transition?: MotionTransition;
};

type AnimationControls = {
  stop: () => void;
};

function toCssValue(value: MotionValue | undefined): string {
  if (typeof value === "number") {
    return `${value}px`;
  }

  return value ?? "0px";
}

function toTransform(value: MotionState | undefined): string {
  return `translate3d(${toCssValue(value?.x)}, ${toCssValue(value?.y)}, 0)`;
}

function MotionDivInner({
  animate,
  children,
  initial,
  transition,
  ...props
}: MotionDivProps): JSX.Element {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || !animate) {
      return;
    }

    let cancelled = false;
    let controls: AnimationControls | undefined;

    const keyframes: Record<string, [number | string, number | string]> = {};

    if (initial?.opacity !== undefined || animate.opacity !== undefined) {
      keyframes.opacity = [initial?.opacity ?? 1, animate.opacity ?? 1];
    }

    if (
      initial?.x !== undefined ||
      initial?.y !== undefined ||
      animate.x !== undefined ||
      animate.y !== undefined
    ) {
      keyframes.transform = [toTransform(initial), toTransform(animate)];
    }

    if (Object.keys(keyframes).length === 0) {
      return;
    }

    void import("framer-motion/dom")
      .then(({ animate: animateElement }) => {
        if (cancelled) {
          return;
        }

        controls = animateElement(element, keyframes, {
          delay: transition?.delay ?? 0,
          duration: transition?.duration ?? 0.3,
          ease: transition?.ease ?? "easeOut"
        });
      })
      .catch((error: unknown) => {
        console.error("Failed to load framer-motion DOM animation", { error });
      });

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [animate, initial, transition]);

  return (
    <div ref={elementRef} {...props}>
      {children}
    </div>
  );
}

/**
 * Dynamically renders a div animated through framer-motion's DOM entrypoint.
 */
export const MotionDiv = dynamic<MotionDivProps>(
  () => Promise.resolve(MotionDivInner),
  {
    ssr: false
  }
);
