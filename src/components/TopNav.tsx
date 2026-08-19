import { Link } from 'react-router-dom';

const CATS = [
  { label: 'All Styles',     to: '/all-styles' },
  { label: 'Trending',       to: '/all-styles?category=Trending' },
  { label: 'Character',      to: '/all-styles?category=Character' },
  { label: 'Worlds',         to: '/all-styles?category=Worlds' },
  { label: 'Creative',       to: '/all-styles?category=Creative' },
] as const;

/** Horizontal category-discovery strip (PromptHero-style browsing). */
export default function TopNav() {
  return (
    <nav className="topnav" aria-label="Browse styles">
      {CATS.map((c) => (
        <Link key={c.label} to={c.to} className="topnav-link">
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
