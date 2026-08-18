// Thin authed fetch helpers for the /api Vercel Functions.
import { getAccessToken } from './generate/client';

export async function authedFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(path, { ...options, headers });
}

/** JSON request; throws with the API's error message on non-2xx. */
export async function apiJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await authedFetch(path, options);
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as {
      error?: { message?: string; code?: string };
    };
    const err = new Error(payload?.error?.message ?? `Request failed (${res.status})`);
    (err as Error & { code?: string }).code = payload?.error?.code;
    throw err;
  }
  return (await res.json()) as T;
}
