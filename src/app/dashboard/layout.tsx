/* ------------------------------------------------------------------
   src/app/dashboard/layout.tsx
------------------------------------------------------------------ */
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import Providers from "@/app/dashboard/providers";
import DashboardClientShell from "@/components/DashboardClientShell";
import { getDashboardUser } from "@/lib/getDashboardUser";

/*  ←  ajoute de nouveau l’export du type  */
export type DashboardUser =
  NonNullable<Awaited<ReturnType<typeof getDashboardUser>>>;

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const initialUser = await getDashboardUser();
  if (!initialUser) redirect("/");

  return (
    <Providers>
      <DashboardClientShell initialUser={initialUser}>
        <div className="overflow-y-scroll h-screen">{children}</div>
      </DashboardClientShell>
    </Providers>
  );
}
