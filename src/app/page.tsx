// src/app/page.tsx
import SignInClient from "@/components/SignInClient";

type SP = Record<string, string | string[] | undefined>;

export default async function DashboardSignInPage({
  searchParams,
}: {
  searchParams?: Promise<SP>;
}) {
  const params: SP = await (searchParams ?? Promise.resolve({}));

  const raw = Array.isArray(params.redirectTo) ? params.redirectTo[0] : params.redirectTo;
  const decodedOnce  = typeof raw === "string" ? decodeURIComponent(raw) : undefined;
  const decodedTwice = decodedOnce ? decodeURIComponent(decodedOnce) : undefined;

  const target = decodedTwice || decodedOnce;
  const redirectTo = target && target.startsWith("/") ? target : "/dashboard";

  return <SignInClient redirectTo={redirectTo} />;
}
