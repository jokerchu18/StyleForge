// /api/styles — style catalog (GET) + community style submission (POST).
// GET strips the authoritative `prompt` from cloud styles (it never leaves the
// server), so the response only carries what the UI needs to render.
//
// POST accepts an authenticated StyleSubmission and stores it as pending.
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PublicStyleDefinition, StyleDefinition, StyleCategory, StyleSubmission } from '../src/shared/style-types.js';
import { CATEGORY_PRESETS } from '../src/shared/styles-catalog.js';
import { sendJson, methodNotAllowed, readJsonBody } from './_shared/http.js';
import { styleCatalog, communityStyleRepository } from './_shared/styleCatalog.js';
import { getUserId } from './_shared/auth.js';
import { ApiError, sendError } from './_shared/errors.js';

function parseQuery(url: string | undefined): Record<string, string> {
  const q = url?.split('?')[1];
  if (!q) return {};
  return Object.fromEntries(new URLSearchParams(q).entries());
}

function toPublic(style: StyleDefinition): PublicStyleDefinition {
  const { prompt: _prompt, ...rest } = style;
  return rest;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const method = (req.method ?? 'GET').toUpperCase();

    if (method === 'GET') {
      const query = parseQuery(req.url);
      const category = query.category as StyleCategory | undefined;
      const search = (query.search ?? '').trim().toLowerCase();
      const sort = query.sort ?? 'popular';

      const all = await styleCatalog.list();
      let styles = all.filter((s) => {
        if (category && s.category !== category) return false;
        if (search) {
          const haystack = [
            s.label ?? '',
            s.description ?? '',
            s.category,
            (s.tags ?? []).join(' '),
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      });

      if (sort === 'newest') {
        styles = [...styles].sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
      } else {
        // popular / trending — live usage count.
        styles = [...styles].sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0));
      }

      const present = new Set(styles.map((s) => s.category));
      const categories = [
        ...CATEGORY_PRESETS.filter((c) => present.has(c)),
        ...[...present].filter((c) => !CATEGORY_PRESETS.includes(c)),
      ];

      sendJson(res, 200, { styles: styles.map(toPublic), categories });
      return;
    }

    if (method === 'POST') {
      const userId = await getUserId(req);
      const body = (await readJsonBody(req)) as StyleSubmission;
      if (!body.label || !body.prompt || !body.model || !body.sampleImage || !body.category) {
        throw new ApiError('BAD_REQUEST', 'Missing required fields (label, prompt, model, sampleImage, category)');
      }
      const record = await communityStyleRepository.create(userId, body);
      sendJson(res, 201, record);
      return;
    }

    methodNotAllowed(req, res, ['GET', 'POST']);
  } catch (err) {
    sendError(res, err);
  }
}
