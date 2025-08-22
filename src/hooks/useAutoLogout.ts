/* ------------------------------------------------------------------
   src/hooks/useAutoLogout.ts  (dashboard) — mirror website behavior
------------------------------------------------------------------ */
"use client";

import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

const TIMER_COOKIE = "token_FrontEndAdmin_exp"; // JS-readable ms timestamp
const LOGOUT_PATH  = "/dashboardAuth/logout";   // fetchFromAPI adds /api
const MAX_DELAY    = 2_147_483_647;            // setTimeout max (~24.8 days)

export default function useAutoLogout() {
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<number | null>(null);
  const bcRef       = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const cleanup = () => {
      if (timerRef.current)   clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      bcRef.current?.close();
    };

    // clear leftovers on remounts (Strict Mode, hot reload, etc.)
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
        // remove mirror cookie (server will clear HttpOnly on its side)
        Cookies.remove(TIMER_COOKIE, { path: "/", sameSite: "Lax" });
        // notify other tabs
        bcRef.current?.postMessage({ type: "logout" });
        // go to your dashboard sign-in (root in your setup)
        window.location.replace("/");
      }
    };

    // Main timeout
    timerRef.current = setTimeout(() => {
      void doClientLogout(true);
    }, delay);

    // Safety interval for throttled/background tabs
    intervalRef.current = window.setInterval(() => {
      const r = Cookies.get(TIMER_COOKIE);
      if (!r) return;
      if (Date.now() >= Number(r)) {
        void doClientLogout(true);
      }
    }, 15_000);

    // Cross-tab sync
    bcRef.current =
      typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("auth") : null;

    if (bcRef.current) {
      bcRef.current.onmessage = (e) => {
        if (e.data?.type === "logout") {
          void doClientLogout(false);
        }
      };
    }

    // Fallback: some browsers without BroadcastChannel
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
