// Unified style contract for the style ecosystem.
// Shared by the frontend (renders the catalog) and the /api backend (resolves
// the authoritative style definition from a styleId). Single source of truth
// for what a "style" is, so new styles are data additions, not code changes.

import type { ProviderId } from './generate-types.js';

export type StyleEngine = 'cloud';
export type StyleTier = 'free' | 'premium';
export type StyleSource = 'official' | 'community';
export type StyleStatus = 'active' | 'draft' | 'archived';
/** Open-ended: categories are data, not a closed enum (new categories need no type change). */
export type StyleCategory = string;

export type DashscopeFunction =
  | 'stylization_all'
  | 'control_cartoon_feature'
  | 'colorization';

export type MockFilter = 'sepia' | 'grayscale' | 'saturate' | 'tint';

/**
 * Replicate-specific knobs. Replicate is a model platform, so every model has
 * its own input schema — these fields let a style declare which model to run
 * and how to map the image/prompt into that model's input.
 */
export interface ReplicateStyleOverrides {
  /**
   * Model registry id (see api/providers/models.ts), e.g. 'flux-kontext-pro',
   * 'nano-banana-2' or 'gpt-image'. Omitted = the default FLUX model.
   */
  model?: string;
  /**
   * Optional fixed seed for reproducible output. When set, it is merged into
   * the model's input (as `input.seed`), so the model must support a seed
   * parameter — otherwise it is ignored. Omitted = random seed.
   */
  seed?: number;
  /** Extra input params merged into the model's prediction input. */
  input?: Record<string, unknown>;
}

/** Provider-specific parameters, keyed by provider id. */
export interface ProviderStyleOverrides extends ReplicateStyleOverrides {
  dashscopeFunction?: DashscopeFunction;
  mockFilter?: MockFilter;
  [k: string]: unknown;
}

export interface StyleDefinition {
  /** Slug, e.g. 'anime'. */
  id: string;
  /** Cloud API engine (all styles are cloud-powered). */
  engine: StyleEngine;
  category: StyleCategory;
  /** free / premium — gating field, not enforced yet. */
  tier: StyleTier;
  /** official / community — provenance for user-submitted styles. */
  source: StyleSource;
  /** active / draft / archived — moderation & listing control. */
  status: StyleStatus;
  /** i18n key into en.styles[id].label (legacy; DB styles use `label`). */
  labelKey?: string;
  /** i18n key into en.styles[id].description (legacy; DB styles use `description`). */
  descriptionKey?: string;
  /** Display label (DB-backed styles set this directly). */
  label?: string;
  /** One-line description (DB-backed styles set this directly). */
  description?: string;
  sampleImage: string;
  /** Example gallery images (beyond the preview). */
  examples?: string[];
  tags?: string[];
  order?: number;
  author?: string;
  /** Premium gate — Free can see but not use. */
  isPremium?: boolean;
  /** Live usage counter (server-maintained). */
  usageCount?: number;
  /** Live like counter (server-maintained). */
  likeCount?: number;
  /** Credit cost for one generation with this style (server-computed). */
  costUnits?: number;
  /** Recommended model id ('auto' = provider decides). Server-side hint. */
  model?: string;
  /**
   * Cloud-only: authoritative style instruction. Resolved server-side only;
   * never sent to the browser.
   */
  prompt?: string;
  /** Cloud-only: per-provider knobs (kept out of the shared shape). */
  providerOverrides?: Partial<Record<ProviderId, ProviderStyleOverrides>>;
}

/** GET /api/styles response body. */
export interface StyleCatalogResponse {
  styles: StyleDefinition[];
  /** Distinct categories in display order. */
  categories: StyleCategory[];
}

/** A style as exposed to the browser — same shape minus the secret prompt. */
export type PublicStyleDefinition = Omit<StyleDefinition, 'prompt'>;

/** Community style review status — covers the submission lifecycle. */
export type StyleReviewStatus = 'pending' | 'approved' | 'rejected';

/** User-submitted style payload (no id/slug yet; engine is always cloud). */
export interface StyleSubmission {
  label: string;
  description: string;
  category: StyleCategory;
  /** Uploaded sample image URL. */
  sampleImage: string;
  /** Authoritative style instruction. */
  prompt: string;
  tags?: string[];
  /** Replicate model identifier, e.g. "owner/name:version". */
  model: string;
  /** Optional fixed seed for reproducible output. */
  seed?: number;
}

/** Community style as stored in the database (pre-approval). */
export interface CommunityStyleRecord {
  /** Style id (slug) once approved. */
  id: string;
  userId: string;
  labelKey: string;
  descriptionKey: string;
  category: StyleCategory;
  sampleImage: string;
  prompt: string;
  tags: string[];
  model: string;
  seed?: number;
  status: StyleReviewStatus;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

/** Convert an approved community style record into a StyleDefinition. */
export function communityToStyle(record: CommunityStyleRecord): StyleDefinition {
  return {
    id: record.id,
    engine: 'cloud',
    category: record.category,
    tier: 'free',
    source: 'community',
    status: 'active',
    labelKey: record.labelKey,
    descriptionKey: record.descriptionKey,
    sampleImage: record.sampleImage,
    prompt: record.prompt,
    tags: record.tags,
    author: record.userId,
    providerOverrides: {
      replicate: {
        model: record.model,
        ...(record.seed != null ? { seed: record.seed } : {}),
      },
    },
  };
}
