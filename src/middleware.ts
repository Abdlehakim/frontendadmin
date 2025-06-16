// middleware.ts  (Next.js 14+ App Router)

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/* ————————————————————————————————————————————————
 * Helper: verify the HS256 JWT and return its payload,
 * or null when invalid / expired.
 * ———————————————————————————————————————————————— */
async function verifyJwt(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('🛑 JWT_SECRET not defined');
    return null;
  }
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ['HS256'] }
    );
    return payload as { role?: { permissions?: unknown } };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token_FrontEndAdmin')?.value ?? null;
  const payload = token ? await verifyJwt(token) : null;

  /* ——— 1) Public sign‑in page ——— */
  if (pathname === '/') {
    // already logged in → go straight to dashboard
    if (payload) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  /* ——— 2) All OTHER pages require a valid token ——— */
  if (!payload) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  /* ——— 3) Extra permission gate for /dashboard/users ——— */
  if (pathname.startsWith('/dashboard/users')) {
    const perms = Array.isArray(payload.role?.permissions)
      ? (payload.role?.permissions as string[])
      : [];
    if (!perms.includes('M_Access')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  /* ——— 4) Allowed ——— */
  return NextResponse.next();
}

/* ————————————————————————————————————————————————
 * Run on every path **except** Next.js statics and image optimizer
 * (those begin with /_next/…) – keeps assets working.
 * ———————————————————————————————————————————————— */
export const config = {
  matcher: [
    '/',                 // the public sign‑in page
    '/dashboard/:path*', // every protected page
  ],
}