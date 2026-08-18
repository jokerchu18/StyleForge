// Unified generation error handling + provider fallback.
//
// Every image-to-image call site (Home, Tool) funnels through these two
// helpers so error copy and fallback behavior stay consistent.
import type { GenerateErrorCode } from '../../shared/generate-types';
import { en } from '../../i18n/en';
import { transformImage, type GenerateResultData } from './client';

/** Errors that mean "try another provider" — transient/upstream, not billing/auth. */
const PROVIDER_ERROR_CODES: GenerateErrorCode[] = [
  'PROVIDER_NOT_CONFIGURED',
  'UPSTREAM_RATE_LIMITED',
  'UPSTREAM_TIMEOUT',
  'UPSTREAM_ERROR',
];

function codeOf(err: unknown): GenerateErrorCode | undefined {
  return (err as { code?: string } | null | undefined)?.code as
    | GenerateErrorCode
    | undefined;
}

/** True when a failure is a provider-level error we can retry on another provider. */
export function isProviderError(err: unknown): boolean {
  return PROVIDER_ERROR_CODES.includes(codeOf(err) as GenerateErrorCode);
}

/** Map a caught generation error to a user-facing message. */
export function generateErrorMessage(err: unknown): string {
  const message = (err as { message?: string } | null | undefined)?.message?.trim();

  // Auth failures → a friendly "sign in again" instead of raw token text.
  if (message === 'Missing bearer token' || message === 'Invalid or expired token') {
    return en.errorSessionExpired;
  }

  // The server already returns a specific, user-facing message (e.g. "This is a
  // Premium style…", "Unknown styleId…"). Surface it verbatim — it names the
  // actual problem. Fall back to code-based copy only for client/network errors.
  if (message && !/^Request failed/.test(message)) {
    return message;
  }

  switch (codeOf(err)) {
    case 'INSUFFICIENT_GENERATIONS':
      return en.errorInsufficientGenerations;
    case 'PROVIDER_NOT_CONFIGURED':
      return en.errorProviderNotConfigured;
    case 'UPSTREAM_RATE_LIMITED':
      return en.errorRateLimited;
    case 'UPSTREAM_TIMEOUT':
      return en.errorTimeout;
    case 'UPSTREAM_ERROR':
      return en.errorUpstream;
    case 'BAD_REQUEST':
      return en.errorBadRequest;
    default:
      return en.errorProcess;
  }
}

/**
 * Transform with a fallback provider chain. Tries each provider in order;
 * a provider-level failure moves on to the next, while billing/auth/client
 * errors (INSUFFICIENT_GENERATIONS, BAD_REQUEST, INTERNAL) abort immediately.
 */
export async function transformWithFallback(
  styleId: string,
  imageBlob: Blob,
  providers: string[],
): Promise<GenerateResultData> {
  let lastError: unknown = new Error('No generation providers available');
  for (const provider of providers) {
    try {
      return await transformImage({ styleId, provider }, imageBlob);
    } catch (err) {
      lastError = err;
      if (!isProviderError(err)) throw err;
    }
  }
  throw lastError;
}
