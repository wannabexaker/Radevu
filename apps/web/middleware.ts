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

export function middleware(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone();
  const mode = env.ROUTING_MODE;
  const base = env.BOOKING_BASE_DOMAIN;
  const host = req.headers.get("host") ?? "";

  if (mode === "subdomain") {
    const subdomain = parseSubdomain(host, base);

    if (subdomain === null || subdomain === "" || subdomain === "www") {
      return nextWithPath(req);
    }

    if (subdomain === "dashboard") {
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

  if (firstSegment === "dashboard" || firstSegment === "api") {
    return nextWithPath(req);
  }

  if (isReservedSlug(firstSegment)) {
    return new NextResponse(null, { status: 404 });
  }

  return nextWithPath(req);
}
