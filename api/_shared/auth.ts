import type { IncomingMessage } from 'node:http';
import { supabaseAdmin } from './supabase.js';
import { ApiError } from './errors.js';

/** Resolve the authenticated user id from a Bearer token (service_role). */
export async function getUserId(req: IncomingMessage): Promise<string> {
  if (!supabaseAdmin) {
    throw new ApiError('INTERNAL', 'Supabase service role is not configured');
  }
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
  if (!token) {
    throw new ApiError('BAD_REQUEST', 'Missing bearer token');
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    throw new ApiError('BAD_REQUEST', 'Invalid or expired token');
  }
  return data.user.id;
}

/** Best-effort user id when the token may be absent (public endpoints). */
export async function getUserIdOptional(req: IncomingMessage): Promise<string | null> {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
  if (!token || !supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}
