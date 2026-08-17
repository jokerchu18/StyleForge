// Reusable "save a style" interface. Used by the Create Style form now, and by
// the "save generated result as style" flow later (pass the generated Blob as
// sampleImage). Uploads the sample image to Supabase Storage, then posts the
// submission to POST /api/styles.
import type { CommunityStyleRecord, StyleSubmission } from '../../shared/style-types';
import { supabase } from '../supabase';

export interface SaveStyleInput {
  label: string;
  description: string;
  category: string;
  prompt: string;
  model: string;
  seed?: number;
  /** Sample image: an uploaded File, or a generated Blob. */
  sampleImage: File | Blob;
}

function extForType(type: string): string {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  if (type === 'image/jpeg') return 'jpg';
  return 'png';
}

export async function saveStyle(input: SaveStyleInput): Promise<CommunityStyleRecord> {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) {
    throw new Error('You must be signed in to save a style');
  }

  // 1. Upload the sample image to Storage.
  const ext = extForType(input.sampleImage.type);
  const userId = session.user.id;
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('style-samples')
    .upload(path, input.sampleImage, { contentType: input.sampleImage.type || 'image/png' });
  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }
  const { data: urlData } = supabase.storage.from('style-samples').getPublicUrl(path);
  const sampleImage = urlData.publicUrl;

  // 2. Post the submission.
  const submission: StyleSubmission = {
    label: input.label,
    description: input.description,
    category: input.category,
    sampleImage,
    prompt: input.prompt,
    model: input.model,
    ...(input.seed != null ? { seed: input.seed } : {}),
  };

  const res = await fetch('/api/styles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(submission),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to save style (${res.status}): ${text}`);
  }

  return (await res.json()) as CommunityStyleRecord;
}
