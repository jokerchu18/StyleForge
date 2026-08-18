// GET /api/my-styles — the current user's style submissions and their status.
// Returns the creator's own submissions (including their private prompt, since
// this is the creator's own workspace — never other users' styles).
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson, methodNotAllowed } from './_shared/http.js';
import { getUserId } from './_shared/auth.js';
import { communityStyleRepository } from './_shared/styleCatalog.js';
import { sendError } from './_shared/errors.js';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    if (methodNotAllowed(req, res, ['GET'])) return;
    const userId = await getUserId(req);
    const items = await communityStyleRepository.listByUser(userId);
    sendJson(res, 200, { items });
  } catch (err) {
    sendError(res, err);
  }
}
