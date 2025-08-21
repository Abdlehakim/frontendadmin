// frontend/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE = "token_FrontEndAdmin";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const token = req.cookies.get(TOKEN_COOKIE)?.value;

  const isProtected = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/";          // your 
  if (!token && isProtected) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/";
    const original = req.nextUrl.pathname + req.nextUrl.search;
    loginUrl.searchParams.set("redirectTo", original);
    return NextResponse.redirect(loginUrl);
  }
  
  if (token && isAuthPage) {
    const redirectTo = searchParams.get("redirectTo") || "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Only run on dashboard and the login page ("/")
  matcher: ["/", "/dashboard/:path*"],
};
