/* ---------------------------------------------------------------
   lib/fetchFromAPI.ts   (all-strict, no any)
---------------------------------------------------------------- */
interface Success<T> {
  ok: true;
  data: T;
}

interface ErrorPayload {
  message?: string;
  [k: string]: unknown;
}

interface Failure {
  ok: false;
  status: number;
  statusText: string;
  payload: ErrorPayload | undefined;
}

/** Narrowing helper for `payload.message` */
const hasMessage = (x: unknown): x is { message: string } =>
  typeof x === "object" &&
  x !== null &&
  "message" in x &&
  typeof (x as Record<string, unknown>).message === "string";

export async function fetchFromAPI<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const path = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;
  const url = `${base}${path}`;

  // perform fetch
  const res = await fetch(url, {
    credentials: "include",
    ...options,
  });

  // attempt JSON parse
  const payload: unknown = await res.json().catch(() => undefined);

  if (!res.ok) {
    const failure: Failure = {
      ok: false,
      status: res.status,
      statusText: res.statusText,
      payload: payload as ErrorPayload | undefined,
    };

    // prefer server-provided message, else fallback to statusText
    const errorMsg = hasMessage(failure.payload)
      ? failure.payload.message
      : failure.statusText;

    throw new Error(errorMsg);
  }

  // success
  const success: Success<T> = { ok: true, data: payload as T };
  return success.data;
}
