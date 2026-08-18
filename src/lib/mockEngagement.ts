// Deterministic placeholder engagement data. There is no backend for likes /
// uses yet, so these derive stable pseudo-numbers from a style id — cards read
// like a discovery gallery without any server round-trip.

export function mockCount(key: string, min: number, max: number): number {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return min + (Math.abs(h) % (max - min));
}

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function mockLikes(styleId: string): number {
  return mockCount(styleId, 80, 1500);
}

export function mockUses(styleId: string): number {
  return mockCount(`${styleId}:u`, 200, 5200);
}

export function formatLikes(styleId: string): string {
  return formatCount(mockLikes(styleId));
}

export function formatUses(styleId: string): string {
  return formatCount(mockUses(styleId));
}
