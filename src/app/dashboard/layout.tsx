import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import Providers from "@/app/dashboard/providers";               // ← alias OK
import DashboardClientShell from "@/components/DashboardClientShell";
import { getDashboardUser } from "@/lib/getDashboardUser";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const initialUser = await getDashboardUser();
  if (!initialUser) redirect("/");

  return (
    <Providers>                                       {/* contexte Redux+Persist */}
      <DashboardClientShell initialUser={initialUser}>
        <div className="overflow-y-scroll h-screen">{children}</div>
      </DashboardClientShell>
    </Providers>
  );
}
