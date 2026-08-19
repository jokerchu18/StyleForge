// Charged generation flow. Every Generation spend/refund/grant happens here,
// server-side only, with an atomic pre-authorize step (SQL FOR UPDATE) so a
// client can never overdraw its balance. Failed generations are always
// refunded — a user never permanently loses a Generation to a broken call.

import type { QualityLevel } from '../../src/shared/generate-types.js';
import type { StyleDefinition } from '../../src/shared/style-types.js';
import type { ImageProvider, GenerateImageResult } from './provider.js';
import { supabaseAdmin } from './supabase.js';
import { ApiError } from './errors.js';
import sharp from 'sharp';
import { computeGenerationCost, FREE_MONTHLY_GENERATIONS, type CostTier } from './pricing.js';
import { canGenerate, canUsePremiumStyle, type AccountCtx } from './permissions.js';
import { getProvider } from './registry.js';
import { styleCatalog } from './styleCatalog.js';

const FREE_CYCLE_MS = 30 * 24 * 60 * 60 * 1000;

function requireAdmin() {
  if (!supabaseAdmin) {
    throw new ApiError('INTERNAL', 'Supabase service role is not configured');
  }
  return supabaseAdmin;
}

/** Lazy Free monthly quota refresh — idempotent, no cron. */
async function ensureFreeQuota(userId: string): Promise<void> {
  const db = requireAdmin();
  const { data: sub } = await db
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle();
  if (sub?.plan !== 'free') return;

  const { data: bal } = await db
    .from('credit_balances')
    .select('free_cycle_start')
    .eq('user_id', userId)
    .maybeSingle();
  const start = bal?.free_cycle_start ? new Date(bal.free_cycle_start).getTime() : 0;
  if (Date.now() - start < FREE_CYCLE_MS) return;

  await db.rpc('grant_generations', {
    p_user: userId,
    p_units: FREE_MONTHLY_GENERATIONS,
  });
  await db
    .from('credit_balances')
    .update({ free_cycle_start: new Date().toISOString() })
    .eq('user_id', userId);
  await db.from('credit_transactions').insert({
    user_id: userId,
    amount: 0,
    type: 'reset',
    description: 'Monthly free quota refreshed',
  });
}

/** Read the current account context used by the permission layer. */
export async function getAccount(userId: string): Promise<AccountCtx> {
  const db = requireAdmin();
  const [{ data: sub }, { data: bal }] = await Promise.all([
    db.from('subscriptions').select('plan,status').eq('user_id', userId).maybeSingle(),
    db.from('credit_balances').select('balance').eq('user_id', userId).maybeSingle(),
  ]);
  return {
    user: { id: userId },
    plan: (sub?.plan as AccountCtx['plan']) ?? 'free',
    status: (sub?.status as string) ?? 'active',
    balance: bal?.balance ?? 0,
  };
}

async function uploadImage(
  userId: string,
  bytes: Uint8Array,
  mime: string,
): Promise<string> {
  const db = requireAdmin();
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await db.storage.from('generations').upload(path, bytes, {
    contentType: mime || 'image/png',
  });
  if (error) {
    throw new ApiError('INTERNAL', `Failed to store generated image: ${error.message}`);
  }
  return path;
}

/** Generate a 400px-wide WebP thumbnail from image bytes. */
async function generateThumbnail(bytes: Uint8Array): Promise<Buffer> {
  return sharp(Buffer.from(bytes))
    .resize(400, undefined, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer();
}

async function uploadThumbnail(userId: string, bytes: Uint8Array): Promise<string> {
  const db = requireAdmin();
  const thumb = await generateThumbnail(bytes);
  const path = `thumbnails/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const { error } = await db.storage.from('generations').upload(path, thumb, {
    contentType: 'image/webp',
  });
  if (error) {
    // Thumbnail is best-effort — don't crash the generation.
    return '';
  }
  return path;
}

/** Signed URL for a stored generation path (private bucket). */
export async function signedImageUrl(path: string, expiresIn = 3600): Promise<string> {
  const db = requireAdmin();
  const { data, error } = await db.storage
    .from('generations')
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return '';
  return data.signedUrl;
}

/** Batch-signed URLs — one storage round-trip instead of one per image. */
export async function signedImageUrls(paths: string[], expiresIn = 3600): Promise<Map<string, string>> {
  const db = requireAdmin();
  const out = new Map<string, string>();
  if (paths.length === 0) return out;
  const { data, error } = await db.storage
    .from('generations')
    .createSignedUrls(paths, expiresIn);
  if (error) return out;
  for (const item of data ?? []) {
    if (item?.path && item?.signedUrl) out.set(item.path, item.signedUrl);
  }
  return out;
}

export interface ChargedGenerationResult extends GenerateImageResult {
  generationId: string;
  costUnits: number;
  tier: CostTier;
  newBalance: number;
  providerId: string;
}

export interface ChargeOptions {
  userId: string;
  style: StyleDefinition;
  providerId?: string;
  quality?: QualityLevel;
  imageBytes: Uint8Array;
  mime: string;
}

/** State captured after billing pre-authorization but before generation. */
export interface PreAuthorizedGeneration {
  userId: string;
  style: StyleDefinition;
  provider: ImageProvider;
  cost: { units: number; tier: CostTier };
  newBalance: number;
  generationId: string;
  txId: string;
}

/**
 * Resolve provider, compute cost, run the permission gate, atomically
 * pre-authorize the balance, and open a pending ledger + generation record.
 * Does NOT call the image API — that is done by the caller (sync transform or
 * async prediction). Always paired with finalizeGenerationSuccess / Failure.
 */
export async function preAuthorizeGeneration(
  opts: ChargeOptions,
): Promise<PreAuthorizedGeneration> {
  const db = requireAdmin();

  await ensureFreeQuota(opts.userId);

  const provider: ImageProvider = getProvider(opts.providerId);
  const cost = computeGenerationCost({
    provider: provider.id,
    quality: opts.quality,
  });

  const account = await getAccount(opts.userId);
  if (!canGenerate(account)) {
    throw new ApiError(
      'INSUFFICIENT_GENERATIONS',
      `You need ${cost.units} Generation${cost.units > 1 ? 's' : ''} (${cost.tier}). Upgrade or wait for your monthly refresh.`,
    );
  }
  if (!canUsePremiumStyle(account, opts.style.isPremium ?? false)) {
    throw new ApiError(
      'BAD_REQUEST',
      'This is a Premium style. Upgrade your plan to use it.',
    );
  }

  // Atomic pre-authorize (FOR UPDATE — no overdraw, no race).
  const { data: spent, error: spendErr } = await db.rpc('spend_generations', {
    p_user: opts.userId,
    p_units: cost.units,
  });
  if (spendErr || spent == null) {
    throw new ApiError(
      'INSUFFICIENT_GENERATIONS',
      `Not enough Generations (need ${cost.units}). Upgrade or wait for your monthly refresh.`,
    );
  }
  const newBalance = spent as number;

  // Ledger: pending charge.
  const { data: tx, error: txErr } = await db
    .from('credit_transactions')
    .insert({
      user_id: opts.userId,
      amount: -cost.units,
      type: 'charge',
      status: 'pending',
      description: `${cost.tier} generation · ${opts.style.label ?? opts.style.id}`,
    })
    .select('id')
    .single();
  if (txErr) {
    // Roll back the pre-charge so a ledger failure isn't silent.
    await db.rpc('refund_generations', { p_user: opts.userId, p_units: cost.units });
    throw new ApiError('INTERNAL', `Failed to record charge: ${txErr.message}`);
  }
  const txId = (tx as { id: string }).id;

  // Pending generation record (becomes the poll handle for async flow).
  const { data: gen, error: genErr } = await db
    .from('generations')
    .insert({
      user_id: opts.userId,
      style_id: opts.style.id,
      model: opts.style.model ?? 'unknown',
      generation_type: cost.tier,
      cost_units: cost.units,
      provider: provider.id,
      tx_id: txId,
      status: 'pending',
    })
    .select('id')
    .single();
  if (genErr) {
    await db.rpc('refund_generations', { p_user: opts.userId, p_units: cost.units });
    await db.from('credit_transactions').update({ status: 'refunded' }).eq('id', txId);
    throw new ApiError('INTERNAL', `Failed to save generation: ${genErr.message}`);
  }

  return {
    userId: opts.userId,
    style: opts.style,
    provider,
    cost,
    newBalance,
    generationId: (gen as { id: string }).id,
    txId,
  };
}

/** Mark an async generation's prediction id (for webhook/poll correlation). */
export async function setGenerationPredictionId(
  generationId: string,
  predictionId: string,
): Promise<void> {
  const db = requireAdmin();
  await db
    .from('generations')
    .update({ prediction_id: predictionId })
    .eq('id', generationId);
}

interface PendingGenerationRow {
  id: string;
  user_id: string;
  style_id: string;
  generation_type: string;
  cost_units: number;
  provider: string | null;
  tx_id: string | null;
  prediction_id: string | null;
  status: string;
  output_image: string | null;
}

/** Look up a pending generation row by id (ownership-checked). */
export async function getGenerationRow(
  generationId: string,
  userId: string,
): Promise<PendingGenerationRow> {
  const db = requireAdmin();
  const { data, error } = await db
    .from('generations')
    .select('id,user_id,style_id,generation_type,cost_units,provider,tx_id,prediction_id,status,output_image')
    .eq('id', generationId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) {
    throw new ApiError('BAD_REQUEST', 'Generation not found');
  }
  return data as PendingGenerationRow;
}

/**
 * Reconstruct the pre-authorization context for an already-pending generation,
 * so the async poll/webhook can finalize it without re-running billing.
 */
export async function loadPreAuthorizedContext(
  generationId: string,
  userId: string,
): Promise<PreAuthorizedGeneration> {
  const row = await getGenerationRow(generationId, userId);
  return contextFromRow(row);
}

/** Rebuild a PreAuthorizedGeneration from a generation row (no ownership check). */
export async function contextFromRow(
  row: PendingGenerationRow,
): Promise<PreAuthorizedGeneration> {
  const style = await styleCatalog.get(row.style_id);
  if (!style) {
    throw new ApiError('INTERNAL', `Style ${row.style_id} not found`);
  }
  const provider = getProvider(row.provider ?? undefined);
  return {
    userId: row.user_id,
    style,
    provider,
    cost: {
      units: row.cost_units,
      tier: row.generation_type as CostTier,
    },
    newBalance: 0,
    generationId: row.id,
    txId: row.tx_id ?? '',
  };
}

/** Look up a pending generation by its upstream prediction id (webhook path). */
export async function getGenerationRowByPredictionId(
  predictionId: string,
): Promise<PendingGenerationRow> {
  const db = requireAdmin();
  const { data, error } = await db
    .from('generations')
    .select('id,user_id,style_id,generation_type,cost_units,provider,tx_id,prediction_id,status,output_image')
    .eq('prediction_id', predictionId)
    .maybeSingle();
  if (error || !data) {
    throw new ApiError('BAD_REQUEST', 'Generation not found');
  }
  return data as PendingGenerationRow;
}

/** Upload the result, flip the generation to succeeded, complete the ledger. */
export async function finalizeGenerationSuccess(
  ctx: PreAuthorizedGeneration,
  result: GenerateImageResult,
): Promise<ChargedGenerationResult> {
  const db = requireAdmin();

  const outputPath = await uploadImage(ctx.userId, result.bytes, result.mime);
  // Thumbnail is best-effort; failure doesn't block the generation.
  const thumbnailPath = await uploadThumbnail(ctx.userId, result.bytes).catch(() => '');

  const { error: genErr } = await db
    .from('generations')
    .update({
      model: result.model,
      output_image: outputPath,
      thumbnail_image: thumbnailPath || null,
      seed: result.seed ?? null,
      status: 'succeeded',
    })
    .eq('id', ctx.generationId);
  if (genErr) {
    throw new ApiError('INTERNAL', `Failed to save generation: ${genErr.message}`);
  }

  await db
    .from('credit_transactions')
    .update({ status: 'completed', reference_id: ctx.generationId })
    .eq('id', ctx.txId);

  // Live usage counter for the style (server-side RPC, see 0004).
  try {
    await db.rpc('increment_style_usage', { p_slug: ctx.style.id });
  } catch {
    /* non-fatal — usage counter is best-effort */
  }

  return {
    bytes: result.bytes,
    mime: result.mime,
    width: result.width,
    height: result.height,
    model: result.model,
    seed: result.seed,
    generationId: ctx.generationId,
    costUnits: ctx.cost.units,
    tier: ctx.cost.tier,
    newBalance: ctx.newBalance,
    providerId: ctx.provider.id,
  };
}

/** Refund + mark the generation failed. Never let a failed call eat Generations. */
export async function finalizeGenerationFailure(
  ctx: PreAuthorizedGeneration,
): Promise<void> {
  const db = requireAdmin();
  await db.rpc('refund_generations', { p_user: ctx.userId, p_units: ctx.cost.units });
  await db.from('credit_transactions').update({ status: 'refunded' }).eq('id', ctx.txId);
  await db.from('generations').update({ status: 'failed' }).eq('id', ctx.generationId);
}

/**
 * Run one charged generation synchronously (pre-authorize → image API → store).
 * On any failure after pre-authorize: refund + mark failed.
 */
export async function runChargedGeneration(
  opts: ChargeOptions,
): Promise<ChargedGenerationResult> {
  const ctx = await preAuthorizeGeneration(opts);

  try {
    if (!ctx.provider.transform) {
      throw new ApiError(
        'BAD_REQUEST',
        `Provider "${ctx.provider.id}" does not support style transfer`,
      );
    }
    const result = await ctx.provider.transform({
      imageBytes: opts.imageBytes,
      mime: opts.mime,
      style: opts.style,
      quality: opts.quality,
    });
    return await finalizeGenerationSuccess(ctx, result);
  } catch (err) {
    await finalizeGenerationFailure(ctx);
    throw err;
  }
}
