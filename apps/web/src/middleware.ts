import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { isReservedSlug, parseSubdomain } from "@/lib/routing";

export const config = {
  matcher: ["/((?!_next/|favicon.ico|api/health).*)"]
};

function requestHeadersWithPath(req: NextRequest): Headers {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-radevu-pathname", req.nextUrl.pathname);
  return requestHeaders;
}

function nextWithPath(req: NextRequest): NextResponse {
  return NextResponse.next({
    request: {
      headers: requestHeadersWithPath(req)
    }
  });
}

function redirectTo(req: NextRequest, pathname: string): NextResponse {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

function dashboardRedirect(req: NextRequest): NextResponse | null {
  const segments = req.nextUrl.pathname.split("/").filter(Boolean);

  if (segments[0] !== "dashboard") {
    return null;
  }

  const section = segments[1];

  if (!section) {
    return redirectTo(req, "/dashboard/today");
  }

  if (section === "login" || section === "register") {
    return redirectTo(req, `/${section}`);
  }

  if (
    section === "today" ||
    section === "appointments" ||
    section === "debts" ||
    section === "notifications"
  ) {
    return segments.length > 2 ? redirectTo(req, `/dashboard/${section}`) : null;
  }

  if (section === "settings") {
    const settingsPage = segments[2];
    const validSettingsPages = new Set([
      "hours",
      "profile",
      "services",
      "visibility"
    ]);

    if (!settingsPage) {
      return null;
    }

    if (!validSettingsPages.has(settingsPage) || segments.length > 3) {
      return redirectTo(req, "/dashboard/settings");
    }

    return null;
  }

  if (section === "customers") {
    return segments.length > 3 ? redirectTo(req, "/dashboard/customers") : null;
  }

  return redirectTo(req, "/dashboard/today");
}

export function middleware(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  const mode = env.ROUTING_MODE;
  const base = env.BOOKING_BASE_DOMAIN;
  const host = req.headers.get("host") ?? "";
  const dashboardCanonicalRedirect = dashboardRedirect(req);

  if (dashboardCanonicalRedirect) {
    return dashboardCanonicalRedirect;
  }

  if (mode === "subdomain") {
    const subdomain = parseSubdomain(host, base);

    if (subdomain === null || subdomain === "" || subdomain === "www") {
      return nextWithPath(req);
    }

    if (subdomain === "dashboard") {
      if (url.pathname === "/") {
        return redirectTo(req, "/dashboard/today");
      }

      return nextWithPath(req);
    }

    if (isReservedSlug(subdomain)) {
      return new NextResponse(null, { status: 404 });
    }

    url.pathname = `/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeadersWithPath(req)
      }
    });
  }

  const firstSegment = url.pathname.split("/").filter(Boolean)[0];

  if (!firstSegment) {
    return nextWithPath(req);
  }

  if (
    firstSegment === "account" ||
    firstSegment === "dashboard" ||
    firstSegment === "epaggelmaties" ||
    firstSegment === "api" ||
    firstSegment === "login" ||
    firstSegment === "register" ||
    firstSegment === "verify-email"
  ) {
    return nextWithPath(req);
  }

  if (isReservedSlug(firstSegment)) {
    return new NextResponse(null, { status: 404 });
  }

  return nextWithPath(req);
}
