// /api/generate — async image-to-image generation.
//
// POST returns a generationId + predictionId immediately (after billing is
// pre-authorized). The client then polls GET until the image is ready, showing
// a "Generating…" state in between. This avoids holding a long HTTP request
// against the upstream prediction (which can outlive Vercel function timeouts).
//
//   POST /api/generate?styleId=…&quality=…&provider=…   (body = image bytes)
//   → { generationId, predictionId, status: "pending", newBalance }
//
//   GET /api/generate?id=<generationId>
//   → { status: "pending" | "processing" | "succeeded" | "failed", imageUrl?, costUnits? }
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { QualityLevel } from '../src/shared/generate-types.js';
import { QUALITY_LEVELS } from '../src/shared/generate-types.js';
import { readBinaryBody, sendJson, methodNotAllowed } from './_shared/http.js';
import { ApiError, sendError } from './_shared/errors.js';
import { sniffMime } from './_shared/image.js';
import { getUserId } from './_shared/auth.js';
import { styleCatalog } from './_shared/styleCatalog.js';
import {
  getGenerationRow,
  loadPreAuthorizedContext,
  preAuthorizeGeneration,
  setGenerationPredictionId,
  finalizeGenerationSuccess,
  finalizeGenerationFailure,
  signedImageUrl,
} from './_shared/billing.js';
import {
  createPrediction,
  downloadOutput,
  getPredictionResult,
} from './_providers/replicate.js';
import { resolveModelDef } from './_providers/models.js';

function parseQuery(url: string | undefined): Record<string, string> {
  const q = url?.split('?')[1];
  if (!q) return {};
  return Object.fromEntries(new URLSearchParams(q).entries());
}

function webhookUrl(): string | undefined {
  return process.env.REPLICATE_WEBHOOK_URL || undefined;
}

/** Providers that expose an async prediction API (Replicate-backed). */
const ASYNC_PROVIDERS = new Set(['replicate']);

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const method = (req.method ?? 'GET').toUpperCase();
    const query = parseQuery(req.url);

    if (method === 'POST') {
      const userId = await getUserId(req);

      const styleId = query.styleId ?? '';
      const style = await styleCatalog.get(styleId);
      if (!style) throw new ApiError('BAD_REQUEST', `Unknown styleId: ${styleId}`);
      if (style.engine !== 'cloud' || !style.prompt) {
        throw new ApiError('BAD_REQUEST', `Style "${styleId}" is not a cloud style`);
      }

      let quality: QualityLevel | undefined;
      if (query.quality !== undefined) {
        if (!QUALITY_LEVELS.includes(query.quality as QualityLevel)) {
          throw new ApiError('BAD_REQUEST', `Invalid quality: ${query.quality}`);
        }
        quality = query.quality as QualityLevel;
      }

      const { bytes } = await readBinaryBody(req);
      const mime = sniffMime(bytes);

      // Billing is pre-authorized now; the generation record is created with
      // status "pending" and becomes the poll handle.
      const ctx = await preAuthorizeGeneration({
        userId,
        style,
        providerId: query.provider,
        quality,
        imageBytes: bytes,
        mime,
      });

      const transformOpts = { imageBytes: bytes, mime, style, quality };

      // Sync providers (mock/dashscope/seedream) have no prediction API — run
      // their transform inline and return the finished image immediately.
      if (!ASYNC_PROVIDERS.has(ctx.provider.id)) {
        try {
          if (!ctx.provider.transform) {
            throw new ApiError('BAD_REQUEST', `Provider "${ctx.provider.id}" does not support style transfer`);
          }
          const result = await ctx.provider.transform(transformOpts);
          await finalizeGenerationSuccess(ctx, result);
          const fresh = await getGenerationRow(ctx.generationId, userId);
          sendJson(res, 200, {
            status: 'succeeded',
            generationId: ctx.generationId,
            imageUrl: fresh.output_image ? await signedImageUrl(fresh.output_image) : null,
            costUnits: ctx.cost.units,
            newBalance: ctx.newBalance,
          });
          return;
        } catch (err) {
          await finalizeGenerationFailure(ctx);
          throw err;
        }
      }

      let predictionId = '';
      try {
        const prediction = await createPrediction(transformOpts, webhookUrl());

        predictionId = prediction.id;
        await setGenerationPredictionId(ctx.generationId, prediction.id);

        // If it already finished synchronously, finalize immediately.
        if (prediction.status === 'succeeded') {
          const result = await downloadOutput(prediction.output, modelLabel(style));
          await finalizeGenerationSuccess(ctx, result);
          const fresh = await getGenerationRow(ctx.generationId, userId);
          sendJson(res, 200, {
            status: 'succeeded',
            generationId: ctx.generationId,
            imageUrl: fresh.output_image ? await signedImageUrl(fresh.output_image) : null,
            costUnits: ctx.cost.units,
            newBalance: ctx.newBalance,
          });
          return;
        }
        if (prediction.status === 'failed' || prediction.status === 'canceled') {
          await finalizeGenerationFailure(ctx);
          sendJson(res, 200, { status: 'failed', generationId: ctx.generationId });
          return;
        }
      } catch (err) {
        // Prediction creation failed — roll back the pre-authorization.
        await finalizeGenerationFailure(ctx);
        throw err;
      }

      sendJson(res, 202, {
        status: 'pending',
        generationId: ctx.generationId,
        predictionId,
        newBalance: ctx.newBalance,
      });
      return;
    }

    if (method === 'GET') {
      const userId = await getUserId(req);
      const generationId = query.id ?? '';
      if (!generationId) throw new ApiError('BAD_REQUEST', 'Missing id');

      const row = await getGenerationRow(generationId, userId);

      if (row.status === 'succeeded') {
        sendJson(res, 200, {
          status: 'succeeded',
          generationId: row.id,
          imageUrl: row.output_image ? await signedImageUrl(row.output_image) : null,
          costUnits: row.cost_units,
        });
        return;
      }
      if (row.status === 'failed') {
        sendJson(res, 200, { status: 'failed', generationId: row.id });
        return;
      }

      // status === 'pending' — poll the upstream prediction.
      if (!row.prediction_id) {
        sendJson(res, 200, { status: 'pending', generationId: row.id });
        return;
      }

      const ctx = await loadPreAuthorizedContext(generationId, userId);
      const prediction = await getPredictionResult(row.prediction_id);

      if (prediction.status === 'succeeded') {
        const result = await downloadOutput(prediction.output, modelLabel(ctx.style));
        await finalizeGenerationSuccess(ctx, result);
        const fresh = await getGenerationRow(generationId, userId);
        sendJson(res, 200, {
          status: 'succeeded',
          generationId: row.id,
          imageUrl: fresh.output_image ? await signedImageUrl(fresh.output_image) : null,
          costUnits: ctx.cost.units,
        });
        return;
      }
      if (prediction.status === 'failed' || prediction.status === 'canceled') {
        await finalizeGenerationFailure(ctx);
        sendJson(res, 200, { status: 'failed', generationId: row.id });
        return;
      }

      sendJson(res, 200, { status: 'processing', generationId: row.id });
      return;
    }

    methodNotAllowed(req, res, ['POST', 'GET']);
  } catch (err) {
    sendError(res, err);
  }
}

function modelLabel(style: Parameters<typeof resolveModelDef>[0]): string {
  try {
    return resolveModelDef(style).model || 'replicate';
  } catch {
    return 'replicate';
  }
}
