// POST /api/checkout — create a Creem checkout session for the user.
// Returns { url } to redirect to. NOTE: this only creates the session; grants
// happen when the Creem webhook fires (never trust a frontend success page).
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson, methodNotAllowed, readJsonBody } from './_shared/http.js';
import { getUserId } from './_shared/auth.js';
import { creemApiKey, creemBaseUrl } from './_shared/creem.js';
import { ApiError, sendError } from './_shared/errors.js';

const PRODUCT_IDS: Record<string, string | undefined> = {
  plus: process.env.CREEM_PRODUCT_PLUS_ID,
  pro: process.env.CREEM_PRODUCT_PRO_ID,
};

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    if (methodNotAllowed(req, res, ['POST'])) return;
    const userId = await getUserId(req);

    const body = (await readJsonBody(req)) as { plan?: string };
    const productId = body.plan ? PRODUCT_IDS[body.plan] : undefined;
    if (!productId) {
      throw new ApiError('BAD_REQUEST', 'Unsupported plan');
    }
    if (!creemApiKey()) {
      throw new ApiError('INTERNAL', 'Creem is not configured yet');
    }

    const creemRes = await fetch(`${creemBaseUrl()}/checkouts`, {
      method: 'POST',
      headers: {
        'x-api-key': creemApiKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: `${process.env.SITE_URL ?? 'https://www.styleforge.org'}/pricing?success=1`,
        metadata: { user_id: userId },
      }),
    });

    if (!creemRes.ok) {
      const errBody = await creemRes.text().catch(() => '');
      throw new ApiError('INTERNAL', `Creem checkout failed (${creemRes.status}): ${errBody}`);
    }

    const json = (await creemRes.json()) as {
      checkout_url?: string;
    };
    const url = json.checkout_url;
    if (!url) throw new ApiError('INTERNAL', 'Creem returned no checkout url');

    sendJson(res, 200, { url });
  } catch (err) {
    sendError(res, err);
  }
}