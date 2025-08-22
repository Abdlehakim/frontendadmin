/* ------------------------------------------------------------------
   src/hooks/useAutoLogout.ts      (dashboard)
------------------------------------------------------------------ */
"use client";

import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

const TIMER_COOKIE = "token_FrontEndAdmin_exp";
const LOGOUT_PATH  = "/dashboardAuth/logout";
const MAX_DELAY    = 2_147_483_647;

export default function useAutoLogout() {
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<number | null>(null);
  const bcRef       = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const cleanup = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      bcRef.current?.close();
      timerRef.current = null;
      intervalRef.current = null;
      bcRef.current = null;
    };
    
    cleanup();

    const raw = Cookies.get(TIMER_COOKIE);
    if (!raw) return;

    const expMs = Number(raw);
    if (!Number.isFinite(expMs)) return;

    const delay = Math.min(Math.max(expMs - Date.now(), 0), MAX_DELAY);

        const doClientLogout = async (callBackend = true) => {
      try {
        if (callBackend) {
          await fetchFromAPI<void>(LOGOUT_PATH, {
            method: "POST",
            credentials: "include",
          }).catch(() => {});
        }
      } finally {
        Cookies.remove(TIMER_COOKIE);
        bcRef.current?.postMessage({ type: "logout" });
        window.location.replace("/");
      }
    };

    // Main timeout
    timerRef.current = setTimeout(() => {
      doClientLogout(true);
    }, delay);

    // Safety interval for throttled/background tabs
    intervalRef.current = window.setInterval(() => {
      const r = Cookies.get(TIMER_COOKIE);
      if (!r) return;
      if (Date.now() >= Number(r)) {
        doClientLogout(true);
      }
    }, 15_000);

    // Cross-tab sync
    bcRef.current =
      typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("auth") : null;

    if (bcRef.current) {
      bcRef.current.onmessage = (e) => {
        if (e.data?.type === "logout") {
          doClientLogout(false);
        }
        if (e.data?.type === "refresh-exp" && typeof e.data.exp === "number") {
          Cookies.set(TIMER_COOKIE, String(e.data.exp), {
            path: "/",
            sameSite: "Lax",
          });
          window.location.reload();
        }
      };
    }
    const storageHandler = (ev: StorageEvent) => {
      if (ev.key === TIMER_COOKIE && ev.newValue) {
        window.location.reload();
      }
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener("storage", storageHandler);
      cleanup();
    };
  }, []);
}
