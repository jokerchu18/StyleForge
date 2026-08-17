// Direct model inference test script.
// Usage:
//   node scripts/generate.mjs <photo.jpg|png> [style=Hayao] [out.png]
//
// Replicates the browser pipeline: resize to max side 512 (multiple of 8),
// NHWC float32 [-1,1] tensor, AnimeGANv2 ONNX inference, clamp to RGB, save PNG.
import sharp from 'sharp';
import * as ort from 'onnxruntime-node';

const STYLES = ['Hayao', 'Shinkai', 'Paprika'];
const MAX_SIDE = 512;

function parseArgs() {
  const [input, styleArg, outArg] = process.argv.slice(2);
  const style = STYLES.includes(styleArg) ? styleArg : 'Hayao';
  const out = styleArg && STYLES.includes(styleArg) ? outArg : styleArg;
  return {
    input,
    style,
    out: out || `out-${style}.png`,
  };
}

/** Load image, scale to max side rounded to multiple of 8, return raw RGB bytes + dims. */
async function preprocess(imagePath) {
  const meta = await sharp(imagePath).metadata();
  const scale = Math.min(1, MAX_SIDE / Math.max(meta.width, meta.height));
  const width = Math.max(8, Math.round((meta.width * scale) / 8) * 8);
  const height = Math.max(8, Math.round((meta.height * scale) / 8) * 8);
  const { data } = await sharp(imagePath)
    .resize(width, height, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width, height };
}

/** NHWC RGB bytes -> Float32Array normalized to [-1, 1]. */
function toTensor(rgb, n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    out[i * 3] = (rgb[i * 3] / 255) * 2 - 1;
    out[i * 3 + 1] = (rgb[i * 3 + 1] / 255) * 2 - 1;
    out[i * 3 + 2] = (rgb[i * 3 + 2] / 255) * 2 - 1;
  }
  return out;
}

/** Float32 output (Tanh ~[-1,1], NHWC) -> RGB Uint8Array. */
function toRgb(data, n) {
  const out = new Uint8Array(n * 3);
  const clamp255 = (v) => {
    const normalized = v <= 1 && v >= -1 ? (v + 1) / 2 : v;
    return Math.max(0, Math.min(255, Math.round(normalized * 255)));
  };
  for (let i = 0; i < n; i++) {
    out[i * 3] = clamp255(data[i * 3]);
    out[i * 3 + 1] = clamp255(data[i * 3 + 1]);
    out[i * 3 + 2] = clamp255(data[i * 3 + 2]);
  }
  return out;
}

const { input, style, out } = parseArgs();
if (!input) {
  console.error('Usage: node scripts/generate.mjs <photo> [style] [out.png]');
  console.error('Styles: ' + STYLES.join(', '));
  process.exit(1);
}

console.log(`Input:  ${input}`);
console.log(`Style:  ${style}`);
console.log(`Output: ${out}`);
console.log('Loading image…');

const { data: rgb, width, height } = await preprocess(input);
const n = width * height;
console.log(`Tensor: ${width}x${height} (NHWC float32, [-1,1])`);

console.log(`Loading model models/${style}.onnx…`);
const session = await ort.InferenceSession.create(`public/models/${style}.onnx`);
console.log('Running inference…');
const t0 = Date.now();
const tensor = new ort.Tensor('float32', toTensor(rgb, n), [1, height, width, 3]);
const results = await session.run({ [session.inputNames[0]]: tensor });
const output = results[session.outputNames[0]];
const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
console.log(`Inference done in ${elapsed}s, output dims=${output.dims.join('x')}`);

// NHWC [1, H, W, 3] -> width = dims[2], height = dims[1]
const outWidth = output.dims[2];
const outHeight = output.dims[1];
const outRgb = toRgb(output.data, outWidth * outHeight);
await sharp(outRgb, { raw: { width: outWidth, height: outHeight, channels: 3 } })
  .png()
  .toFile(out);

console.log(`Saved ${out} (${outWidth}x${outHeight})`);
