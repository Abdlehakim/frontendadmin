// src/app/layout.tsx

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import { getDashboardUser } from "@/lib/getDashboardUser";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Admin Dashboard",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const initialUser = await getDashboardUser();
  if (!initialUser) redirect("/");

  return (
    <div className="flex h-screen">
      {/* Sidebar toggles between w-[80px] and w-[340px] */}
      <Sidebar initialUser={initialUser} />

      {/* Main content always fills remaining space */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
