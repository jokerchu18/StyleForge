// Replicate provider — runs any image-to-image model on replicate.com.
// Async prediction model: create prediction -> poll until succeeded -> download
// the output image (never leak the output URL to the client).
//
// Model selection and per-model input schemas live in api/providers/models.ts;
// this module only owns the Replicate transport (create/poll/download) and the
// generic `replicate` provider that dispatches to whichever model the style
// resolves to (default FLUX Kontext Pro).
import type {
  GenerateImageResult,
  ImageProvider,
  TransformImageOptions,
} from '../_shared/provider.js';
import { ApiError } from '../_shared/errors.js';
import { generateTimeoutMs } from '../_shared/provider.js';
import { resolveModelDef, resolveModelVersion } from './models.js';

const REPLICATE_BASE = 'https://api.replicate.com/v1';
const POLL_INTERVAL_MS = 1500;

export type PredictionStatus =
  | 'starting'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export interface PredictionResponse {
  id?: string;
  status?: PredictionStatus;
  output?: unknown;
  error?: string;
}

export interface PredictionHandle {
  id: string;
  status: PredictionStatus;
  output?: unknown;
  error?: string;
}

export function replicateToken(): string {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new ApiError(
      'PROVIDER_NOT_CONFIGURED',
      'Replicate is not configured (REPLICATE_API_TOKEN)',
      'replicate',
    );
  }
  return token;
}

/**
 * Create a Replicate prediction from an explicit input + version (optionally
 * wiring a webhook) and return its handle. Does NOT poll — use
 * getPredictionResult to check status later.
 */
export async function createPredictionRaw(
  input: Record<string, unknown>,
  version: string,
  webhookUrl?: string,
): Promise<PredictionHandle> {
  const token = replicateToken();

  const body: Record<string, unknown> = { input, version };
  if (webhookUrl) {
    body.webhook = webhookUrl;
    body.webhook_events_filter = ['completed'];
  }

  const res = await fetch(`${REPLICATE_BASE}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new ApiError(
      'UPSTREAM_ERROR',
      `Replicate create failed (${res.status}): ${await safeText(res)}`,
      'replicate',
    );
  }

  const prediction = (await res.json()) as PredictionResponse;
  const id = prediction.id;
  if (!id) {
    throw new ApiError('UPSTREAM_ERROR', 'Replicate create missing prediction id', 'replicate');
  }
  return {
    id,
    status: prediction.status ?? 'starting',
    output: prediction.output,
    error: prediction.error,
  };
}

/**
 * Create a prediction for a style, resolving its model + input via the model
 * registry. Convenience wrapper over createPredictionRaw.
 */
export async function createPrediction(
  opts: TransformImageOptions,
  webhookUrl?: string,
): Promise<PredictionHandle> {
  const def = resolveModelDef(opts.style);
  const input = def.buildInput({
    imageBytes: opts.imageBytes,
    mime: opts.mime,
    prompt: opts.style.prompt ?? '',
    seed: opts.style.providerOverrides?.replicate?.seed,
    extra: opts.style.providerOverrides?.replicate?.input,
  });
  return createPredictionRaw(input, resolveModelVersion(def), webhookUrl);
}

/** Fetch the current state of a prediction (single poll). */
export async function getPredictionResult(id: string): Promise<PredictionHandle> {
  const token = replicateToken();
  const res = await fetch(`${REPLICATE_BASE}/predictions/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new ApiError(
      'UPSTREAM_ERROR',
      `Replicate poll failed (${res.status})`,
      'replicate',
    );
  }
  const p = (await res.json()) as PredictionResponse;
  return {
    id: p.id ?? id,
    status: p.status ?? 'processing',
    output: p.output,
    error: p.error,
  };
}

/** Download a prediction output into image bytes. */
export async function downloadOutput(
  output: unknown,
  model: string,
): Promise<GenerateImageResult> {
  const url = extractUrl(output);
  if (!url) {
    throw new ApiError('UPSTREAM_ERROR', 'Replicate succeeded without image output', 'replicate');
  }
  // Some models return a data URI directly.
  if (url.startsWith('data:')) {
    const mime = url.slice(5, url.indexOf(';'));
    const b64 = url.slice(url.indexOf(',') + 1);
    return { bytes: new Uint8Array(Buffer.from(b64, 'base64')), mime, model };
  }
  const imgRes = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!imgRes.ok) {
    throw new ApiError(
      'UPSTREAM_ERROR',
      `Replicate image download failed (${imgRes.status})`,
      'replicate',
    );
  }
  const bytes = new Uint8Array(await imgRes.arrayBuffer());
  const mime = imgRes.headers.get('content-type')?.split(';')[0] ?? 'image/png';
  return { bytes, mime, model };
}

export const replicateProvider: ImageProvider = {
  id: 'replicate',
  label: 'Replicate',
  isConfigured: () => Boolean(process.env.REPLICATE_API_TOKEN),

  async transform(opts: TransformImageOptions): Promise<GenerateImageResult> {
    const def = resolveModelDef(opts.style);
    const model = def.model;

    const prediction = await createPrediction(opts);
    if (prediction.status === 'succeeded') {
      return downloadOutput(prediction.output, model);
    }
    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new ApiError(
        'UPSTREAM_ERROR',
        `Replicate prediction ${prediction.status}: ${prediction.error ?? ''}`,
        'replicate',
      );
    }

    const deadline = Date.now() + generateTimeoutMs();
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);
      const p = await getPredictionResult(prediction.id);
      if (p.status === 'succeeded') {
        return downloadOutput(p.output, model);
      }
      if (p.status === 'failed' || p.status === 'canceled') {
        throw new ApiError(
          'UPSTREAM_ERROR',
          `Replicate prediction ${p.status}: ${p.error ?? ''}`,
          'replicate',
        );
      }
    }

    throw new ApiError('UPSTREAM_TIMEOUT', 'Replicate prediction timed out', 'replicate');
  },
};

/** Replicate output is a URL string, an array, or { url }. */
function extractUrl(output: unknown): string | undefined {
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) return extractUrl(output[0]);
  if (output && typeof output === 'object') {
    const o = output as Record<string, unknown>;
    if (typeof o.url === 'string') return o.url;
    if (typeof o.image === 'string') return o.image;
  }
  return undefined;
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return '';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
