import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function verifyJwt(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  try {
    await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const token   = req.cookies.get("token_FrontEndAdmin")?.value;
  const isValid = token ? await verifyJwt(token) : false;
  const { pathname } = req.nextUrl;

  // 1️⃣ Kick invalid or expired tokens out of /dashboard
if (!isValid && pathname.startsWith("/dashboard")) {
  const res = NextResponse.redirect(new URL("/", req.url));

  // hard-delete both auth cookies
res.cookies.delete({ name:"token_FrontEndAdmin", path:"/" });

  return res;
}

  // 2️⃣ Block signed-in users from revisiting the sign-in page
  if (isValid && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
