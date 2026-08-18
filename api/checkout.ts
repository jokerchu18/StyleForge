// POST /api/checkout — create a Lemon Squeezy checkout session for the user.
// Returns { url } to redirect to. NOTE: this only creates the session; grants
// happen when the LS webhook fires (never trust a frontend success page).
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson, methodNotAllowed, readJsonBody } from './_shared/http.js';
import { getUserId } from './_shared/auth.js';
import { lsApiKey } from './_shared/ls.js';
import { ApiError, sendError } from './_shared/errors.js';

const LS_API = 'https://api.lemonsqueezy.com/v1';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    if (methodNotAllowed(req, res, ['POST'])) return;
    const userId = await getUserId(req);

    const body = (await readJsonBody(req)) as { plan?: string };
    const variant =
      body.plan === 'plus'
        ? process.env.LS_VARIANT_PLUS_ID
        : body.plan === 'pro'
          ? process.env.LS_VARIANT_PRO_ID
          : undefined;
    if (!variant) {
      throw new ApiError('BAD_REQUEST', 'Unsupported plan');
    }
    if (!lsApiKey()) {
      throw new ApiError('INTERNAL', 'Lemon Squeezy is not configured yet');
    }

    const lsRes = await fetch(`${LS_API}/checkouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lsApiKey()}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: { custom: { user_id: userId } },
          },
          relationships: {
            store: { data: { type: 'stores', id: process.env.LS_STORE_ID } },
            variant: { data: { type: 'variants', id: String(variant) } },
          },
        },
      }),
    });

    if (!lsRes.ok) {
      throw new ApiError('INTERNAL', `Lemon Squeezy checkout failed (${lsRes.status})`);
    }
    const json = (await lsRes.json()) as {
      data?: { attributes?: { url?: string } };
    };
    const url = json.data?.attributes?.url;
    if (!url) throw new ApiError('INTERNAL', 'Lemon Squeezy returned no checkout url');

    sendJson(res, 200, { url });
  } catch (err) {
    sendError(res, err);
  }
}
