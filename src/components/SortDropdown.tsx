interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}

/** Compact sort select for the gallery filter bar. */
export default function SortDropdown({ value, onChange, options }: Props) {
  return (
    <label className="sort-dropdown">
      <span className="sort-dropdown-label">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort styles"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
