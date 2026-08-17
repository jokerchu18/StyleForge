import { ApiError } from './errors.js';

const SUPPORTED: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

/** Sniff the image MIME type from magic bytes (prevents forged Content-Type). */
export function sniffMime(bytes: Uint8Array): string {
  const b = bytes;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return SUPPORTED.png;
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return SUPPORTED.jpeg;
  }
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return SUPPORTED.webp;
  }
  if (
    b.length >= 6 &&
    (b[0] === 0x47) && b[1] === 0x49 && b[2] === 0x46 &&
    b[3] === 0x38 && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61
  ) {
    return SUPPORTED.gif;
  }
  throw new ApiError('BAD_REQUEST', 'Unsupported image format (jpeg/png/webp/gif only)');
}
