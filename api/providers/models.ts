// Replicate model registry. Each model is a distinct entry with its OWN input
// schema — image key name, array-vs-string, extra fixed params — instead of one
// generic shape trying to fit every model. Styles reference a model by its
// `modelId` (via providerOverrides.replicate.model); everything else lives here.
import type { StyleDefinition } from '../../src/shared/style-types.js';
import { ApiError } from '../_shared/errors.js';

export interface ModelInputContext {
  imageBytes: Uint8Array;
  mime: string;
  prompt: string;
  seed?: number;
  /** Extra style-specific input params merged last. */
  extra?: Record<string, unknown>;
}

export interface ReplicateModelDef {
  /** Registry key a style references, e.g. 'nano-banana-2'. */
  id: string;
  /** Replicate model identifier "owner/name". */
  model: string;
  /** Exact version hash (hardcoded in the def below). */
  version: string;
  /** Credit cost for one generation with this model. */
  creditCost: number;
  /** Build this model's prediction input. */
  buildInput(ctx: ModelInputContext): Record<string, unknown>;
}

function toDataUri(bytes: Uint8Array, mime: string): string {
  return `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;
}

export const REPLICATE_MODEL_DEFS: Record<string, ReplicateModelDef> = {
  // Default model — Black Forest Labs FLUX Kontext Pro.
  'flux-kontext-pro': {
    id: 'flux-kontext-pro',
    model: 'black-forest-labs/flux-kontext-pro',
    version: '897a70f5a7dbd8a0611413b3b98cf417b45f266bd595c571a22947619d9ae462',
    creditCost: 20,
    buildInput: ({ imageBytes, mime, prompt, seed, extra }) => ({
      input_image: toDataUri(imageBytes, mime),
      prompt,
      ...(seed != null ? { seed } : {}),
      ...(extra ?? {}),
    }),
  },

  // Google Nano Banana 2 (Gemini 3.1 Flash Image) — image_input is an ARRAY.
  'nano-banana-2': {
    id: 'nano-banana-2',
    model: 'google/nano-banana-2',
    version: 'd1be8b5fc0931a253d417e12a484ac01ee9ccbc6daffd4792151377d5e5ff55f',
    creditCost: 30,
    buildInput: ({ imageBytes, mime, prompt, extra }) => ({
      image_input: [toDataUri(imageBytes, mime)],
      prompt,
      ...(extra ?? {}),
    }),
  },

  // OpenAI gpt-image-2 (served on Replicate).
  'gpt-image-2': {
    id: 'gpt-image-2',
    model: 'openai/gpt-image-2',
    version: '225c978a7f938acc350564c4548ddc2476bfb33364bec6b5422227f55ce56bd3',
    creditCost: 30,
    buildInput: ({ imageBytes, mime, prompt, extra }) => ({
      input_images: [toDataUri(imageBytes, mime)],
      prompt,
      quality: 'medium',
      aspect_ratio: '1:1',
      output_format: 'webp',
      ...(extra ?? {}),
    }),
  },
};

/** Resolve the model def for a style. Defaults to FLUX when unspecified. */
export function resolveModelDef(style: StyleDefinition): ReplicateModelDef {
  const overrides = style.providerOverrides?.replicate;
  const requested = overrides?.model ?? 'flux-kontext-pro';

  // Accept either a registry id ('nano-banana-2') or a full "owner/name".
  const def =
    REPLICATE_MODEL_DEFS[requested] ??
    Object.values(REPLICATE_MODEL_DEFS).find((d) => d.model === requested);

  if (!def) {
    throw new ApiError(
      'UPSTREAM_ERROR',
      `Unknown Replicate model: ${requested} (register it in api/providers/models.ts)`,
      'replicate',
    );
  }
  return def;
}

/** Credit cost for a model registry id (defaults to the FLUX cost). */
export function modelCreditCost(modelId: string | undefined): number {
  if (modelId) {
    const def = REPLICATE_MODEL_DEFS[modelId];
    if (def) return def.creditCost;
  }
  return REPLICATE_MODEL_DEFS['flux-kontext-pro'].creditCost;
}

/** Extract the version hash for a model def, resolving "owner/name:version". */
export function resolveModelVersion(def: ReplicateModelDef): string {
  if (def.version) return def.version;
  const idx = def.model.lastIndexOf(':');
  if (idx >= 0) return def.model.slice(idx + 1);
  throw new ApiError(
    'UPSTREAM_ERROR',
    `Replicate version is required for ${def.model} — set its version in api/providers/models.ts`,
    'replicate',
  );
}
