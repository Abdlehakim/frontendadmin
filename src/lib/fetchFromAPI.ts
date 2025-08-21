// src/lib/fetchFromAPI.ts
const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000")
  .replace(/\/$/, "");

type Json = unknown;
interface ErrorPayload { message: string }
const isErrorPayload = (x: unknown): x is ErrorPayload =>
  typeof x === "object" && x !== null && "message" in x && typeof (x as Record<string, unknown>).message === "string";

const toApiPath = (endpoint: string): string => {
  const cleaned = endpoint.replace(/^\/+/, "");
  return cleaned.startsWith("api/") ? `/${cleaned}` : `/api/${cleaned}`;
};

export async function fetchFromAPI<T = Json>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${toApiPath(endpoint)}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });

  const ct = res.headers.get("content-type") ?? "";
  const payload: unknown = ct.includes("application/json")
    ? await res.json().catch(() => undefined)
    : undefined;

  if (!res.ok) {
    const msg = isErrorPayload(payload) ? payload.message : res.statusText || "Request failed";
    throw new Error(msg);
  }
  return (payload as T) ?? (undefined as T);
}
