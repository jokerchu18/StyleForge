// POST /api/ls-webhook — Lemon Squeezy event handler. THIS is the only source
// of truth for subscription state and monthly generation grants. Frontend
// "payment success" pages are never trusted.
//
// Idempotency: a grant only happens when billing_anchor (period start) differs
// from the subscription's last_granted_period_start.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson, methodNotAllowed, readRawBody } from './_shared/http.js';
import { supabaseAdmin } from './_shared/supabase.js';
import {
  verifyLsSignature,
  planFromVariant,
  userIdFromPayload,
  type LsWebhookPayload,
} from './_shared/ls.js';
import { planById } from './_shared/pricing.js';
import { ApiError, sendError } from './_shared/errors.js';

async function upsertSubscription(userId: string, payload: LsWebhookPayload) {
  const attrs = payload.data?.attributes ?? {};
  const plan = planFromVariant(attrs.variant_id);
  if (!plan) return; // unknown variant — ignore

  const db = supabaseAdmin!;
  const periodStart = attrs.billing_anchor ?? attrs.current_period_start ?? null;
  const periodEnd = attrs.current_period_end ?? attrs.renews_at ?? null;
  const active = attrs.status === 'active' || attrs.status === 'on_trial';

  await db
    .from('subscriptions')
    .upsert(
      {
        user_id: userId,
        provider: 'lemon-squeezy',
        provider_subscription_id: String(payload.data.id),
        plan,
        status: active ? 'active' : (attrs.status ?? 'active'),
        period_start: periodStart,
        period_end: periodEnd,
        cancel_at_period_end: !!attrs.cancel_at_period_end,
        ls_variant_id: attrs.variant_id ?? null,
      },
      { onConflict: 'user_id' },
    );

  // Monthly grant — once per period (idempotent).
  const { data: sub } = await db
    .from('subscriptions')
    .select('last_granted_period_start')
    .eq('user_id', userId)
    .single();

  if (active && periodStart && sub?.last_granted_period_start !== periodStart) {
    const planDef = planById(plan);
    const units = planDef?.generations ?? 0;
    await db.rpc('grant_generations', { p_user: userId, p_units: units });
    await db.from('credit_transactions').insert({
      user_id: userId,
      amount: units,
      type: 'grant',
      description: `${planDef?.label ?? plan} subscription — ${units} generations`,
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
    const sig = req.headers['x-signature'] as string | undefined;
    if (!verifyLsSignature(raw, sig)) {
      throw new ApiError('BAD_REQUEST', 'Invalid webhook signature');
    }

    const payload = JSON.parse(raw) as LsWebhookPayload;
    const event = payload.meta?.event_name ?? '';
    const userId = userIdFromPayload(payload);

    if (!supabaseAdmin) throw new Error('Supabase not configured');

    if (!userId) {
      // Pre-checkout events (order_created for a one-time product) may lack a
      // mapped subscription user — ack to avoid retries.
      sendJson(res, 200, { ok: true, ignored: 'no user_id' });
      return;
    }

    switch (event) {
      case 'subscription_created':
      case 'subscription_updated':
        await upsertSubscription(userId, payload);
        break;
      case 'subscription_cancelled':
        await supabaseAdmin
          .from('subscriptions')
          .update({ cancel_at_period_end: true })
          .eq('user_id', userId);
        break;
      case 'subscription_resumed':
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('user_id', userId);
        break;
      case 'subscription_paused':
      case 'subscription_payment_failed':
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('user_id', userId);
        break;
      case 'subscription_expired':
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'expired', plan: 'free' })
          .eq('user_id', userId);
        break;
      default:
        // order_created / others — ack.
        break;
    }

    sendJson(res, 200, { ok: true });
  } catch (err) {
    sendError(res, err);
  }
}
