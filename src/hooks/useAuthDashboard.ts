/* ------------------------------------------------------------------
   src/hooks/useAuthDashboard.ts
------------------------------------------------------------------ */
"use client";

import * as React from "react";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ───────── types ───────── */
export interface User {
  _id: string;
  email: string;
  username?: string;
  phone?: string;
  role?: { name: string; permissions: string[] };
}
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

/* ───────── context ───────── */
const AuthContext = React.createContext<AuthContextValue | null>(null);

/** Make an init that does NOT carry the Next.js `next` property */
type APIInit = Omit<RequestInit, "next">;

const withAuthOpts = (opts?: APIInit): APIInit => ({
  ...(opts ?? {}),
  credentials: "include",
  cache: "no-store",
  headers: {
    ...(opts?.headers ?? {}),
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  /** GET /api/dashboardAuth/me — force fresh read */
  const refresh = React.useCallback(async () => {
    try {
      const t = Date.now(); // cache-buster
      const data = await fetchFromAPI<{ user: User | null }>(
        `/dashboardAuth/me?t=${t}`,
        withAuthOpts()
      );
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  /** POST /api/signindashboardadmin */
  const login = React.useCallback(
    async (email: string, password: string) => {
      await fetchFromAPI(
        "/signindashboardadmin",
        withAuthOpts({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
      );
      // clear any stale client timer cookie (prevents immediate auto-logout)
      document.cookie = "token_FrontEndAdmin_exp=; Max-Age=0; path=/";
      await refresh();
    },
    [refresh]
  );

  /** POST /api/dashboardAuth/logout */
  const logout = React.useCallback(async () => {
    try {
      await fetchFromAPI(
        "/dashboardAuth/logout",
        withAuthOpts({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: true }),
        })
      );
    } finally {
      setUser(null);
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const ctx: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    refresh,
  };

  return React.createElement(AuthContext.Provider, { value: ctx }, children);
}

/* ───────── consumer hook ───────── */
export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
