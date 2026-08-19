interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Inline search input with a leading magnifier icon. */
export default function SearchBar({ value, onChange, placeholder }: Props) {
  return (
    <label className="search-bar">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.2-3.2" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search styles, categories, or tags...'}
        aria-label="Search styles"
      />
    </label>
  );
}
