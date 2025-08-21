// frontend/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = [
  /^\/dashboard(?:\/|$)/
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token_FrontEnd")?.value;
  const { pathname, search, searchParams } = request.nextUrl;

  if (!token && PROTECTED.some((re) => re.test(pathname))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set(
      "redirectTo",
      encodeURIComponent(pathname + search)
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (token && (pathname === "/signin")) {
    const hasRedirect = searchParams.has("redirectTo");
    if (!hasRedirect) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*"
  ],
};
