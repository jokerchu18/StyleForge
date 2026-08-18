// Charged generation flow. Every Generation spend/refund/grant happens here,
// server-side only, with an atomic pre-authorize step (SQL FOR UPDATE) so a
// client can never overdraw its balance. Failed generations are always
// refunded — a user never permanently loses a Generation to a broken call.

import type { QualityLevel } from '../../src/shared/generate-types.js';
import type { StyleDefinition } from '../../src/shared/style-types.js';
import type { ImageProvider, GenerateImageResult } from './provider.js';
import { supabaseAdmin } from './supabase.js';
import { ApiError } from './errors.js';
import { computeGenerationCost, FREE_MONTHLY_GENERATIONS, type CostTier } from './pricing.js';
import { canGenerate, canUsePremiumStyle, type AccountCtx } from './permissions.js';
import { getProvider } from './registry.js';

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

/** Signed URL for a stored generation path (private bucket). */
export async function signedImageUrl(path: string, expiresIn = 3600): Promise<string> {
  const db = requireAdmin();
  const { data, error } = await db.storage
    .from('generations')
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return '';
  return data.signedUrl;
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

/**
 * Run one charged generation. Sequence:
 * free refresh → resolve provider → compute cost → permission gate →
 * atomic pre-authorize → image API → store → record → confirm.
 * On any failure after pre-authorize: refund + mark failed.
 */
export async function runChargedGeneration(
  opts: ChargeOptions,
): Promise<ChargedGenerationResult> {
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

  try {
    if (!provider.transform) {
      throw new ApiError('BAD_REQUEST', `Provider "${provider.id}" does not support style transfer`);
    }
    const result = await provider.transform({
      imageBytes: opts.imageBytes,
      mime: opts.mime,
      style: opts.style,
      quality: opts.quality,
    });

    const outputPath = await uploadImage(opts.userId, result.bytes, result.mime);

    const { data: gen, error: genErr } = await db
      .from('generations')
      .insert({
        user_id: opts.userId,
        style_id: opts.style.id,
        model: result.model,
        generation_type: cost.tier,
        cost_units: cost.units,
        output_image: outputPath,
        seed: result.seed ?? null,
        status: 'succeeded',
      })
      .select('id')
      .single();
    if (genErr) {
      throw new ApiError('INTERNAL', `Failed to save generation: ${genErr.message}`);
    }

    await db
      .from('credit_transactions')
      .update({ status: 'completed', reference_id: (gen as { id: string }).id })
      .eq('id', txId);

    // Live usage counter for the style (server-side RPC, see 0004).
    try {
      await db.rpc('increment_style_usage', { p_slug: opts.style.id });
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
      generationId: (gen as { id: string }).id,
      costUnits: cost.units,
      tier: cost.tier,
      newBalance,
      providerId: provider.id,
    };
  } catch (err) {
    // Refund + ledger mark + failed record. Never let a failed call eat Generations.
    await db.rpc('refund_generations', { p_user: opts.userId, p_units: cost.units });
    await db.from('credit_transactions').update({ status: 'refunded' }).eq('id', txId);
    try {
      await db
        .from('generations')
        .insert({
          user_id: opts.userId,
          style_id: opts.style.id,
          model: opts.style.model ?? 'unknown',
          generation_type: cost.tier,
          cost_units: cost.units,
          status: 'failed',
        })
        .select('id')
        .single();
    } catch {
      /* non-fatal — the failed record is best-effort */
    }
    throw err;
  }
}
