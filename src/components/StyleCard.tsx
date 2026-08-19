import type { PublicStyleDefinition } from '../shared/style-types';
import { resolveStyleMeta } from '../shared/styles';

interface Props {
  style: PublicStyleDefinition;
  /** Called when the card is activated (click / Use Style). */
  onUse?: (id: string) => void;
  /** Selected state for the Image-to-Image picker. */
  selected?: boolean;
  /** Compact variant for the Image-to-Image picker. */
  compact?: boolean;
  /** Override the card action label (default "Generate"). */
  actionLabel?: string;
}

/**
 * Image-first Style card used across Home, Explore and the Image-to-Image
 * picker. Pure presentational — no business logic.
 */
export default function StyleCard({ style, onUse, selected, compact, actionLabel }: Props) {
  const { label, description } = resolveStyleMeta(style);

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
        <span className="style-card-overlay" aria-hidden="true">
          <span className="style-card-use">{actionLabel ?? 'Generate'}</span>
        </span>
      </span>

      <span className="style-card-body">
        <span className="style-card-top">
          <strong className="style-card-name">{label}</strong>
          <span className="style-card-cat">{style.category}</span>
        </span>
        {!compact && description && (
          <span className="style-card-desc">{description}</span>
        )}
        {style.costUnits != null && (
          <span className="style-card-credit">{style.costUnits} credits</span>
        )}
      </span>
    </button>
  );
}
