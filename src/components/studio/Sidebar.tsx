import { en } from '../../i18n/en';
import type { Feature } from '../../shared/styles';
import type { PublicStyleDefinition, StyleCategory } from '../../shared/style-types';
import { CATEGORY_PRESETS } from '../../shared/styles-catalog';
import StyleSampleCard from './StyleSampleCard';

interface Props {
  feature: Feature;
  /** Styles for the active feature (already engine-filtered). */
  styles: PublicStyleDefinition[];
  selected: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

function groupByCategory(styles: PublicStyleDefinition[]): [StyleCategory, PublicStyleDefinition[]][] {
  const map = new Map<StyleCategory, PublicStyleDefinition[]>();
  for (const s of styles) {
    const group = map.get(s.category) ?? [];
    group.push(s);
    map.set(s.category, group);
  }
  for (const group of map.values()) {
    group.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  const ordered = [
    ...CATEGORY_PRESETS.filter((c) => map.has(c)),
    ...[...map.keys()].filter((c) => !CATEGORY_PRESETS.includes(c)),
  ];
  return ordered.map((c) => [c, map.get(c)!]);
}

export default function Sidebar({ feature, styles, selected, onSelect, disabled }: Props) {
  const hint = feature === 'browser' ? en.browserStyleHint : en.apiStyleHint;
  const groups = groupByCategory(styles);

  return (
    <aside className="studio-sidebar">
      <p className="style-hint">{hint}</p>
      {groups.map(([category, groupStyles]) => (
        <div className="style-group" key={category}>
          <div className="style-group-head">
            <h2>{category}</h2>
            <span className="style-group-count">{groupStyles.length}</span>
          </div>
          <div className="style-sample-list">
            {groupStyles.map((s) => (
              <StyleSampleCard
                key={s.id}
                style={s}
                selected={selected === s.id}
                disabled={disabled}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
