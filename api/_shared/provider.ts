import type { ProviderId, QualityLevel } from '../../src/shared/generate-types.js';
import type { StyleDefinition } from '../../src/shared/style-types.js';

export interface GenerateImageResult {
  bytes: Uint8Array;
  mime: string;
  width?: number;
  height?: number;
  model: string;
  seed?: number;
}

/** Options for image-to-image style transfer. */
export interface TransformImageOptions {
  imageBytes: Uint8Array;
  mime: string;
  /** Resolved authoritative style definition (cloud engine). */
  style: StyleDefinition;
  quality?: QualityLevel;
}

export interface ImageProvider {
  id: ProviderId;
  label: string;
  isConfigured(): boolean;
  /** Image-to-image style transfer. Absent = provider doesn't support it. */
  transform?(opts: TransformImageOptions): Promise<GenerateImageResult>;
}

/** Number of seconds to allow one upstream call (default). */
export const DEFAULT_GENERATE_TIMEOUT_MS = 55_000;

export function generateTimeoutMs(): number {
  const raw = Number(process.env.GENERATE_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_GENERATE_TIMEOUT_MS;
}
