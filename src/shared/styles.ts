// Feature/mode helpers and style metadata resolution for the frontend.
// The authoritative style list now lives in styles-catalog.ts (served by
// /api/styles); this module only carries UI plumbing.

import { en } from '../i18n/en';
import type { StyleDefinition } from './style-types';

/** Top-level tool selector: on-device (local) vs cloud (API). */
export type Feature = 'browser' | 'api';

/** Map a feature to the engine it uses. */
export function featureToMode(feature: Feature): 'local' | 'cloud' {
  return feature === 'browser' ? 'local' : 'cloud';
}

export interface StyleMeta {
  label: string;
  description: string;
}

/** Resolve a style's display label/description from i18n (single source). */
export function resolveStyleMeta(style: StyleDefinition): StyleMeta {
  const entry = en.styles[style.id as keyof typeof en.styles];
  return {
    label: entry?.label ?? style.labelKey ?? style.id,
    description: entry?.description ?? '',
  };
}
