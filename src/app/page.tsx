import { Suspense } from "react";
import SignInClient from "@/components/SignInClient";

export default function Page() {
  return (
    <Suspense>
      <SignInClient />
    </Suspense>
  );
}
