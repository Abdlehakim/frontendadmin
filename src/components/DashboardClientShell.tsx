// src/components/DashboardClientShell.tsx
"use client";

import type { ReactNode } from "react";
import { DashboardUser } from "@/app/dashboard/layout"; // ⬅︎ import the type
import useAutoLogout from "@/hooks/useAutoLogout";
import Sidebar from "@/components/sidebar/SidebarClient";

type Props = {
  initialUser: DashboardUser;
  children: ReactNode;
};

export default function DashboardClientShell({ initialUser, children }: Props) {
  useAutoLogout();
  return (
    <div className="flex h-screen">
      <Sidebar initialUser={initialUser} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
