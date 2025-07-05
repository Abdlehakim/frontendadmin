/* ------------------------------------------------------------------ */
/*  src/hooks/useAutoLogout.ts                                         */
/* ------------------------------------------------------------------ */
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const TIMER_COOKIE = "token_FrontEndAdmin_exp";
const LOGOUT_PATH  = "/dashboardAuth/logout";
const MAX_DELAY    = 2_147_483_647;          // 24.8 d cap  :contentReference[oaicite:1]{index=1}

export default function useAutoLogout() {
  const router = useRouter();

  /* ⬇️ give useRef an initial value — fixes TS2554 */
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);

    const raw = Cookies.get(TIMER_COOKIE);       // JS-readable (not HttpOnly)
    if (!raw) return;

    const expMs = Number(raw);
    if (!Number.isFinite(expMs)) return;

    const delay = Math.min(Math.max(expMs - Date.now(), 0), MAX_DELAY);
    console.log("⏲️  ms till logout =", delay);

    /* 🟡 BroadcastChannel must exist before we use it in the timeout */
    const bc = new BroadcastChannel("auth");

    timer.current = setTimeout(async () => {
      await fetch(LOGOUT_PATH, { method: "POST" }).catch(() => {});
      bc.postMessage({ type: "logout" });        // notify other tabs
      router.replace("/");
    }, delay);

    /* Receive logout from another tab */
    bc.onmessage = (e) => {
      if (e.data?.type === "logout") router.replace("/");
    };

    /* cleanup */
    return () => {
      if (timer.current) clearTimeout(timer.current);
      bc.close();
    };
  }, [router]);
}
