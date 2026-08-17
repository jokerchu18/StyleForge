import type { PublicStyleDefinition } from '../../shared/style-types';
import { resolveStyleMeta } from '../../shared/styles';

interface Props {
  style: PublicStyleDefinition;
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
}

export default function StyleSampleCard({ style, selected, disabled, onSelect }: Props) {
  const { label, description } = resolveStyleMeta(style);

  return (
    <button
      type="button"
      className={`style-sample-card${selected ? ' selected' : ''}`}
      onClick={() => onSelect(style.id)}
      disabled={disabled}
      aria-pressed={selected}
    >
      <span className="style-sample-img-wrap">
        <img className="style-sample-img" src={style.sampleImage} alt="" loading="lazy" />
        <span className="preset-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="m5 12 4 4L19 7"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
      <strong>{label}</strong>
      <small>{description}</small>
    </button>
  );
}
