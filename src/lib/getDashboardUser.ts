// src/lib/getDashboardUser.ts
import { cookies } from 'next/headers';

export interface Role {
  _id: string;
  name: string;
  permissions?: string[];
}
export interface User {
  _id: string;
  email: string;
  username?: string;
  phone?: string;
  role?: Role;
}

export async function getDashboardUser(): Promise<User | null> {
  // ① await the cookie store
  const cookieStore = await cookies();
  const token = cookieStore.get('token_FrontEndAdmin')?.value;
  if (!token) return null;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';
  const res = await fetch(`${backendUrl}/api/dashboardAuth/me`, {
    headers: { cookie: `token_FrontEndAdmin=${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const { user } = await res.json();
  return user ?? null;
}
