import { useEffect, useState } from 'react';
import type { StyleCatalogResponse } from '../shared/style-types';
import { fetchStyles } from '../lib/styles/client';

/** Load the style catalog (cached fetch). Resolves to null until loaded. */
export function useStyles(): StyleCatalogResponse | null {
  const [catalog, setCatalog] = useState<StyleCatalogResponse | null>(null);

  useEffect(() => {
    let alive = true;
    fetchStyles()
      .then((data) => {
        if (alive) setCatalog(data);
      })
      .catch(() => {
        // Keep null; callers should degrade gracefully.
      });
    return () => {
      alive = false;
    };
  }, []);

  return catalog;
}
