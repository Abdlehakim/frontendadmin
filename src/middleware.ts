// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token_FrontEndAdmin")?.value;
  const pathname = req.nextUrl.pathname;

  const isValid = await (async () => {
    if (!token) return false;
    try {
      await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET!),
        { algorithms: ["HS256"] }
      );
      return true;
    } catch { return false; }
  })();

  // Kick unauth’d users out of dashboard
  if (!isValid && pathname.startsWith("/dashboard")) {
    const res = NextResponse.redirect(new URL("/", req.url));
    res.cookies.delete("token_FrontEndAdmin");
    res.cookies.delete("token_FrontEndAdmin_exp");          // see Next docs :contentReference[oaicite:2]{index=2}
    return res;
  }

  // Prevent signed-in users from revisiting /
  if (isValid && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/", "/dashboard/:path*"] };
