// Frontend client for the style catalog endpoint. Fetches once and caches, so
// the catalog is loaded over HTTP (not statically imported) — swapping the
// backend store for a database later is invisible to the UI.
import type { StyleCatalogResponse } from '../../shared/style-types';

let cache: StyleCatalogResponse | undefined;
let inFlight: Promise<StyleCatalogResponse> | undefined;

export async function fetchStyles(): Promise<StyleCatalogResponse> {
  if (cache) return cache;
  if (!inFlight) {
    inFlight = (async () => {
      const res = await fetch('/api/styles');
      if (!res.ok) {
        throw new Error(`Failed to load styles (${res.status})`);
      }
      const data = (await res.json()) as StyleCatalogResponse;
      cache = data;
      return data;
    })().finally(() => {
      inFlight = undefined;
    });
  }
  return inFlight;
}
