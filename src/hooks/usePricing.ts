import { useEffect, useState } from 'react';
import type { Plan } from '../shared/pricing-types';

let cache: Plan[] | null = null;

/** Cached pricing tiers from GET /api/pricing (single source of truth). */
export function usePricing(): Plan[] | null {
  const [plans, setPlans] = useState<Plan[] | null>(cache);

  useEffect(() => {
    if (cache) return;
    fetch('/api/pricing')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { plans: Plan[] }) => {
        cache = d.plans;
        setPlans(d.plans);
      })
      .catch(() => {});
  }, []);

  return plans;
}
