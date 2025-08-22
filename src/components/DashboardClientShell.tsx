"use client";

import type { ReactNode } from "react";
import useAutoLogout from "@/hooks/useAutoLogout";

interface Props {
  children: ReactNode;
}

export default function DashboardClientShell({ children }: Props) {
  useAutoLogout();
return <>{children}</>;
}
