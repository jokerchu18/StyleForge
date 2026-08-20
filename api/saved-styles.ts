// /api/saved-styles — the user's saved styles (GET list / POST save / DELETE).
// The client sends a style slug; the server resolves the styles row id.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson, methodNotAllowed, readJsonBody } from './_shared/http.js';
import { getUserId } from './_shared/auth.js';
import { supabaseAdmin } from './_shared/supabase.js';
import { communityStyleRepository } from './_shared/styleCatalog.js';
import { ApiError, sendError } from './_shared/errors.js';

function parseQuery(url: string | undefined): Record<string, string> {
  const q = url?.split('?')[1];
  if (!q) return {};
  return Object.fromEntries(new URLSearchParams(q).entries());
}

async function styleIdBySlug(slug: string): Promise<string | null> {
  const { data } = await supabaseAdmin!
    .from('styles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  return data ? (data as { id: string }).id : null;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    if (!supabaseAdmin) throw new Error('Supabase not configured');
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const method = (req.method ?? 'GET').toUpperCase();
    const userId = await getUserId(req);

    // Route: /api/my-styles (merged into this file to stay within 12-function limit)
    if (url.pathname === '/api/my-styles') {
      if (methodNotAllowed(req, res, ['GET'])) return;
      const items = await communityStyleRepository.listByUser(userId);
      sendJson(res, 200, { items });
      return;
    }

    if (method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('saved_styles')
        .select('style_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new ApiError('INTERNAL', error.message);

      const ids = (data as { style_id: string }[]).map((r) => r.style_id);
      const savedSlugs: string[] = [];
      if (ids.length) {
        const { data: styles } = await supabaseAdmin
          .from('styles')
          .select('slug')
          .in('id', ids)
          .eq('status', 'active');
        savedSlugs.push(...((styles ?? []) as { slug: string }[]).map((s) => s.slug));
      }
      sendJson(res, 200, { items: savedSlugs });
      return;
    }

    if (method === 'POST') {
      const body = (await readJsonBody(req)) as { styleId?: string };
      if (!body.styleId) throw new ApiError('BAD_REQUEST', 'Missing styleId');
      const styleId = await styleIdBySlug(body.styleId);
      if (!styleId) throw new ApiError('BAD_REQUEST', 'Unknown style');
      const { error } = await supabaseAdmin
        .from('saved_styles')
        .upsert(
          { user_id: userId, style_id: styleId },
          { onConflict: 'user_id,style_id', ignoreDuplicates: true },
        );
      if (error) throw new ApiError('INTERNAL', error.message);
      sendJson(res, 201, { saved: true });
      return;
    }

    if (method === 'DELETE') {
      const query = parseQuery(req.url);
      const slug = query.styleId ?? '';
      if (!slug) throw new ApiError('BAD_REQUEST', 'Missing styleId');
      const styleId = await styleIdBySlug(slug);
      if (styleId) {
        const { error } = await supabaseAdmin
          .from('saved_styles')
          .delete()
          .eq('user_id', userId)
          .eq('style_id', styleId);
        if (error) throw new ApiError('INTERNAL', error.message);
      }
      sendJson(res, 200, { saved: false });
      return;
    }

    methodNotAllowed(req, res, ['GET', 'POST', 'DELETE']);
  } catch (err) {
    sendError(res, err);
  }
}
