// src/lib/fetchFromAPI.ts
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

export async function fetchFromAPI<T>(
  endpoint: string,
  options: RequestInit & { next?: { revalidate: number } } = {}
): Promise<T> {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BACKEND_URL}/api${path}`;

  const res = await fetch(url, {
    credentials: options.credentials ?? "include",
    ...options,
  });

  if (!res.ok) {
    throw new Error(`fetchFromAPI failed (${res.status}): ${res.statusText}`);
  }

  return res.json();
}
