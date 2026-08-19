import type { ProviderId } from '../../src/shared/generate-types.js';
import type { ImageProvider } from './provider.js';
import { ApiError } from './errors.js';
import { dashscopeProvider } from '../providers/dashscope.js';
import { seedreamProvider } from '../providers/seedream.js';
import { replicateProvider } from '../providers/replicate.js';
import { mockProvider } from '../providers/mock.js';

export const PROVIDERS: Record<ProviderId, ImageProvider> = {
  dashscope: dashscopeProvider,
  seedream: seedreamProvider,
  replicate: replicateProvider,
  mock: mockProvider,
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

/** Resolve a provider id (explicit or env default), checking it is configured. */
export function getProvider(id?: string): ImageProvider {
  const selected = (id ?? process.env.IMAGE_PROVIDER ?? 'replicate') as ProviderId;
  const p = PROVIDERS[selected];
  if (!p) {
    throw new ApiError('BAD_REQUEST', `Unknown provider: ${selected}`, selected);
  }
  if (!p.isConfigured()) {
    throw new ApiError(
      'PROVIDER_NOT_CONFIGURED',
      `Provider "${selected}" is not configured`,
      selected,
    );
  }
  return p;
}

/** Report which providers are ready (never exposes keys). */
export function providersStatus(): Record<ProviderId, boolean> {
  return Object.fromEntries(
    (Object.keys(PROVIDERS) as ProviderId[]).map((id) => [id, PROVIDERS[id].isConfigured()]),
  ) as Record<ProviderId, boolean>;
}
