// Unified permission layer. Backend enforces these; the frontend mirrors them
// (src/lib/permissions.ts) for UI gating only. New plans change only here.

import type { CostTier, PlanId } from './pricing.js';

export interface AccountCtx {
  user: { id: string } | null;
  plan: PlanId;
  status: string; // active | cancelled | past_due | paused | expired
  balance: number;
}

export function canGenerate(ctx: AccountCtx): boolean {
  return !!ctx.user && ctx.status === 'active' && ctx.balance >= 1;
}

export function canUsePremiumStyle(ctx: AccountCtx, isPremium: boolean): boolean {
  return !isPremium || ctx.plan !== 'free';
}

export function canUsePremiumModel(ctx: AccountCtx, tier: CostTier): boolean {
  return tier !== 'ultra' || ctx.plan !== 'free';
}

export function canGenerateHD(ctx: AccountCtx): boolean {
  return ctx.plan === 'plus' || ctx.plan === 'pro';
}

export function canDownloadHD(ctx: AccountCtx): boolean {
  return canGenerateHD(ctx);
}

export function canCreateStyle(ctx: AccountCtx): boolean {
  return !!ctx.user;
}

export function canPublishStyle(ctx: AccountCtx): boolean {
  return !!ctx.user && ctx.plan !== 'free';
}

export function canUseCommercial(ctx: AccountCtx): boolean {
  return ctx.plan === 'pro';
}
