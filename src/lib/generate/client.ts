// Frontend client for the /api Vercel Functions.
import type {
  GenerateErrorCode,
  HealthResponse,
  StyleTransformRequest,
} from '../../shared/generate-types';

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
  prompt: string;
  width?: number;
  height?: number;
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

  const res = await fetch(`/api/transform?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': imageBlob.type || 'application/octet-stream' },
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
    prompt: decodeURIComponent(get('x-generate-prompt')),
    width: numOrUndefined(get('x-generate-width')),
    height: numOrUndefined(get('x-generate-height')),
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
