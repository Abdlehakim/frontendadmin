// src/app/page.tsx
import SignInClient from "@/components/SignInClient";

type SP = Record<string, string | string[] | undefined>;

export default function DashboardSignInPage({
  searchParams,
}: {
  searchParams?: SP;
}) {
  // read redirectTo safely from search params
  const raw =
    Array.isArray(searchParams?.redirectTo)
      ? searchParams?.redirectTo[0]
      : searchParams?.redirectTo;

  const decodedOnce  = typeof raw === "string" ? decodeURIComponent(raw) : undefined;
  const decodedTwice = decodedOnce && decodedOnce !== raw ? decodeURIComponent(decodedOnce) : undefined;

  const target     = decodedTwice || decodedOnce;
  const redirectTo = target && target.startsWith("/") ? target : "/dashboard";

  return <SignInClient redirectTo={redirectTo} />;
}
