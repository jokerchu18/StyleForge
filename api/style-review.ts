// POST /api/style-review — approve or reject a community style submission.
// Approving generates a unique slug and writes the style into the public
// `styles` table so it immediately appears in Explore and the Image-to-Image
// selector. Only admins (env STYLE_ADMIN_EMAILS) may review.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson, methodNotAllowed, readJsonBody } from './_shared/http.js';
import { communityStyleRepository } from './_shared/styleCatalog.js';
import { supabaseAdmin } from './_shared/supabase.js';
import { ApiError, sendError } from './_shared/errors.js';

function slugify(s: string): string {
  const base =
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'style';
  return base;
}

async function isAdmin(req: IncomingMessage): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const allowed = (process.env.STYLE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.length) return false;
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
  if (!token) return false;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return !!data.user?.email && allowed.includes(data.user.email.toLowerCase());
}

async function slugExists(db: NonNullable<typeof supabaseAdmin>, slug: string): Promise<boolean> {
  const { data } = await db.from('styles').select('slug').eq('slug', slug).maybeSingle();
  return !!data;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    if (methodNotAllowed(req, res, ['POST'])) return;
    if (!(await isAdmin(req))) {
      throw new ApiError('BAD_REQUEST', 'Not authorized to review styles');
    }

    const body = (await readJsonBody(req)) as {
      submissionId?: string;
      decision?: 'approved' | 'rejected';
      note?: string;
    };
    if (!body.submissionId || !body.decision) {
      throw new ApiError('BAD_REQUEST', 'Missing submissionId or decision');
    }

    const record = await communityStyleRepository.get(body.submissionId);
    if (!record) {
      throw new ApiError('BAD_REQUEST', 'Submission not found');
    }

    if (body.decision === 'rejected') {
      await communityStyleRepository.review(body.submissionId, 'rejected', body.note);
      sendJson(res, 200, { status: 'rejected' });
      return;
    }

    // Approved → write into the public styles table with a unique slug.
    const db = supabaseAdmin!;
    let slug = slugify(record.labelKey);
    let candidate = slug;
    let n = 2;
    while (await slugExists(db, candidate)) {
      candidate = `${slug}-${n++}`;
    }

    const { data: inserted, error } = await db
      .from('styles')
      .insert({
        slug: candidate,
        label: record.labelKey,
        description: record.descriptionKey,
        category: record.category,
        tags: record.tags ?? [],
        preview_image: record.sampleImage,
        examples: [record.sampleImage],
        creator: record.userId,
        prompt: record.prompt,
        model: record.model || null,
        generation_config: {
          replicate: {
            model: record.model,
            ...(record.seed != null ? { seed: record.seed } : {}),
          },
        },
        status: 'active',
      })
      .select('slug')
      .single();

    if (error) {
      throw new ApiError('INTERNAL', `Failed to publish style: ${error.message}`);
    }
    await communityStyleRepository.review(body.submissionId, 'approved');

    sendJson(res, 201, { status: 'approved', slug: (inserted as { slug: string }).slug });
  } catch (err) {
    sendError(res, err);
  }
}
