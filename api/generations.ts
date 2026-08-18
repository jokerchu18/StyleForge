// /api/generations — the user's generation history (My Creations) and delete.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson, methodNotAllowed } from './_shared/http.js';
import { getUserId } from './_shared/auth.js';
import { supabaseAdmin } from './_shared/supabase.js';
import { signedImageUrl } from './_shared/billing.js';
import { ApiError, sendError } from './_shared/errors.js';

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
    if (!supabaseAdmin) throw new Error('Supabase not configured');
    const method = (req.method ?? 'GET').toUpperCase();
    const userId = await getUserId(req);

    if (method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw new ApiError('INTERNAL', error.message);

      // Attach style labels (generations.style_id is the slug; styles.slug matches).
      const slugs = [...new Set((data as { style_id: string }[]).map((g) => g.style_id))];
      const labels = new Map<string, string>();
      if (slugs.length) {
        const { data: rows } = await supabaseAdmin
          .from('styles')
          .select('slug,label')
          .in('slug', slugs);
        for (const r of (rows ?? []) as { slug: string; label: string }[]) {
          labels.set(r.slug, r.label);
        }
      }

      const items = await Promise.all(
        (data as {
          id: string;
          style_id: string;
          model: string;
          generation_type: string;
          cost_units: number;
          output_image: string | null;
          status: string;
          created_at: string;
        }[]).map(async (g) => ({
          id: g.id,
          styleId: g.style_id,
          styleLabel: labels.get(g.style_id) ?? g.style_id,
          model: g.model,
          generationType: g.generation_type,
          costUnits: g.cost_units,
          imageUrl: g.output_image ? await signedImageUrl(g.output_image) : null,
          status: g.status,
          createdAt: g.created_at,
        })),
      );

      sendJson(res, 200, { items });
      return;
    }

    if (method === 'DELETE') {
      const query = parseQuery(req.url);
      const id = query.id ?? '';
      if (!id) throw new ApiError('BAD_REQUEST', 'Missing id');
      const { error } = await supabaseAdmin
        .from('generations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw new ApiError('INTERNAL', error.message);
      sendJson(res, 200, { deleted: true });
      return;
    }

    methodNotAllowed(req, res, ['GET', 'DELETE']);
  } catch (err) {
    sendError(res, err);
  }
}
