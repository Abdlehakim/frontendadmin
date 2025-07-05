/* ------------------------------------------------------------------ */
/*  src/hooks/useAutoLogout.ts                                         */
/* ------------------------------------------------------------------ */
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

const TIMER_COOKIE = "token_FrontEndAdmin_exp";
const LOGOUT_PATH  = "/dashboardAuth/logout";
const MAX_DELAY_MS = 2_147_483_647; // brower setTimeout cap ≈ 24.8 d

export default function useAutoLogout() {
   console.log("▶️ useAutoLogout mounted"); 
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // clear previous timer
    if (timer.current) clearTimeout(timer.current);

    const raw = Cookies.get(TIMER_COOKIE);
    if (!raw) return;

    const expMs = Number(raw);
    if (!Number.isFinite(expMs)) return;

    const delay = Math.min(Math.max(expMs - Date.now(), 0), MAX_DELAY_MS);
console.log("⏲️ ms till logout =", delay);
    timer.current = setTimeout(async () => {
      try {
        await fetchFromAPI(LOGOUT_PATH, { method: "POST" });
      } catch {
        /* ignore network errors — cookie is likely gone */
      } finally {
        router.replace("/");
      }
    }, delay);

    // cross-tab sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === TIMER_COOKIE && !e.newValue) router.replace("/");
    };
    window.addEventListener("storage", onStorage);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("storage", onStorage);
    };
  }, [router]);
}
