// Lightweight image utilities for upload and resize (cloud API only).

export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export function resizeToCanvas(
  img: HTMLImageElement,
  maxDimension: number,
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const { width: w, height: h } = img;
  const scale = Math.min(1, maxDimension / Math.max(w, h));
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context unavailable');
  }
  ctx.drawImage(img, 0, 0, width, height);
  return { canvas, width, height };
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
