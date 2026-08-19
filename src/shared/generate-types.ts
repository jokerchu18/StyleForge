// Shared contract between the frontend and the /api Vercel Functions.
// Imported by the browser bundle (tsconfig.app) and by api/*.ts.

export const PROVIDER_IDS = [
  'dashscope',
  'seedream',
  'replicate',
  'mock',
] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

export const QUALITY_LEVELS = ['auto', 'low', 'medium', 'high'] as const;
export type QualityLevel = (typeof QUALITY_LEVELS)[number];

export type GenerateErrorCode =
  | 'BAD_REQUEST'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'UPSTREAM_RATE_LIMITED'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_ERROR'
  | 'INSUFFICIENT_GENERATIONS'
  | 'INTERNAL';

export interface HealthResponse {
  ok: true;
  providers: Record<ProviderId, boolean>;
}

/** Request for image-to-image style transfer (POST /api/transform). */
export interface StyleTransformRequest {
  /** Required; must be a style-transfer preset id in presets.ts. */
  styleId: string;
  /** Optional; defaults to env IMAGE_PROVIDER. */
  provider?: string;
  /** Optional; provider-specific quality. */
  quality?: QualityLevel;
}

export interface GenerateErrorBody {
  error: {
    code: GenerateErrorCode;
    message: string;
    provider?: string;
  };
}
