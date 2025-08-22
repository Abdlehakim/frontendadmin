/* ------------------------------------------------------------------
   src/app/dashboard/layout.tsx  (Server Component)
------------------------------------------------------------------ */
import type { ReactNode } from "react";
import Providers from "./providers"; // your dashboard-specific providers
import DashboardClientShell from "@/components/DashboardClientShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <DashboardClientShell>{children}</DashboardClientShell>
    </Providers>
  );
}
