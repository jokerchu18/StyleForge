// /api/replicate-webhook — Replicate calls this when an async prediction
// completes. It correlates the prediction to a pending generation, downloads
// the output, and finalizes the billing (success or refund). Client polling is
// the primary path; this webhook short-circuits it so completed images appear
// sooner and don't depend on the client still being open.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readJsonBody, sendJson, methodNotAllowed } from './_shared/http.js';
import { ApiError, sendError } from './_shared/errors.js';
import {
  contextFromRow,
  getGenerationRowByPredictionId,
  finalizeGenerationSuccess,
  finalizeGenerationFailure,
} from './_shared/billing.js';
import { downloadOutput } from './_providers/replicate.js';
import { resolveModelDef } from './_providers/models.js';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    if (methodNotAllowed(req, res, ['POST'])) return;

    const body = (await readJsonBody(req)) as {
      id?: string;
      status?: string;
      output?: unknown;
      error?: string;
    };

    const predictionId = body.id;
    if (!predictionId) {
      throw new ApiError('BAD_REQUEST', 'Missing prediction id');
    }

    const row = await getGenerationRowByPredictionId(predictionId);
    if (row.status === 'succeeded' || row.status === 'failed') {
      // Already finalized — idempotent no-op.
      sendJson(res, 200, { ok: true, status: row.status });
      return;
    }

    const ctx = await contextFromRow(row);

    if (body.status === 'succeeded') {
      let model = 'replicate';
      try {
        model = resolveModelDef(ctx.style).model || 'replicate';
      } catch {
        /* fall back to generic label */
      }
      const result = await downloadOutput(body.output, model);
      await finalizeGenerationSuccess(ctx, result);
      sendJson(res, 200, { ok: true, status: 'succeeded' });
      return;
    }

    if (body.status === 'failed' || body.status === 'canceled') {
      await finalizeGenerationFailure(ctx);
      sendJson(res, 200, { ok: true, status: 'failed' });
      return;
    }

    // starting / processing — not terminal; ignore.
    sendJson(res, 200, { ok: true, status: body.status ?? 'processing' });
  } catch (err) {
    sendError(res, err);
  }
}
