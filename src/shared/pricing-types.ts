// Shared contract for GET /api/pricing. Single source: the server.

import type { PlanId } from './account-types';

export interface Plan {
  id: PlanId;
  price: number;
  generations: number;
  label: string;
  mostPopular: boolean;
}
