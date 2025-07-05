// src/app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import DashboardClientShell from "@/components/DashboardClientShell";
import { getDashboardUser } from "@/lib/getDashboardUser";

/* ---------- shared user type ---------- */
export type DashboardUser =
  NonNullable<Awaited<ReturnType<typeof getDashboardUser>>>;

type RootLayoutProps = { children: ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
  const initialUser = await getDashboardUser();
  if (!initialUser) redirect("/");

  return (
    <DashboardClientShell initialUser={initialUser}>
      {children}
    </DashboardClientShell>
  );
}
