// src/components/DashboardClientShell.tsx
"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuthDashboard";
import useAutoLogout from "@/hooks/useAutoLogout";

interface Props { children: ReactNode; }

export default function DashboardClientShell({ children }: Props) {
  const { isAuthenticated, loading } = useAuth();
  useAutoLogout(isAuthenticated && !loading);
  return <>{children}</>;
}
