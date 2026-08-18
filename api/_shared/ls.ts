// Lemon Squeezy helpers. Payment is the single source of truth: subscription
// grants happen ONLY here (webhook), never from the frontend success page.
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PlanId } from './pricing.js';

export function lsWebhookSecret(): string {
  return process.env.LS_WEBHOOK_SECRET ?? '';
}

export function lsApiKey(): string {
  return process.env.LS_API_KEY ?? '';
}

/** Verify the LS HMAC signature over the raw body (constant-time). */
export function verifyLsSignature(rawBody: string, signature: string | undefined): boolean {
  const secret = lsWebhookSecret();
  if (!secret || !signature) return false;
  const provided = signature.startsWith('sha256=') ? signature.slice('sha256='.length) : signature;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(provided, 'utf8'));
  } catch {
    return false;
  }
}

/** Map a LS variant id to a plan (from env-configured variant ids). */
export function planFromVariant(variantId: string | number | null | undefined): PlanId | null {
  const v = String(variantId ?? '');
  if (v && v === process.env.LS_VARIANT_PLUS_ID) return 'plus';
  if (v && v === process.env.LS_VARIANT_PRO_ID) return 'pro';
  return null;
}

export interface LsWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: Record<string, unknown>;
  };
  data: {
    id: string;
    attributes: {
      variant_id?: number;
      status?: string;
      billing_anchor?: string;
      current_period_start?: string;
      current_period_end?: string;
      renews_at?: string;
      ends_at?: string | null;
      cancel_at_period_end?: boolean;
      first_subscription?: { id: string };
    };
  };
}

/** Extract the user id we stored in custom_data at checkout time. */
export function userIdFromPayload(payload: LsWebhookPayload): string | null {
  const raw = payload.meta?.custom_data?.user_id;
  return typeof raw === 'string' && raw ? raw : null;
}
