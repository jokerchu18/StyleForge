// Style catalog repository backed by Supabase. The public `styles` table holds
// both official styles (seeded) and approved community styles; private columns
// (prompt / generation_config) are readable only here — never via client RLS.

import type {
  CommunityStyleRecord,
  StyleDefinition,
  StyleStatus,
  StyleSubmission,
} from '../../src/shared/style-types.js';
import { supabaseAdmin } from './supabase.js';
import { ApiError } from './errors.js';
import { computeGenerationCost } from './pricing.js';
import { modelCreditCost } from '../providers/models.js';

export interface StyleCatalog {
  list(): Promise<StyleDefinition[]>;
  get(id: string): Promise<StyleDefinition | undefined>;
}

interface StyleRow {
  slug: string;
  label: string;
  description: string;
  category: string;
  tags: string[];
  preview_image: string;
  examples: string[] | null;
  creator: string | null;
  usage_count: number;
  like_count: number;
  is_premium: boolean;
  status: string;
  order: number;
  prompt: string;
  model: string | null;
  generation_config: Record<string, unknown> | null;
  created_at: string;
}

function toStyleDefinition(row: StyleRow): StyleDefinition {
  const style: StyleDefinition = {
    id: row.slug,
    engine: 'cloud',
    category: row.category,
    tier: row.is_premium ? 'premium' : 'free',
    source: row.creator ? 'community' : 'official',
    status: row.status as StyleStatus,
    label: row.label,
    description: row.description,
    sampleImage: publicImageUrl(row.preview_image),
    examples: (row.examples ?? []).map(publicImageUrl),
    tags: row.tags ?? [],
    order: row.order ?? 0,
    author: row.creator ?? undefined,
    isPremium: row.is_premium,
    usageCount: row.usage_count,
    likeCount: row.like_count,
    model: row.model ?? undefined,
    prompt: row.prompt,
    providerOverrides: row.generation_config as StyleDefinition['providerOverrides'],
  };

  // Credit cost for one generation. Prefer the model's registered cost (e.g.
  // gpt-image = 3, flux/nano-banana = 2); fall back to the provider tier.
  try {
    const modelId = style.providerOverrides?.replicate?.model;
    style.costUnits = modelCreditCost(modelId);
  } catch {
    try {
      const provider = style.providerOverrides?.replicate
        ? 'replicate'
        : style.providerOverrides?.dashscope
          ? 'dashscope'
          : 'replicate';
      style.costUnits = computeGenerationCost({ provider }).units;
    } catch {
      style.costUnits = 2;
    }
  }

  return style;
}

/**
 * Resolve a stored preview image reference into a URL the browser can load:
 * - a full URL (https://…) passes through untouched
 * - a legacy static path (/styles/api/…) passes through untouched
 * - a storage object path (styles/foo.png) becomes a public-bucket URL
 */
function publicImageUrl(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//.test(path) || path.startsWith('/')) return path;
  const base = process.env.SUPABASE_URL;
  if (!base) return path;
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${path}`;
}

function requireAdmin() {
  if (!supabaseAdmin) {
    throw new ApiError('INTERNAL', 'Supabase service role is not configured');
  }
  return supabaseAdmin;
}

/** Supabase-backed style catalog (official + approved community). */
export function createDbStyleCatalog(): StyleCatalog {
  return {
    async list() {
      const db = requireAdmin();
      const { data, error } = await db
        .from('styles')
        .select('*')
        .eq('status', 'active')
        .order('order', { ascending: true });
      if (error) {
        throw new ApiError('INTERNAL', `Failed to load styles: ${error.message}`);
      }
      return (data as StyleRow[]).map(toStyleDefinition);
    },

    async get(id) {
      const db = requireAdmin();
      const { data, error } = await db
        .from('styles')
        .select('*')
        .eq('slug', id)
        .eq('status', 'active')
        .maybeSingle();
      if (error) {
        throw new ApiError('INTERNAL', `Failed to load style: ${error.message}`);
      }
      return data ? toStyleDefinition(data as StyleRow) : undefined;
    },
  };
}

/** Singleton used by the /api endpoints. */
export const styleCatalog: StyleCatalog = createDbStyleCatalog();

// ── Community style submissions (pre-approval staging) ─────────────

export interface CommunityStyleRepository {
  create(userId: string, submission: StyleSubmission): Promise<CommunityStyleRecord>;
  listByUser(userId: string): Promise<CommunityStyleRecord[]>;
  get(id: string): Promise<CommunityStyleRecord | undefined>;
  review(styleId: string, decision: 'approved' | 'rejected', note?: string): Promise<void>;
}

interface DbRow {
  id: string;
  user_id: string;
  label_key: string;
  description_key: string;
  category: string;
  sample_image: string;
  prompt: string;
  tags: string[];
  model: string;
  seed: number | null;
  status: string;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

function toRecord(row: DbRow): CommunityStyleRecord {
  return {
    id: row.id,
    userId: row.user_id,
    labelKey: row.label_key,
    descriptionKey: row.description_key,
    category: row.category,
    sampleImage: row.sample_image,
    prompt: row.prompt,
    tags: row.tags ?? [],
    model: row.model,
    seed: row.seed ?? undefined,
    status: (row.status as CommunityStyleRecord['status']) ?? 'pending',
    reviewNote: row.review_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Supabase-backed community style repository (service_role bypasses RLS). */
export function createDbCommunityStyleRepository(): CommunityStyleRepository {
  return {
    async create(userId, submission) {
      const db = requireAdmin();
      const { data, error } = await db
        .from('user_styles')
        .insert({
          user_id: userId,
          label_key: submission.label,
          description_key: submission.description,
          category: submission.category,
          sample_image: submission.sampleImage,
          prompt: submission.prompt,
          tags: submission.tags ?? [],
          model: submission.model,
          seed: submission.seed ?? null,
          status: 'pending',
        })
        .select()
        .single();
      if (error) {
        throw new ApiError('INTERNAL', `Failed to create style: ${error.message}`);
      }
      return toRecord(data as DbRow);
    },

    async listByUser(userId) {
      const db = requireAdmin();
      const { data, error } = await db
        .from('user_styles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        throw new ApiError('INTERNAL', `Failed to list styles: ${error.message}`);
      }
      return (data as DbRow[]).map(toRecord);
    },

    async get(id) {
      const db = requireAdmin();
      const { data, error } = await db
        .from('user_styles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        throw new ApiError('INTERNAL', `Failed to load submission: ${error.message}`);
      }
      return data ? toRecord(data as DbRow) : undefined;
    },

    async review(styleId, decision, note) {
      const db = requireAdmin();
      const patch: Record<string, unknown> =
        decision === 'approved' ? { status: 'approved' } : { status: 'rejected', review_note: note ?? '' };
      const { error } = await db.from('user_styles').update(patch).eq('id', styleId);
      if (error) {
        throw new ApiError('INTERNAL', `Failed to review style: ${error.message}`);
      }
    },
  };
}

export const communityStyleRepository: CommunityStyleRepository =
  createDbCommunityStyleRepository();
