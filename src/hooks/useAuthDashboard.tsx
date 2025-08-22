/* ------------------------------------------------------------------
   src/hooks/useAuthDashboard.ts (frontend) — simplified to match useAuth.tsx
------------------------------------------------------------------ */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
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
const AuthContext = createContext<AuthContextValue | null>(null);

/* ───────── provider ───────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ----- GET /dashboardAuth/me ----- */
  const refresh = useCallback(async () => {
    try {
      const data = await fetchFromAPI<{ user: User | null }>("/dashboardAuth/me");
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  /* ----- POST /signindashboardadmin ----- */
  const login = useCallback(
    async (email: string, password: string) => {
      await fetchFromAPI("/signindashboardadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      await refresh();
    },
    [refresh],
  );

  /* ----- POST /dashboardAuth/logout ----- */
  const logout = useCallback(async () => {
    await fetchFromAPI("/dashboardAuth/logout", { method: "POST" });
    setUser(null);
  }, []);

  /* ----- initial cookie check ----- */
  useEffect(() => {
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

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

/* ───────── consumer hook ───────── */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
