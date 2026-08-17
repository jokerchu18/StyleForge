const MAX_SIDE = 512;

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image. Please use a valid image file.'));
    };
    img.src = url;
  });
}

/** Scale an image down to a max side and round to a multiple of 8. */
export function resizeToCanvas(
  img: HTMLImageElement,
  maxSide = MAX_SIDE,
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  let width = Math.max(8, Math.round((img.width * scale) / 8) * 8);
  let height = Math.max(8, Math.round((img.height * scale) / 8) * 8);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not supported in this browser.');
  }
  ctx.drawImage(img, 0, 0, width, height);
  return { canvas, width, height };
}

/**
 * Convert canvas pixels to an NHWC float32 tensor normalized to [-1, 1].
 * The AnimeGANv2 ONNX models expect layout [1, H, W, 3] (channels last).
 */
export function canvasToTensor(
  canvas: HTMLCanvasElement,
): { data: Float32Array; width: number; height: number } {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not supported in this browser.');
  }
  const { data: rgba, width, height } = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const n = width * height;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    out[i * 3] = (rgba[i * 4] / 255) * 2 - 1; // R
    out[i * 3 + 1] = (rgba[i * 4 + 1] / 255) * 2 - 1; // G
    out[i * 3 + 2] = (rgba[i * 4 + 2] / 255) * 2 - 1; // B
  }
  return { data: out, width, height };
}
