// Shared contract for GET /api/account.

export type PlanId = 'free' | 'plus' | 'pro';

export interface AccountPermissions {
  canGenerate: boolean;
  canGenerateHD: boolean;
  canDownloadHD: boolean;
  canCreateStyle: boolean;
  canPublishStyle: boolean;
  canUseCommercial: boolean;
  canUsePremiumStyle: boolean;
}

export interface AccountTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface Account {
  user: { id: string };
  balance: number;
  plan: PlanId;
  planLabel: string;
  monthlyGenerations: number;
  status: string;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  permissions: AccountPermissions;
  transactions: AccountTransaction[];
}
