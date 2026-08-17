// OpenAI gpt-image-1 provider (image edit / style transfer).
import type {
  GenerateImageResult,
  ImageProvider,
  TransformImageOptions,
} from '../_shared/provider.js';
import { ApiError } from '../_shared/errors.js';
import { generateTimeoutMs } from '../_shared/provider.js';

const OPENAI_EDIT_URL = 'https://api.openai.com/v1/images/edits';
const MODEL = 'gpt-image-1';

interface OpenAIImageResponse {
  data?: { b64_json?: string }[];
  error?: { message?: string; code?: string };
}

export const openaiProvider: ImageProvider = {
  id: 'openai',
  label: 'OpenAI (gpt-image-1)',
  isConfigured: () => Boolean(process.env.OPENAI_API_KEY),

  async transform(opts: TransformImageOptions): Promise<GenerateImageResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), generateTimeoutMs());
    try {
      const fd = new FormData();
      fd.set('model', MODEL);
      fd.set('image', new Blob([opts.imageBytes], { type: opts.mime }), `input.${extForMime(opts.mime)}`);
      fd.set('prompt', opts.style.prompt ?? '');
      fd.set('output_format', 'webp');
      // Edits endpoint does not support 'auto'; use a fixed size.
      fd.set('size', '1024x1024');
      fd.set('n', '1');

      const res = await fetch(OPENAI_EDIT_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: fd,
        signal: controller.signal,
      });

      if (!res.ok) {
        throw mapUpstreamError(res.status, await safeText(res));
      }
      const json = (await res.json()) as OpenAIImageResponse;
      const b64 = json.data?.[0]?.b64_json;
      if (!b64) {
        throw new ApiError('UPSTREAM_ERROR', 'OpenAI returned no image data');
      }
      const bytes = Buffer.from(b64, 'base64');
      return {
        bytes: new Uint8Array(bytes),
        mime: 'image/webp',
        model: MODEL,
      };
    } catch (err) {
      if (controller.signal.aborted) {
        throw new ApiError('UPSTREAM_TIMEOUT', 'OpenAI edit timed out', 'openai');
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

function mapUpstreamError(status: number, body: string): ApiError {
  if (status === 429) {
    return new ApiError('UPSTREAM_RATE_LIMITED', `OpenAI rate limited: ${body}`, 'openai');
  }
  if (status >= 500) {
    return new ApiError('UPSTREAM_ERROR', `OpenAI error ${status}: ${body}`, 'openai');
  }
  return new ApiError('UPSTREAM_ERROR', `OpenAI rejected request (${status}): ${body}`, 'openai');
}
