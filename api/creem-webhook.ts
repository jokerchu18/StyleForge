// POST /api/creem-webhook — Creem event handler. THIS is the only source
// of truth for subscription state and monthly credit grants. Frontend
// "payment success" pages are never trusted.
//
// Idempotency: a grant only happens when billing_anchor (period start) differs
// from the subscription's last_granted_period_start.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson, methodNotAllowed, readRawBody } from './_shared/http.js';
import { supabaseAdmin } from './_shared/supabase.js';
import {
  verifyCreemSignature,
  planFromProduct,
  userIdFromPayload,
  productIdFromPayload,
  type CreemWebhookPayload,
} from './_shared/creem.js';
import { planById } from './_shared/pricing.js';
import { ApiError, sendError } from './_shared/errors.js';

async function upsertSubscription(
  userId: string,
  payload: CreemWebhookPayload,
  status: string,
  periodEnd: string | null,
) {
  const productId = productIdFromPayload(payload);
  const plan = planFromProduct(productId);
  if (!plan) return; // unknown product — ignore

  const db = supabaseAdmin!;
  const obj = payload.object as Record<string, unknown> | undefined;
  const sub = obj?.subscription as Record<string, unknown> | undefined;
  const providerSubId = sub?.id ? String(sub.id) : null;

  await db
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        provider: 'creem',
        provider_subscription_id: providerSubId,
        plan,
        status,
        period_end: periodEnd,
        cancel_at_period_end: status === 'scheduled_cancel',
      },
      { onConflict: 'user_id' },
    );

  // Monthly grant — once per period (idempotent).
  const { data: existing } = await db
    .from('subscriptions')
    .select('last_granted_period_start')
    .eq('user_id', userId)
    .single();

  const periodStart = sub?.current_period_start_date as string | undefined;
  if (status === 'active' && periodStart && existing?.last_granted_period_start !== periodStart) {
    const planDef = planById(plan);
    const units = planDef?.generations ?? 0;
    await db.rpc('grant_generations', { p_user: userId, p_units: units });
    await db.from('credit_transactions').insert({
      user_id: userId,
      amount: units,
      type: 'grant',
      description: `${planDef?.label ?? plan} subscription — ${units} credits`,
    });
    await db
      .from('subscriptions')
      .update({ last_granted_period_start: periodStart })
      .eq('user_id', userId);
  }
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    if (methodNotAllowed(req, res, ['POST'])) return;

    const raw = await readRawBody(req);
    const sig = req.headers['creem-signature'] as string | undefined;
    if (!verifyCreemSignature(raw, sig)) {
      throw new ApiError('BAD_REQUEST', 'Invalid webhook signature');
    }

    const payload = JSON.parse(raw) as CreemWebhookPayload;
    const event = payload.eventType ?? '';
    const userId = userIdFromPayload(payload);

    if (!supabaseAdmin) throw new Error('Supabase not configured');

    if (!userId) {
      // Events without a user_id — ack to avoid retries.
      sendJson(res, 200, { ok: true, ignored: 'no user_id' });
      return;
    }

    const db = supabaseAdmin;

    switch (event) {
      case 'checkout.completed': {
        // First-time payment — activate subscription.
        const obj = payload.object as Record<string, unknown> | undefined;
        const sub = obj?.subscription as Record<string, unknown> | undefined;
        const subStatus = sub?.status as string | undefined;
        const periodEnd = sub?.current_period_end_date as string | undefined;
        await upsertSubscription(userId, payload, subStatus ?? 'active', periodEnd ?? null);
        break;
      }
      case 'subscription.active':
      case 'subscription.paid': {
        const obj = payload.object as Record<string, unknown> | undefined;
        const periodEnd = obj?.current_period_end_date as string | undefined;
        await upsertSubscription(userId, payload, 'active', periodEnd ?? null);
        break;
      }
      case 'subscription.canceled':
        await db
          .from('subscriptions')
          .update({ status: 'canceled', plan: 'free' })
          .eq('user_id', userId);
        break;
      case 'subscription.scheduled_cancel':
        await db
          .from('subscriptions')
          .update({ cancel_at_period_end: true })
          .eq('user_id', userId);
        break;
      case 'subscription.past_due':
      case 'subscription.unpaid':
        await db
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('user_id', userId);
        break;
      case 'subscription.expired':
        await db
          .from('subscriptions')
          .update({ status: 'expired', plan: 'free' })
          .eq('user_id', userId);
        break;
      case 'subscription.paused':
        await db
          .from('subscriptions')
          .update({ status: 'paused' })
          .eq('user_id', userId);
        break;
      default:
        // subscription.update, subscription.trialing, refund.created, dispute.created — ack.
        break;
    }

    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendError(res, err);
  }
}