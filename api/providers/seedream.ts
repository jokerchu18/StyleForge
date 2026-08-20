// Seedream (即梦 / 豆包) via Volcengine Ark — OpenAI-compatible image edit.
// Uses response_format "b64_json" so we can decode and return raw bytes.
import type {
  GenerateImageResult,
  ImageProvider,
  TransformImageOptions,
} from '../_shared/provider.js';
import { ApiError } from '../_shared/errors.js';
import { generateTimeoutMs } from '../_shared/provider.js';

const ARK_BASE = process.env.ARK_BASE_URL ?? 'https://ark.cn-beijing.volces.com/api/v3';

interface SeedreamResponse {
  data?: { b64_json?: string; url?: string }[];
  error?: { message?: string };
}

export const seedreamProvider: ImageProvider = {
  id: 'seedream',
  label: 'Seedream (即梦)',
  isConfigured: () => Boolean(process.env.ARK_API_KEY),

  async transform(opts: TransformImageOptions): Promise<GenerateImageResult> {
    const apiKey = process.env.ARK_API_KEY;
    const model = process.env.ARK_EDIT_MODEL ?? 'doubao-seededit-3-0-i2i-250628';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), generateTimeoutMs());
    try {
      const fd = new FormData();
      fd.set('model', model);
      fd.set('image', new Blob([opts.imageBytes as BlobPart], { type: opts.mime }), `input.${extForMime(opts.mime)}`);
      fd.set('prompt', opts.style.prompt ?? '');
      fd.set('guidance_scale', '2.5');
      const seed = opts.style.providerOverrides?.seedream?.seed;
      fd.set('seed', seed != null ? String(seed) : '-1');
      fd.set('response_format', 'b64_json');
      fd.set('watermark', 'false');

      const res = await fetch(`${ARK_BASE}/images/edits`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: fd,
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new ApiError('UPSTREAM_ERROR', `Seedream edit error (${res.status}): ${await safeText(res)}`, 'seedream');
      }
      const json = (await res.json()) as SeedreamResponse;
      const item = json.data?.[0];
      if (item?.b64_json) {
        const bytes = Buffer.from(item.b64_json, 'base64');
        return { bytes: new Uint8Array(bytes), mime: 'image/png', model };
      }
      throw new ApiError('UPSTREAM_ERROR', 'Seedream edit returned no image data', 'seedream');
    } catch (err) {
      if (controller.signal.aborted) {
        throw new ApiError('UPSTREAM_TIMEOUT', 'Seedream edit timed out', 'seedream');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  },
};

function extForMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return '';
  }
}
