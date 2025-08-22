// src/app/dashboard/layout.tsx (Server Component)
import type { ReactNode } from "react";
import Sidebar from "@/components/sidebar/SidebarClient";
import DashboardClientShell from "@/components/DashboardClientShell";
import Providers from "./providers"
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
          <Providers>
    <DashboardClientShell>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </DashboardClientShell></Providers>
  );
}
