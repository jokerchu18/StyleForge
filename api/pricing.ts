// GET /api/pricing — the pricing tiers, from the single server-side source.
// The frontend never hardcodes prices or generation quotas.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson, methodNotAllowed } from './_shared/http.js';
import { PLANS } from './_shared/pricing.js';
import { sendError } from './_shared/errors.js';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    if (methodNotAllowed(req, res, ['GET'])) return;
    sendJson(res, 200, { plans: PLANS });
  } catch (err) {
    sendError(res, err);
  }
}
