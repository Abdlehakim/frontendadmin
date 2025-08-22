// src/app/page.tsx
import SignInClient from "@/components/SignInClient";

type SP = { [key: string]: string | string[] | undefined };

export default function DashboardSignInPage({
  searchParams,
}: { searchParams?: SP }) {
  const raw = Array.isArray(searchParams?.redirectTo)
    ? searchParams?.redirectTo?.[0]
    : searchParams?.redirectTo;

  // decode once; sanitize
  const decoded = typeof raw === "string" ? decodeURIComponent(raw) : undefined;
  const redirectTo = decoded && decoded.startsWith("/") ? decoded : "/dashboard";

  return <SignInClient redirectTo={redirectTo} />;
}
