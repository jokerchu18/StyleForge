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
  /** Override the card action label (default "Try Style"). */
  actionLabel?: string;
}

/**
 * Minimal, image-first Style card. The image takes ~80% of the card height.
 * Credits and CTA appear on hover; the heart button is always visible.
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
        {/* Heart button — always visible */}
        <span className="style-card-fav" role="button" tabIndex={-1} aria-label="Favorite">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </span>
        <img
          className="style-card-img"
          src={style.sampleImage}
          alt={`Photo transformed into ${label} with AI`}
          loading="lazy"
        />
        {/* Hover overlay: CTA + credits */}
        <span className="style-card-overlay" aria-hidden="true">
          <span className="style-card-overlay-inner">
            <span className="style-card-use">{actionLabel ?? 'Try Style'}</span>
            {style.costUnits != null && (
              <span className="style-card-credit-hover">⚡ {style.costUnits} Credits</span>
            )}
          </span>
        </span>
      </span>

      <span className="style-card-body">
        <strong className="style-card-name">{label}</strong>
        {!compact && description && (
          <span className="style-card-desc">{description}</span>
        )}
      </span>
    </button>
  );
}