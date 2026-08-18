// Feature/mode helpers and style metadata resolution for the frontend.
// The authoritative style list now lives in the database (served by /api/styles).

import type { StyleDefinition } from './style-types';

/** Top-level tool selector: only cloud (API) is supported now. */
export type Feature = 'api';

export interface StyleMeta {
  label: string;
  description: string;
}

/** Resolve a style's display label/description. DB styles carry text fields;
 *  legacy static styles fall back to i18n keys. */
export function resolveStyleMeta(style: StyleDefinition): StyleMeta {
  return {
    label: style.label ?? style.labelKey ?? style.id,
    description: style.description ?? style.descriptionKey ?? '',
  };
}
