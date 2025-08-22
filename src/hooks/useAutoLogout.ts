/* ------------------------------------------------------------------
   src/hooks/useAutoLogout.ts      (dashboard)
------------------------------------------------------------------ */
"use client";

import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

const TIMER_COOKIE = "token_FrontEndAdmin_exp";
const LOGOUT_PATH  = "/dashboardAuth/logout"; // uses fetchFromAPI (adds /api)
const MAX_DELAY    = 2_147_483_647;

// We'll read server time from headers on this lightweight call.
// Use a GET so Express always sets a Date header.
const SERVER_TIME_URL = "/api/dashboardAuth/me";

export default function useAutoLogout() {
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<number | null>(null);
  const bcRef       = useRef<BroadcastChannel | null>(null);
  const offsetRef   = useRef<number>(0); // serverNow - clientNow

  useEffect(() => {
    const cleanup = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (bcRef.current) bcRef.current.close();
      timerRef.current = null;
      intervalRef.current = null;
      bcRef.current = null;
    };
    cleanup();

    const readExpMs = (): number | null => {
      const raw = Cookies.get(TIMER_COOKIE);
      if (!raw) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    };

    const scheduleFromCookie = () => {
      const expMs = readExpMs();
      if (!expMs) return;

      const nowAdj = Date.now() + offsetRef.current;
      const delay = Math.min(Math.max(expMs - nowAdj, 0), MAX_DELAY);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void doClientLogout(true);
      }, delay);
    };

    const doClientLogout = async (callBackend = true) => {
      try {
        if (callBackend) {
          await fetchFromAPI<void>(LOGOUT_PATH, {
            method: "POST",
            credentials: "include",
          }).catch(() => {});
        }
      } finally {
        Cookies.remove(TIMER_COOKIE, { path: "/", sameSite: "Lax" });
        bcRef.current?.postMessage({ type: "logout" });
        window.location.replace("/");
      }
    };

    const measureServerOffset = async () => {
      try {
        // We only need headers; JSON body is fine to fetch, we just ignore it.
        const res = await fetch(SERVER_TIME_URL, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const dateHeader = res.headers.get("date");
        if (dateHeader) {
          const serverNow = new Date(dateHeader).getTime();
          offsetRef.current = serverNow - Date.now();
        } else {
          offsetRef.current = 0; // fallback
        }
      } catch {
        offsetRef.current = 0;
      }
    };

    (async () => {
      // 1) Measure skew once on mount, then schedule
      await measureServerOffset();
      scheduleFromCookie();

      // 2) Safety interval for BG tabs + expiry check using adjusted time
      intervalRef.current = window.setInterval(() => {
        const expMs = readExpMs();
        if (!expMs) return;
        const nowAdj = Date.now() + offsetRef.current;
        if (nowAdj >= expMs) {
          void doClientLogout(true);
        }
      }, 15_000);

      // 3) Cross-tab sync
      bcRef.current =
        typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("auth") : null;

      if (bcRef.current) {
        bcRef.current.onmessage = (e) => {
          if (e.data?.type === "logout") {
            void doClientLogout(false);
          }
          if (e.data?.type === "refresh-exp" && typeof e.data.exp === "number") {
            Cookies.set(TIMER_COOKIE, String(e.data.exp), {
              path: "/",
              sameSite: "Lax",
            });
            scheduleFromCookie();
          }
        };
      }

      // 4) When the tab becomes active or refocuses, re-measure offset & reschedule.
      const onFocus = async () => {
        await measureServerOffset();
        scheduleFromCookie();
      };
      window.addEventListener("visibilitychange", () => {
        if (!document.hidden) void onFocus();
      });
      window.addEventListener("focus", onFocus);

      // Note: 'storage' does NOT fire for cookie changes, so we don't use it.
    })();

    return cleanup;
  }, []);
}
