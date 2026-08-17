/** Convert an NHWC float32 output tensor (Tanh ~[-1,1]) to a canvas. */
export function tensorToCanvas(
  data: Float32Array,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not supported in this browser.');
  }
  const imageData = ctx.createImageData(width, height);
  const n = width * height;
  for (let i = 0; i < n; i++) {
    imageData.data[i * 4] = clamp255(data[i * 3]); // R
    imageData.data[i * 4 + 1] = clamp255(data[i * 3 + 1]); // G
    imageData.data[i * 4 + 2] = clamp255(data[i * 3 + 2]); // B
    imageData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function clamp255(v: number): number {
  // Assumes output is ~[-1, 1]; also tolerates [0, 255] outputs.
  const normalized = v <= 1 && v >= -1 ? (v + 1) / 2 : v;
  return Math.max(0, Math.min(255, Math.round(normalized * 255)));
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
