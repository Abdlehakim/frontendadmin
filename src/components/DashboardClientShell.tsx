
"use client";

import type { ReactNode } from "react";
import useAutoLogout from "@/hooks/useAutoLogout";
import Sidebar from "@/components/sidebar/SidebarClient";
import { AuthProvider, useAuth } from "@/hooks/useAuthDashboard";

function ShellInner({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  // ✅ Start auto-logout ONLY when authenticated and not loading
  useAutoLogout(isAuthenticated && !loading);

  // Optionally avoid rendering until auth is resolved
  if (loading) return null;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

export default function DashboardClientShell({ children }: { children: ReactNode }) {
  // Wrap inner content with AuthProvider so useAuth() is available
  return (
    <AuthProvider>
      <ShellInner>{children}</ShellInner>
    </AuthProvider>
  );
}
