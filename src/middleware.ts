// frontend/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "token_FrontEndAdmin";

// Protected area
const PROTECTED = [/^\/dashboard(?:\/|$)/];
// Auth page is ONLY the root "/"
const AUTH_PAGES = [/^\/$/];

export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname, search } = request.nextUrl;

  const isProtected = PROTECTED.some((re) => re.test(pathname));
  const isAuthPage  = AUTH_PAGES.some((re) => re.test(pathname));

  // Not logged in → block protected pages → send to "/"
  if (!token && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/"; // sign-in is at root
    redirectUrl.searchParams.set("redirectTo", pathname + (search || ""));
    return NextResponse.redirect(redirectUrl);
  }

  // Logged in → keep away from "/" (auth page)
  if (token && isAuthPage) {
    const to = request.nextUrl.searchParams.get("redirectTo");
    const dest = to ? decodeURIComponent(to) : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
