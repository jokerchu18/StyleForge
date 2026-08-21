// Creem Moderation API — content moderation for user-generated prompts and images.
// POST /v1/moderation classifies text against safety categories.

export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: Record<string, number>;
}

export interface ModerationResponse {
  id: string;
  model: string;
  results: ModerationResult[];
}

const MODERATION_URL = 'https://api.creem.io/v1/moderation';
const TEST_MODERATION_URL = 'https://test-api.creem.io/v1/moderation';

function apiKey(): string {
  return process.env.CREEM_API_KEY ?? '';
}

function baseUrl(): string {
  return process.env.CREEM_TEST_MODE === 'true' ? TEST_MODERATION_URL : MODERATION_URL;
}

/**
 * Moderate text content against Creem's safety categories.
 * Returns true if the content is flagged.
 */
export async function moderateText(
  input: string,
  categories?: string[],
): Promise<ModerationResult> {
  const key = apiKey();
  if (!key) {
    // Not configured — allow everything.
    return { flagged: false, categories: {}, category_scores: {} };
  }

  const res = await fetch(baseUrl(), {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input,
      categories: categories ?? ['hate', 'self-harm', 'sexual', 'violence'],
    }),
  });

  if (!res.ok) {
    // Fail open: if moderation is down, allow the request.
    console.warn(`Moderation API returned ${res.status}`);
    return { flagged: false, categories: {}, category_scores: {} };
  }

  const json = (await res.json()) as ModerationResponse;
  return json.results?.[0] ?? { flagged: false, categories: {}, category_scores: {} };
}