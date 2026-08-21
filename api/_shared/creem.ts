// Creem.io helpers. Payment is the single source of truth: subscription
// grants happen ONLY here (webhook), never from the frontend success page.
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PlanId } from './pricing.js';

export function creemApiKey(): string {
  return process.env.CREEM_API_KEY ?? '';
}

export function creemWebhookSecret(): string {
  return process.env.CREEM_WEBHOOK_SECRET ?? '';
}

export function creemBaseUrl(): string {
  return process.env.CREEM_TEST_MODE === 'true'
    ? 'https://test-api.creem.io/v1'
    : 'https://api.creem.io/v1';
}

/** Verify the Creem HMAC-SHA256 signature over the raw body. */
export function verifyCreemSignature(rawBody: string, signature: string | undefined): boolean {
  const secret = creemWebhookSecret();
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch {
    return false;
  }
}

/** Map a Creem product id to a plan. */
export function planFromProduct(productId: string | null | undefined): PlanId | null {
  const pid = String(productId ?? '');
  if (pid && pid === process.env.CREEM_PRODUCT_PLUS_ID) return 'plus';
  if (pid && pid === process.env.CREEM_PRODUCT_PRO_ID) return 'pro';
  return null;
}

export interface CreemWebhookPayload {
  id: string;
  eventType: string;
  created_at: number;
  object: Record<string, unknown>;
}

/** Extract the user id from checkout/subscription metadata. */
export function userIdFromPayload(payload: CreemWebhookPayload): string | null {
  const obj = payload.object ?? {};
  const metadata = (obj as Record<string, unknown>).metadata as Record<string, unknown> | undefined;
  if (metadata && typeof metadata.user_id === 'string') return metadata.user_id;
  // Also check checkout object for metadata
  const checkout = (obj as Record<string, unknown>).checkout as Record<string, unknown> | undefined;
  const checkoutMeta = checkout?.metadata as Record<string, unknown> | undefined;
  if (checkoutMeta && typeof checkoutMeta.user_id === 'string') return checkoutMeta.user_id as string;
  return null;
}

/** Product IDs from the checkout/subscription object. */
export function productIdFromPayload(payload: CreemWebhookPayload): string | null {
  const obj = payload.object as Record<string, unknown> | undefined;
  if (!obj) return null;
  const product = obj.product as Record<string, unknown> | undefined;
  if (product?.id && typeof product.id === 'string') return product.id;
  const checkout = obj.checkout as Record<string, unknown> | undefined;
  if (checkout?.product_id && typeof checkout.product_id === 'string') return checkout.product_id;
  return null;
}