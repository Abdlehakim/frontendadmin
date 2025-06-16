/* lib/fetchFromAPI.ts */


const hasMessage = (x: unknown): x is { message: string } =>
  typeof x === "object" &&
  x !== null &&
  "message" in x &&
  typeof (x as Record<string, unknown>).message === "string";

const API_BASE = (
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export async function fetchFromAPI<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const path = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, { credentials: "include", ...options });

  const payload: unknown = await res.json().catch(() => undefined);

  if (!res.ok) {
    const errorMsg = hasMessage(payload)
      ? payload.message
      : res.statusText;
    throw new Error(errorMsg);
  }

  return payload as T;
}
