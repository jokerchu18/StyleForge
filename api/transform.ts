// POST /api/transform — authenticated, metered image-to-image generation.
// The client only sends style_id + image (+ optional quality/provider). All
// billing, permissions, image API calls and persistence happen server-side.
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { QualityLevel } from '../src/shared/generate-types.js';
import { QUALITY_LEVELS } from '../src/shared/generate-types.js';
import { readBinaryBody, sendImage, methodNotAllowed } from './_shared/http.js';
import { ApiError, sendError } from './_shared/errors.js';
import { sniffMime } from './_shared/image.js';
import { getUserId } from './_shared/auth.js';
import { styleCatalog } from './_shared/styleCatalog.js';
import { runChargedGeneration } from './_shared/billing.js';

function parseQuery(url: string | undefined): Record<string, string> {
  const q = url?.split('?')[1];
  if (!q) return {};
  return Object.fromEntries(new URLSearchParams(q).entries());
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    if (methodNotAllowed(req, res, ['POST'])) return;

    const userId = await getUserId(req);

    const query = parseQuery(req.url);
    const styleId = query.styleId ?? '';
    const style = await styleCatalog.get(styleId);
    if (!style) {
      throw new ApiError('BAD_REQUEST', `Unknown styleId: ${styleId}`);
    }
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

    const result = await runChargedGeneration({
      userId,
      style,
      providerId: query.provider,
      quality,
      imageBytes: bytes,
      mime,
    });

    sendImage(res, {
      bytes: result.bytes,
      mime: result.mime,
      width: result.width,
      height: result.height,
      model: result.model,
      provider: result.providerId,
      styleId: style.id,
      seed: result.seed,
      generationId: result.generationId,
      costUnits: result.costUnits,
    });
  } catch (err) {
    sendError(res, err);
  }
}
