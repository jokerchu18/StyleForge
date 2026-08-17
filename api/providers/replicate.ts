// Replicate provider — runs any image-to-image model on replicate.com.
// Async prediction model: create prediction -> poll until succeeded -> download
// the output image (never leak the output URL to the client).
//
// Replicate is a model platform, so the model and its input schema are
// configurable: per-style overrides (providerOverrides.replicate) take
// precedence over the REPLICATE_MODEL / REPLICATE_MODEL_VERSION env vars.
import type {
  GenerateImageResult,
  ImageProvider,
  TransformImageOptions,
} from '../_shared/provider.js';
import type { ReplicateStyleOverrides } from '../../src/shared/style-types.js';
import { ApiError } from '../_shared/errors.js';
import { generateTimeoutMs } from '../_shared/provider.js';

const REPLICATE_BASE = 'https://api.replicate.com/v1';
const POLL_INTERVAL_MS = 1500;

interface PredictionResponse {
  id?: string;
  status?: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: unknown;
  error?: string;
}

export const replicateProvider: ImageProvider = {
  id: 'replicate',
  label: 'Replicate',
  isConfigured: () => Boolean(process.env.REPLICATE_API_TOKEN),

  async transform(opts: TransformImageOptions): Promise<GenerateImageResult> {
    const token = process.env.REPLICATE_API_TOKEN;
    const overrides = opts.style.providerOverrides?.replicate as
      | ReplicateStyleOverrides
      | undefined;
    const model = overrides?.model ?? process.env.REPLICATE_MODEL;
    const version = overrides?.version ?? process.env.REPLICATE_MODEL_VERSION;

    if (!model && !version) {
      throw new ApiError(
        'UPSTREAM_ERROR',
        'Replicate model/version is not configured (set REPLICATE_MODEL or providerOverrides.replicate)',
        'replicate',
      );
    }

    const imageKey = overrides?.imageKey ?? 'image';
    const promptKey = overrides?.promptKey ?? 'prompt';
    const dataUri = `data:${opts.mime};base64,${Buffer.from(opts.imageBytes).toString('base64')}`;

    const input: Record<string, unknown> = {
      ...(overrides?.input ?? {}),
      [imageKey]: dataUri,
    };
    if (opts.style.prompt) input[promptKey] = opts.style.prompt;
    if (overrides?.seed != null) input.seed = overrides.seed;

    const body: Record<string, unknown> = { input };
    if (version) body.version = version;
    else if (model) body.model = model;

    const deadline = Date.now() + generateTimeoutMs();

    // 1. Create prediction.
    const createRes = await fetch(`${REPLICATE_BASE}/predictions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    if (!createRes.ok) {
      throw new ApiError(
        'UPSTREAM_ERROR',
        `Replicate create failed (${createRes.status}): ${await safeText(createRes)}`,
        'replicate',
      );
    }

    const prediction = (await createRes.json()) as PredictionResponse;
    if (prediction.status === 'succeeded') {
      return downloadOutput(prediction.output, model ?? version ?? 'replicate');
    }
    if (prediction.status === 'failed') {
      throw new ApiError(
        'UPSTREAM_ERROR',
        `Replicate prediction failed: ${prediction.error ?? ''}`,
        'replicate',
      );
    }
    const id = prediction.id;
    if (!id) {
      throw new ApiError('UPSTREAM_ERROR', 'Replicate create missing prediction id', 'replicate');
    }

    // 2. Poll until succeeded/failed.
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);
      const pollRes = await fetch(`${REPLICATE_BASE}/predictions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (!pollRes.ok) {
        throw new ApiError(
          'UPSTREAM_ERROR',
          `Replicate poll failed (${pollRes.status})`,
          'replicate',
        );
      }
      const p = (await pollRes.json()) as PredictionResponse;
      if (p.status === 'succeeded') {
        return downloadOutput(p.output, model ?? version ?? 'replicate');
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

async function downloadOutput(output: unknown, model: string): Promise<GenerateImageResult> {
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
