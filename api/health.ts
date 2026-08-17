import type { IncomingMessage, ServerResponse } from 'node:http';
import type { HealthResponse } from '../src/shared/generate-types.js';
import { sendJson, methodNotAllowed } from './_shared/http.js';
import { providersStatus } from './_shared/registry.js';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (methodNotAllowed(req, res, ['GET'])) return;
  const body: HealthResponse = { ok: true, providers: providersStatus() };
  sendJson(res, 200, body);
}
