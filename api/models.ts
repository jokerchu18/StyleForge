// GET /api/models — serve the three available models for the Create Style form.
// The list is hardcoded in api/providers/models.ts.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson, methodNotAllowed } from './_shared/http.js';

export interface ReplicateModelOption {
  /** Model registry id, e.g. 'nano-banana-2' or 'gpt-image-2'. */
  id: string;
  label: string;
}

/** Three available models. The label is what users see in the form. */
const MODELS: ReplicateModelOption[] = [
  { id: 'flux-kontext-pro', label: 'FLUX Kontext Pro' },
  { id: 'nano-banana-2', label: 'Nano Banana 2' },
  { id: 'gpt-image-2', label: 'GPT Image 2' },
];

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (methodNotAllowed(req, res, ['GET'])) return;
  sendJson(res, 200, { models: MODELS });
}
