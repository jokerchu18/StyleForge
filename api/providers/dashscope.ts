// DashScope (阿里云百炼 / 通义万相) provider — image edit / style transfer.
// Async task model: submit -> poll /tasks/{id} until SUCCEEDED -> download the
// result URL inside this function and return bytes (never leak the URL to the
// client, which would taint canvas for cross-origin download).
import type {
  GenerateImageResult,
  ImageProvider,
  TransformImageOptions,
} from '../_shared/provider.js';
import { ApiError } from '../_shared/errors.js';
import { generateTimeoutMs } from '../_shared/provider.js';

const DASHSCOPE_BASE = 'https://dashscope.aliyuncs.com/api/v1';
const POLL_INTERVAL_MS = 2000;

interface SubmitResponse {
  output?: { task_id?: string };
  code?: string;
  message?: string;
}

interface TaskResponse {
  output?: {
    task_status?: string;
    results?: { url?: string }[];
    message?: string;
  };
  code?: string;
  message?: string;
}

export const dashscopeProvider: ImageProvider = {
  id: 'dashscope',
  label: '通义万相 (DashScope)',
  isConfigured: () => Boolean(process.env.DASHSCOPE_API_KEY),

  async transform(opts: TransformImageOptions): Promise<GenerateImageResult> {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    const deadline = Date.now() + generateTimeoutMs();
    const b64 = Buffer.from(opts.imageBytes).toString('base64');
    const baseImageUrl = `data:${opts.mime};base64,${b64}`;

    // 1. Submit async image-edit task (style transfer via preset.function).
    const submitRes = await fetch(
      `${DASHSCOPE_BASE}/services/aigc/image2image/image-synthesis`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-Async': 'enable',
        },
        body: JSON.stringify({
          model: 'wanx2.1-imageedit',
          input: {
            prompt: opts.style.prompt ?? '',
            base_image_url: baseImageUrl,
            function: opts.style.providerOverrides?.dashscope?.dashscopeFunction,
          },
          parameters: { n: 1, prompt_extend: true, watermark: false },
        }),
        signal: AbortSignal.timeout(generateTimeoutMs()),
      },
    );

    if (!submitRes.ok) {
      throw new ApiError('UPSTREAM_ERROR', `DashScope edit submit failed (${submitRes.status})`, 'dashscope');
    }
    const submitted = (await submitRes.json()) as SubmitResponse;
    const taskId = submitted.output?.task_id;
    if (!taskId) {
      throw new ApiError('UPSTREAM_ERROR', `DashScope edit missing task_id`, 'dashscope');
    }

    // 2. Poll until SUCCEEDED, then download the result URL.
    while (Date.now() < deadline) {
      const taskRes = await fetch(`${DASHSCOPE_BASE}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15_000),
      });
      if (!taskRes.ok) {
        throw new ApiError('UPSTREAM_ERROR', `DashScope edit poll failed (${taskRes.status})`, 'dashscope');
      }
      const task = (await taskRes.json()) as TaskResponse;
      const status = task.output?.task_status;
      if (status === 'SUCCEEDED') {
        const url = task.output?.results?.[0]?.url;
        if (!url) {
          throw new ApiError('UPSTREAM_ERROR', 'DashScope edit succeeded without result URL', 'dashscope');
        }
        const imgRes = await fetch(url, { signal: AbortSignal.timeout(15_000) });
        if (!imgRes.ok) {
          throw new ApiError('UPSTREAM_ERROR', `DashScope image download failed (${imgRes.status})`, 'dashscope');
        }
        const bytes = new Uint8Array(await imgRes.arrayBuffer());
        const mime = imgRes.headers.get('content-type')?.split(';')[0] ?? 'image/png';
        return { bytes, mime, model: 'wanx2.1-imageedit' };
      }
      if (status === 'FAILED' || status === 'CANCELED') {
        throw new ApiError(
          'UPSTREAM_ERROR',
          `DashScope edit ${status}: ${task.output?.message ?? task.message ?? ''}`,
          'dashscope',
        );
      }
      await sleep(POLL_INTERVAL_MS);
    }

    throw new ApiError('UPSTREAM_TIMEOUT', 'DashScope edit timed out', 'dashscope');
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
