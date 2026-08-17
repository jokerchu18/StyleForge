// /api/styles — style catalog (GET) + community style submission (POST).
// GET strips the authoritative `prompt` from cloud styles (it never leaves the
// server), so the response only carries what the UI needs to render.
//
// POST accepts an authenticated StyleSubmission and stores it as pending.
// Reserved (not implemented yet):
//   PATCH  /api/styles/:id/review — admin approves/rejects
//   GET    /api/styles/mine       — the current user's submissions
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PublicStyleDefinition, StyleDefinition, StyleEngine, StyleCategory, StyleTier, StyleSubmission } from '../src/shared/style-types.js';
import { CATEGORY_PRESETS } from '../src/shared/styles-catalog.js';
import { sendJson, methodNotAllowed, readJsonBody } from './_shared/http.js';
import { styleCatalog, communityStyleRepository } from './_shared/styleCatalog.js';
import { supabaseAdmin } from './_shared/supabase.js';
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

async function getUserId(req: IncomingMessage): Promise<string> {
  if (!supabaseAdmin) {
    throw new ApiError('INTERNAL', 'Supabase service role is not configured');
  }
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
  if (!token) {
    throw new ApiError('BAD_REQUEST', 'Missing bearer token');
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw new ApiError('BAD_REQUEST', 'Invalid or expired token');
  }
  return data.user.id;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const method = (req.method ?? 'GET').toUpperCase();

    if (method === 'GET') {
      const query = parseQuery(req.url);
      const engine = query.engine as StyleEngine | undefined;
      const category = query.category as StyleCategory | undefined;
      const tier = query.tier as StyleTier | undefined;

      const all = await styleCatalog.list();
      const styles = all.filter((s) => {
        if (engine && s.engine !== engine) return false;
        if (category && s.category !== category) return false;
        if (tier && s.tier !== tier) return false;
        return true;
      });

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
