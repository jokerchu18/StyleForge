// GET /api/models — serve the preset Replicate model list for the Create Style
// form. Configured via the REPLICATE_MODELS env var (a JSON array of
// { id, label }). Kept server-side so the list is managed by config, not code.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson, methodNotAllowed } from './_shared/http.js';

export interface ReplicateModelOption {
  /** Full Replicate model identifier "owner/name" or "owner/name:version". */
  id: string;
  label: string;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (methodNotAllowed(req, res, ['GET'])) return;

  const raw = process.env.REPLICATE_MODELS;
  let models: ReplicateModelOption[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        models = parsed
          .filter((m) => m && typeof m.id === 'string' && typeof m.label === 'string')
          .map((m) => ({ id: m.id, label: m.label }));
      }
    } catch {
      // Malformed env — return empty list rather than crash.
      models = [];
    }
  }

  sendJson(res, 200, { models });
}
