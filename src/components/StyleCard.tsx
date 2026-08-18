import { useMemo } from 'react';
import type { PublicStyleDefinition } from '../shared/style-types';
import { resolveStyleMeta } from '../shared/styles';
import { formatCount, formatLikes, formatUses } from '../lib/mockEngagement';

interface Props {
  style: PublicStyleDefinition;
  /** Called when the card is activated (click / Use Style). */
  onUse?: (id: string) => void;
  /** Selected state for the Image-to-Image picker. */
  selected?: boolean;
  /** Compact variant for the Image-to-Image picker. */
  compact?: boolean;
}

/**
 * Image-first Style card used across Home, Explore and the Image-to-Image
 * picker. Pure presentational — no business logic.
 */
export default function StyleCard({ style, onUse, selected, compact }: Props) {
  const { label, description } = resolveStyleMeta(style);
  // Live counts from the DB catalog when present; deterministic mock as fallback.
  const likes = useMemo(
    () => (style.likeCount != null ? formatCount(style.likeCount) : formatLikes(style.id)),
    [style.id, style.likeCount],
  );
  const uses = useMemo(
    () => (style.usageCount != null ? formatCount(style.usageCount) : formatUses(style.id)),
    [style.id, style.usageCount],
  );

  return (
    <button
      type="button"
      className={`style-card${selected ? ' selected' : ''}${compact ? ' style-card--compact' : ''}`}
      onClick={() => onUse?.(style.id)}
      aria-pressed={selected}
      title={`${label} — ${style.category}`}
    >
      <span className="style-card-media">
        <img
          className="style-card-img"
          src={style.sampleImage}
          alt={`${label} style preview`}
          loading="lazy"
        />
        <span className="style-card-likes" aria-hidden="true">
          ♥ {likes}
        </span>
        <span className="style-card-overlay" aria-hidden="true">
          <span className="style-card-use">Use Style</span>
        </span>
      </span>

      <span className="style-card-body">
        <span className="style-card-top">
          <strong className="style-card-name">{label}</strong>
          <span className="style-card-cat">{style.category}</span>
        </span>
        <span className="style-card-meta">
          <span className="style-card-uses">{uses} uses</span>
          {!compact && description && (
            <span className="style-card-desc">{description}</span>
          )}
        </span>
      </span>
    </button>
  );
}
