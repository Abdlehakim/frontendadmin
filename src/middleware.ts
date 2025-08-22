// frontend/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "token_FrontEndAdmin";
const PROTECTED = [/^\/dashboard(?:\/|$)/];

export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname, search, searchParams } = request.nextUrl;

  const isProtected = PROTECTED.some((re) => re.test(pathname));
  const isSignIn = pathname === "/";

  // Not logged in → block protected pages
  if (!token && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set(
      "redirectTo",
      encodeURIComponent(pathname + (search || ""))
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Logged in → keep away from the sign-in page
  if (token && isSignIn) {
    const to = searchParams.get("redirectTo");
    const dest = to ? decodeURIComponent(to) : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
