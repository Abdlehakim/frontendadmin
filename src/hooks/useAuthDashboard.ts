// src/hooks/useAuthDashboard.ts
"use client";

import { useState, useEffect } from 'react';
import type { User } from '@/lib/getDashboardUser';
// re‑export the User type
export type { User };
// ← add this:
import { fetchFromAPI } from '@/lib/fetchFromAPI';

export function useAuth(initialUser: User | null = null) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState<boolean>(initialUser === null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!initialUser
  );

  useEffect(() => {
    if (!loading) return; // already have initialUser from SSR

    (async () => {
      try {
        const data = await fetchFromAPI<{ user: User | null }>('/dashboardAuth/me');
        if (data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error fetching /dashboardAuth/me:', err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [loading]);

  return { user, isAuthenticated, loading };
}
