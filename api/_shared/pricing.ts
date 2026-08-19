// The SINGLE source of truth for pricing. Frontend must never hardcode prices
// or generation quotas — it reads this via GET /api/pricing.
// Generations are the only charging unit. Style name never affects cost.

export type PlanId = 'free' | 'plus' | 'pro';
export type CostTier = 'standard' | 'premium' | 'ultra';

export interface Plan {
  id: PlanId;
  price: number;
  generations: number;
  label: string;
  mostPopular: boolean;
}

export const PLANS: Plan[] = [
  { id: 'free', price: 0, generations: 40, label: 'Free', mostPopular: false },
  { id: 'plus', price: 9.99, generations: 2000, label: 'Plus', mostPopular: true },
  { id: 'pro', price: 24.99, generations: 6000, label: 'Pro', mostPopular: false },
];

export const FREE_MONTHLY_GENERATIONS = 40;

export function planById(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Provider → base cost tier. Quality/resolution can bump it one step. */
const PROVIDER_TIERS: Record<string, CostTier> = {
  mock: 'standard',
  openai: 'ultra',
  dashscope: 'premium',
  seedream: 'premium',
  replicate: 'premium',
};

export function computeGenerationCost(opts: {
  provider: string;
  quality?: 'auto' | 'low' | 'medium' | 'high';
  resolution?: number;
}): { units: number; tier: CostTier } {
  let tier: CostTier = PROVIDER_TIERS[opts.provider] ?? 'standard';
  if (opts.quality === 'high' || (opts.resolution ?? 0) > 1024) {
    tier = tier === 'standard' ? 'premium' : 'ultra';
  }
  const units = tier === 'standard' ? 10 : tier === 'premium' ? 20 : 30;
  return { units, tier };
}

/** Lemon Squeezy variant ids are resolved from env (used by the LS webhook). */
export const LS_VARIANTS: Record<'plus' | 'pro', string> = {
  plus: process.env.LS_VARIANT_PLUS_ID ?? '',
  pro: process.env.LS_VARIANT_PRO_ID ?? '',
};
