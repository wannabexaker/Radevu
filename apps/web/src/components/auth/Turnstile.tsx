"use client";

import { useEffect, useRef } from "react";

type TurnstileWindow = Window & {
  turnstile?: {
    render: (
      container: HTMLElement,
      options: {
        callback: (token: string) => void;
        "error-callback": () => void;
        sitekey: string;
        theme: "light";
      }
    ) => string;
  };
};

type TurnstileProps = {
  onTokenChange: (token: string) => void;
};

const scriptId = "cloudflare-turnstile-script";
const scriptSrc = "https://challenges.cloudflare.com/turnstile/v0/api.js";

export function Turnstile({ onTokenChange }: TurnstileProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      onTokenChange("dev-turnstile-token");
      return;
    }

    const verifiedSiteKey = siteKey;
    let cancelled = false;

    function renderWidget(): void {
      const container = containerRef.current;
      const turnstile = (window as TurnstileWindow).turnstile;

      if (!container || !turnstile || cancelled || container.dataset.rendered) {
        return;
      }

      container.dataset.rendered = "true";
      turnstile.render(container, {
        callback: onTokenChange,
        "error-callback": () => onTokenChange(""),
        sitekey: verifiedSiteKey,
        theme: "light"
      });
    }

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.defer = true;
      script.src = scriptSrc;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      renderWidget();
    }

    return () => {
      cancelled = true;
    };
  }, [onTokenChange, siteKey]);

  if (!siteKey) {
    return <input name="turnstile_token" type="hidden" value="dev-turnstile-token" />;
  }

  return <div ref={containerRef} />;
}
