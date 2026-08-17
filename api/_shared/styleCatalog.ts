// Style catalog repository — the "swap point" between a local data file now and
// a database later. The backend and frontend only depend on this interface, so
// replacing createLocalStyleCatalog() with createDbStyleCatalog() (reading, say,
// Supabase) requires no change anywhere else.
import type {
  CommunityStyleRecord,
  StyleDefinition,
  StyleSubmission,
} from '../../src/shared/style-types.js';
import { STYLE_CATALOG } from '../../src/shared/styles-catalog.js';
import { supabaseAdmin } from './supabase.js';
import { ApiError } from './errors.js';

export interface StyleCatalog {
  list(): Promise<StyleDefinition[]>;
  get(id: string): Promise<StyleDefinition | undefined>;
}

/** In-memory catalog over the local data file. */
export function createLocalStyleCatalog(): StyleCatalog {
  const byId = new Map<string, StyleDefinition>();
  for (const s of STYLE_CATALOG) {
    byId.set(s.id, s);
  }
  const active = STYLE_CATALOG.filter((s) => s.status === 'active');

  return {
    async list() {
      return [...active];
    },
    async get(id) {
      const s = byId.get(id);
      return s && s.status === 'active' ? s : undefined;
    },
  };
}

/** Singleton used by the /api endpoints. */
export const styleCatalog: StyleCatalog = createLocalStyleCatalog();

/**
 * Community style submission repository. Reserved for the Supabase backend:
 * implement `createDbCommunityStyleRepository()` reading/writing the
 * `public.user_styles` table (see supabase/migrations/0001_style_ecosystem.sql).
 *
 * Aggregation point: once the DB repository exists, `styleCatalog.list()` should
 * become `[...official, ...(await communityRepo.listApproved())]` so the catalog
 * and transform endpoints transparently serve both official and approved
 * community styles. Not wired up yet.
 */
export interface CommunityStyleRepository {
  /** Submit a style (status becomes 'pending'). */
  create(userId: string, submission: StyleSubmission): Promise<CommunityStyleRecord>;
  /** All submissions for a user. */
  listByUser(userId: string): Promise<CommunityStyleRecord[]>;
  /** Approve (generates slug) or reject (sets reviewNote). */
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
  const requireAdmin = () => {
    if (!supabaseAdmin) {
      throw new ApiError(
        'INTERNAL',
        'Supabase service role is not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)',
      );
    }
    return supabaseAdmin;
  };

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

/** Singleton used by the POST /api/styles endpoint. */
export const communityStyleRepository: CommunityStyleRepository =
  createDbCommunityStyleRepository();
