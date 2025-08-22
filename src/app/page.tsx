// src/app/page.tsx
import SignInClient from "@/components/SignInClient";

type SearchParams = Record<string, string | string[] | undefined>;

export default function DashboardSignInPage({
  // params is required by Next's PageProps even if unused
  params, // eslint-disable-line @typescript-eslint/no-unused-vars
  searchParams,
}: {
  params: Record<string, string>;
  searchParams: SearchParams;
}) {
  const raw =
    Array.isArray(searchParams?.redirectTo)
      ? searchParams.redirectTo[0]
      : searchParams?.redirectTo;

  const decodedOnce =
    typeof raw === "string" ? decodeURIComponent(raw) : undefined;
  const decodedTwice =
    decodedOnce && decodedOnce !== raw ? decodeURIComponent(decodedOnce) : undefined;

  const target = decodedTwice || decodedOnce;
  const redirectTo = target && target.startsWith("/") ? target : "/dashboard";

  return <SignInClient redirectTo={redirectTo} />;
}
