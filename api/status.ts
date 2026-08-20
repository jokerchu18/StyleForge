// Combined status endpoint: /api/health, /api/models, /api/pricing
// Merged to stay within Vercel Hobby plan's 12-function limit.
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { HealthResponse } from '../src/shared/generate-types.js';
import { sendJson, methodNotAllowed } from './_shared/http.js';
import { providersStatus } from './_shared/registry.js';
import { PLANS } from './_shared/pricing.js';
import { sendError } from './_shared/errors.js';

interface ReplicateModelOption {
  id: string;
  label: string;
}

const MODELS: ReplicateModelOption[] = [
  { id: 'flux-kontext-pro', label: 'FLUX Kontext Pro' },
  { id: 'nano-banana-2', label: 'Nano Banana 2' },
  { id: 'gpt-image-2', label: 'GPT Image 2' },
];

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const path = url.pathname;

    if (path === '/api/health') {
      if (methodNotAllowed(req, res, ['GET'])) return;
      const body: HealthResponse = { ok: true, providers: providersStatus() };
      sendJson(res, 200, body);
      return;
    }

    if (path === '/api/models') {
      if (methodNotAllowed(req, res, ['GET'])) return;
      sendJson(res, 200, { models: MODELS });
      return;
    }

    if (path === '/api/pricing') {
      if (methodNotAllowed(req, res, ['GET'])) return;
      sendJson(res, 200, { plans: PLANS });
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    sendError(res, err);
  }
}