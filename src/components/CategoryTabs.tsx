interface Props {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
  allLabel?: string;
}

/** Pills row for filtering the style gallery by category. */
export default function CategoryTabs({ categories, active, onChange, allLabel }: Props) {
  const items = ['all', ...categories];

  return (
    <div className="category-tabs" role="tablist" aria-label="Filter by category">
      {items.map((cat) => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`category-tab${isActive ? ' active' : ''}`}
            onClick={() => onChange(cat)}
          >
            {cat === 'all' ? (allLabel ?? 'All') : cat}
          </button>
        );
      })}
    </div>
  );
}
