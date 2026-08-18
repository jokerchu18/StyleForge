// GET /api/account — the signed-in user's billing + permission context.
// Powers the "⚡ N Generations" chip, plan badge, and upgrade prompts.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson, methodNotAllowed } from './_shared/http.js';
import { getUserId } from './_shared/auth.js';
import { supabaseAdmin } from './_shared/supabase.js';
import { planById, type PlanId } from './_shared/pricing.js';
import { sendError } from './_shared/errors.js';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    if (methodNotAllowed(req, res, ['GET'])) return;
    const userId = await getUserId(req);
    if (!supabaseAdmin) throw new Error('Supabase not configured');

    const [{ data: sub }, { data: bal }] = await Promise.all([
      supabaseAdmin
        .from('subscriptions')
        .select('plan,status,period_end,cancel_at_period_end')
        .eq('user_id', userId)
        .maybeSingle(),
      supabaseAdmin
        .from('credit_balances')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    const planId = (sub?.plan as PlanId | undefined) ?? 'free';
    const plan = planById(planId);
    const balance = bal?.balance ?? 0;

    // Recent ledger entries (Generation History).
    const { data: txs } = await supabaseAdmin
      .from('credit_transactions')
      .select('id,amount,type,description,status,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    sendJson(res, 200, {
      user: { id: userId },
      balance,
      plan: planId,
      planLabel: plan?.label ?? 'Free',
      monthlyGenerations: plan?.generations ?? 0,
      status: sub?.status ?? 'active',
      periodEnd: sub?.period_end ?? null,
      cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
      permissions: {
        canGenerate: balance >= 1,
        canGenerateHD: planId === 'plus' || planId === 'pro',
        canDownloadHD: planId === 'plus' || planId === 'pro',
        canCreateStyle: true,
        canPublishStyle: planId !== 'free',
        canUseCommercial: planId === 'pro',
        canUsePremiumStyle: planId !== 'free',
      },
      transactions: (txs ?? []).map((t) => ({
        id: (t as { id: string }).id,
        amount: (t as { amount: number }).amount,
        type: (t as { type: string }).type,
        description: (t as { description: string | null }).description ?? '',
        status: (t as { status: string }).status,
        createdAt: (t as { created_at: string }).created_at,
      })),
    });
  } catch (err) {
    sendError(res, err);
  }
}
