// The style catalog — pure data, no logic.
// This is the local-file backing store for the style ecosystem. The backend
// serves it through the StyleCatalog repository (api/_shared/styleCatalog.ts);
// swapping this file for a database only means implementing that same
// interface, nothing else changes.
import type { StyleCategory, StyleDefinition } from './style-types.js';

/** Category display order (also used as the canonical category list). */
export const CATEGORY_PRESETS: StyleCategory[] = [
  'anime',
  'painting',
  'sketch',
  'photo',
];

export const STYLE_CATALOG: StyleDefinition[] = [
  // ── Local (on-device ONNX, AnimeGANv2) ─────────────────────────
  {
    id: 'hayao',
    engine: 'local',
    category: 'anime',
    tier: 'free',
    source: 'official',
    status: 'active',
    labelKey: 'hayao',
    descriptionKey: 'hayao',
    sampleImage: '/styles/local/hayao.png',
    model: 'Hayao',
    tags: ['anime', 'ghibli'],
    order: 1,
  },
  {
    id: 'shinkai',
    engine: 'local',
    category: 'anime',
    tier: 'free',
    source: 'official',
    status: 'active',
    labelKey: 'shinkai',
    descriptionKey: 'shinkai',
    sampleImage: '/styles/local/shinkai.png',
    model: 'Shinkai',
    tags: ['anime', 'colorful'],
    order: 2,
  },
  {
    id: 'paprika',
    engine: 'local',
    category: 'anime',
    tier: 'free',
    source: 'official',
    status: 'active',
    labelKey: 'paprika',
    descriptionKey: 'paprika',
    sampleImage: '/styles/local/paprika.png',
    model: 'Paprika',
    tags: ['anime', 'graphic'],
    order: 3,
  },

  // ── Cloud (API style-transfer) ────────────────────────────────
  {
    id: 'anime',
    engine: 'cloud',
    category: 'anime',
    tier: 'free',
    source: 'official',
    status: 'active',
    labelKey: 'anime',
    descriptionKey: 'anime',
    sampleImage: '/styles/api/anime.png',
    prompt:
      'Transform this photo into a Japanese anime style illustration with clean line art, vibrant cel shading and expressive eyes, keeping the original composition and subject',
    providerOverrides: {
      dashscope: { dashscopeFunction: 'control_cartoon_feature' },
      mock: { mockFilter: 'saturate' },
    },
    tags: ['anime'],
    order: 10,
  },
  {
    id: 'sci-fi',
    engine: 'cloud',
    category: 'photo',
    tier: 'free',
    source: 'official',
    status: 'active',
    labelKey: 'sci-fi',
    descriptionKey: 'sci-fi',
    sampleImage: '/styles/api/sci-fi.png',
    prompt:
      'Transform this photo into a sci-fi scene with futuristic neon glow, cyberpunk lighting and high-tech atmosphere, keeping the original subject',
    providerOverrides: {
      dashscope: { dashscopeFunction: 'stylization_all' },
      mock: { mockFilter: 'tint' },
    },
    tags: ['sci-fi', 'neon'],
    order: 11,
  },
  {
    id: 'hk',
    engine: 'cloud',
    category: 'photo',
    tier: 'free',
    source: 'official',
    status: 'active',
    labelKey: 'hk',
    descriptionKey: 'hk',
    sampleImage: '/styles/api/hk.png',
    prompt:
      'Transform this photo into a retro Hong Kong cinema look with warm nostalgic tones, film grain and 90s atmosphere, keeping the original subject',
    providerOverrides: {
      dashscope: { dashscopeFunction: 'stylization_all' },
      mock: { mockFilter: 'sepia' },
    },
    tags: ['retro', 'film'],
    order: 12,
  },
  {
    id: 'oil-painting',
    engine: 'cloud',
    category: 'painting',
    tier: 'free',
    source: 'official',
    status: 'active',
    labelKey: 'oil-painting',
    descriptionKey: 'oil-painting',
    sampleImage: '/styles/api/oil-painting.png',
    prompt:
      'Transform this photo into an oil painting with visible brush strokes, rich canvas texture and classic painterly style, keeping the original subject',
    providerOverrides: {
      dashscope: { dashscopeFunction: 'stylization_all' },
      mock: { mockFilter: 'sepia' },
    },
    tags: ['painting', 'canvas'],
    order: 13,
  },
  {
    id: 'sketch',
    engine: 'cloud',
    category: 'sketch',
    tier: 'free',
    source: 'official',
    status: 'active',
    labelKey: 'sketch',
    descriptionKey: 'sketch',
    sampleImage: '/styles/api/sketch.png',
    prompt:
      'Transform this photo into a pencil sketch drawing with clean line work and grayscale shading, keeping the original subject and composition',
    providerOverrides: {
      dashscope: { dashscopeFunction: 'stylization_all' },
      mock: { mockFilter: 'grayscale' },
    },
    tags: ['sketch', 'pencil'],
    order: 14,
  },
  {
    id: 'watercolor',
    engine: 'cloud',
    category: 'painting',
    tier: 'free',
    source: 'official',
    status: 'active',
    labelKey: 'watercolor',
    descriptionKey: 'watercolor',
    sampleImage: '/styles/api/watercolor.png',
    prompt:
      'Transform this photo into a soft watercolor painting with gentle color washes and delicate brush strokes, keeping the original subject',
    providerOverrides: {
      dashscope: { dashscopeFunction: 'stylization_all' },
      mock: { mockFilter: 'saturate' },
    },
    tags: ['painting', 'soft'],
    order: 15,
  },
];
