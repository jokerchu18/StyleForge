import type { GenerateErrorCode, GenerateErrorBody } from '../../src/shared/generate-types.js';
import type { ServerResponse } from 'node:http';

const STATUS_BY_CODE: Record<GenerateErrorCode, number> = {
  BAD_REQUEST: 400,
  PROVIDER_NOT_CONFIGURED: 503,
  UPSTREAM_RATE_LIMITED: 429,
  UPSTREAM_TIMEOUT: 504,
  UPSTREAM_ERROR: 502,
  INSUFFICIENT_GENERATIONS: 402,
  INTERNAL: 500,
};

export class ApiError extends Error {
  readonly code: GenerateErrorCode;
  readonly provider?: string;

  constructor(code: GenerateErrorCode, message: string, provider?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.provider = provider;
  }
}

/** Serialize an unknown thrown value into a safe, key-free ApiError. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  const message = err instanceof Error ? err.message : 'Unexpected error';
  return new ApiError('INTERNAL', message);
}

export function sendError(res: ServerResponse, err: unknown): void {
  const apiErr = toApiError(err);
  const body: GenerateErrorBody = {
    error: {
      code: apiErr.code,
      message: apiErr.message,
      ...(apiErr.provider ? { provider: apiErr.provider } : {}),
    },
  };
  res.statusCode = STATUS_BY_CODE[apiErr.code] ?? 500;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}
