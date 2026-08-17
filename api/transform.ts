import type { IncomingMessage, ServerResponse } from 'node:http';
import type { QualityLevel } from '../src/shared/generate-types.js';
import { QUALITY_LEVELS } from '../src/shared/generate-types.js';
import { readBinaryBody, sendImage, methodNotAllowed } from './_shared/http.js';
import { ApiError, sendError } from './_shared/errors.js';
import { sniffMime } from './_shared/image.js';
import { getProvider } from './_shared/registry.js';
import { styleCatalog } from './_shared/styleCatalog.js';

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

    const provider = getProvider(query.provider);
    if (!provider.transform) {
      throw new ApiError(
        'BAD_REQUEST',
        `Provider "${provider.id}" does not support style transfer`,
        provider.id,
      );
    }

    const result = await provider.transform({ imageBytes: bytes, mime, style, quality });

    sendImage(res, {
      bytes: result.bytes,
      mime: result.mime,
      width: result.width,
      height: result.height,
      model: result.model,
      prompt: style.prompt,
      provider: provider.id,
      styleId: style.id,
      seed: result.seed,
    });
  } catch (err) {
    sendError(res, err);
  }
}
