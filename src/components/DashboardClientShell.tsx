"use client";

import type { ReactNode } from "react";
import useAutoLogout from "@/hooks/useAutoLogout";
import Sidebar from "@/components/sidebar/SidebarClient";
import { AuthProvider } from "@/hooks/useAuthDashboard";

export default function DashboardClientShell({ children }: { children: ReactNode }) {
  useAutoLogout();

  return (
    <AuthProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </AuthProvider>
  );
}
