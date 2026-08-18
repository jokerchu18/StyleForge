import type { IncomingMessage, ServerResponse } from 'node:http';
import { ApiError } from './errors.js';

export const MAX_BODY = 4 * 1024 * 1024; // 4MB safety margin under Vercel's 4.5MB

/** Stream the raw request body into a Buffer with a hard size cap. */
async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > MAX_BODY) {
      throw new ApiError('BAD_REQUEST', 'Request body too large');
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

/** Read the raw request body as a string (webhook signature verification). */
export async function readRawBody(req: IncomingMessage): Promise<string> {
  const raw = await readBody(req);
  return raw.toString('utf-8');
}

/** Read and JSON-parse a request body (Vercel allows 4.5MB). */
export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const raw = await readBody(req);
  if (raw.length === 0) return {};
  try {
    return JSON.parse(raw.toString('utf-8'));
  } catch {
    throw new ApiError('BAD_REQUEST', 'Invalid JSON body');
  }
}

/** Read a raw binary request body (used by /api/transform). */
export async function readBinaryBody(
  req: IncomingMessage,
): Promise<{ bytes: Uint8Array }> {
  const raw = await readBody(req);
  if (raw.length === 0) {
    throw new ApiError('BAD_REQUEST', 'Request body is empty');
  }
  return { bytes: new Uint8Array(raw) };
}

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export interface ImagePayload {
  bytes: Uint8Array;
  mime: string;
  width?: number;
  height?: number;
  model?: string;
  provider?: string;
  seed?: number;
  styleId?: string;
  /** Charged generation id (billing integration). */
  generationId?: string;
  costUnits?: number;
}

/** Write a binary image straight back (no base64 bloat).
 *  NOTE: never echoes a prompt here — prompts must not reach the browser. */
export function sendImage(res: ServerResponse, img: ImagePayload): void {
  res.statusCode = 200;
  res.setHeader('Content-Type', img.mime);
  res.setHeader('X-Generate-Provider', img.provider ?? '');
  res.setHeader('X-Generate-Model', img.model ?? '');
  if (img.width !== undefined) res.setHeader('X-Generate-Width', String(img.width));
  if (img.height !== undefined) res.setHeader('X-Generate-Height', String(img.height));
  if (img.seed !== undefined) res.setHeader('X-Generate-Seed', String(img.seed));
  if (img.styleId !== undefined) res.setHeader('X-Generate-Style', img.styleId);
  if (img.generationId !== undefined) res.setHeader('X-Generation-Id', img.generationId);
  if (img.costUnits !== undefined) res.setHeader('X-Generation-Cost', String(img.costUnits));
  res.end(Buffer.from(img.bytes));
}

export function methodNotAllowed(
  req: IncomingMessage,
  res: ServerResponse,
  allowed: string[],
): boolean {
  const method = (req.method ?? 'GET').toUpperCase();
  if (allowed.map((m) => m.toUpperCase()).includes(method)) return false;
  res.statusCode = 405;
  res.setHeader('Allow', allowed.join(', '));
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ error: { code: 'BAD_REQUEST', message: `Method ${method} not allowed` } }));
  return true;
}
