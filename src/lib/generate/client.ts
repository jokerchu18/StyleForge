// Frontend client for the /api Vercel Functions.
import type {
  GenerateErrorCode,
  HealthResponse,
  StyleTransformRequest,
} from '../../shared/generate-types';
import { supabase } from '../supabase';

/** Current Supabase access token, or null when signed out. */
export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;
  if (tokenExpiresSoon(session.access_token)) {
    const { data: refreshed, error } = await supabase.auth.refreshSession({
      refresh_token: session.refresh_token,
    });
    if (!error && refreshed.session) {
      return refreshed.session.access_token;
    }
    // Refresh failed — fall through and return the stale token; the server
    // rejects it with a clear auth error if it is genuinely dead.
  }
  return session.access_token;
}

/** True when a JWT's `exp` is within `thresholdMs` of now (or unreadable). */
function tokenExpiresSoon(token: string, thresholdMs = 60_000): boolean {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof payload.exp !== 'number') return true;
    return payload.exp * 1000 < Date.now() + thresholdMs;
  } catch {
    return true;
  }
}

export class GenerateClientError extends Error {
  readonly code: GenerateErrorCode;
  readonly provider?: string;

  constructor(code: GenerateErrorCode, message: string, provider?: string) {
    super(message);
    this.name = 'GenerateClientError';
    this.code = code;
    this.provider = provider;
  }
}

export interface GenerateResultData {
  blob: Blob;
  mime: string;
  provider: string;
  model: string;
  width?: number;
  height?: number;
  generationId?: string;
  costUnits?: number;
}

async function parseErrorResponse(res: Response): Promise<GenerateClientError> {
  let code: GenerateErrorCode = 'INTERNAL';
  let message = `Request failed (${res.status})`;
  let provider: string | undefined;
  try {
    const json = (await res.json()) as {
      error?: { code?: GenerateErrorCode; message?: string; provider?: string };
    };
    if (json.error) {
      code = json.error.code ?? code;
      message = json.error.message ?? message;
      provider = json.error.provider;
    }
  } catch {
    // Not JSON — keep defaults.
  }
  return new GenerateClientError(code, message, provider);
}

/**
 * Image-to-image style transfer. Sends raw image bytes in the POST body
 * (query carries metadata) to stay well under Vercel's 4.5MB limit.
 */
export async function transformImage(
  req: StyleTransformRequest,
  imageBlob: Blob,
): Promise<GenerateResultData> {
  const params = new URLSearchParams({ styleId: req.styleId });
  if (req.provider) params.set('provider', req.provider);
  if (req.quality) params.set('quality', req.quality);

  const token = await getAccessToken();
  const res = await fetch(`/api/transform?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': imageBlob.type || 'application/octet-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: imageBlob,
  });

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  const get = (k: string) => res.headers.get(k) ?? '';
  return {
    blob: await res.blob(),
    mime: get('content-type') || imageBlob.type || 'image/png',
    provider: get('x-generate-provider'),
    model: get('x-generate-model'),
    width: numOrUndefined(get('x-generate-width')),
    height: numOrUndefined(get('x-generate-height')),
    generationId: get('x-generation-id') || undefined,
    costUnits: numOrUndefined(get('x-generation-cost')),
  };
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health');
  if (!res.ok) {
    throw new GenerateClientError('INTERNAL', `Health check failed (${res.status})`);
  }
  return (await res.json()) as HealthResponse;
}

function numOrUndefined(v: string): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
