import { Link } from 'react-router-dom';

const CATS = [
  { label: 'All Styles',     to: '/explore' },
  { label: 'Anime',          to: '/explore?category=anime' },
  { label: 'Oil Painting',   to: '/explore?category=painting' },
  { label: 'Pencil Sketch',  to: '/explore?category=sketch' },
  { label: 'Realistic Photo', to: '/explore?category=photo' },
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
