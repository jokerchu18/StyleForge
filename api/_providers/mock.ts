// Mock provider: no API key needed. Locally transforms the uploaded image with
// sharp, applying a deterministic filter per style. Reference implementation
// for writing real providers and for key-free dev/CI.
import sharp from 'sharp';
import type { GenerateImageResult, ImageProvider, TransformImageOptions } from '../_shared/provider.js';
import type { MockFilter } from '../../src/shared/style-types.js';

export const mockProvider: ImageProvider = {
  id: 'mock',
  label: 'Mock (local)',
  isConfigured: () => true,

  async transform(opts: TransformImageOptions): Promise<GenerateImageResult> {
    await new Promise((r) => setTimeout(r, 500));
    const img = await applyMockFilter(
      opts.imageBytes,
      opts.style.providerOverrides?.mock?.mockFilter ?? 'saturate',
    );
    const meta = await sharp(img).metadata();
    return {
      bytes: new Uint8Array(await sharp(img).png().toBuffer()),
      mime: 'image/png',
      width: meta.width,
      height: meta.height,
      model: 'mock',
    };
  },
};

async function applyMockFilter(bytes: Uint8Array, filter: MockFilter): Promise<Buffer> {
  let pipeline = sharp(bytes).resize(512, 512, { fit: 'inside' });
  switch (filter) {
    case 'sepia':
      pipeline = pipeline.modulate({ saturation: 0.6 });
      break;
    case 'grayscale':
      pipeline = pipeline.grayscale();
      break;
    case 'saturate':
      pipeline = pipeline.modulate({ saturation: 1.6 });
      break;
    case 'tint':
      pipeline = pipeline.modulate({ saturation: 1.2 });
      break;
  }
  return pipeline.toBuffer();
}
