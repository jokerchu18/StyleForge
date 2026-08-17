import { Link, useLocation } from 'react-router-dom';
import { en } from '../i18n/en';

interface Props {
  /** Override the privacy pill tone/label (default: private / "100% Private"). */
  pill?: { label: string; tone: 'private' | 'cloud' };
}

const ANCHORS = [
  { hash: '#converter', labelKey: 'navConverter' },
  { hash: '#styles', labelKey: 'navStyles' },
  { hash: '#how-it-works', labelKey: 'navHow' },
] as const;

export default function Header({ pill }: Props) {
  const tone = pill?.tone ?? 'private';
  const label = pill?.label ?? en.privacyPill;
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">S</span>
          <span className="logo-name">{en.appName}</span>
        </Link>

        <nav className="nav">
          {isHome
            ? ANCHORS.map((a) => (
                <a key={a.hash} href={a.hash} className="nav-link">
                  {en[a.labelKey]}
                </a>
              ))
            : ANCHORS.map((a) => (
                <a key={a.hash} href={`/${a.hash}`} className="nav-link">
                  {en[a.labelKey]}
                </a>
              ))}
        </nav>

        <span className={`privacy-pill privacy-pill--${tone}`}>
          {tone === 'cloud' ? (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 18a4.5 4.5 0 0 1-.6-8.95 5.5 5.5 0 0 1 10.7 1.2A3.75 3.75 0 0 1 17 18H7Z"
                fill="currentColor"
                opacity="0.25"
              />
              <path
                d="M7 17.5a4.5 4.5 0 0 1-.6-8.95 5.5 5.5 0 0 1 10.7 1.2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3 5 6v5c0 4.5 2.9 8.4 7 9.6 4.1-1.2 7-5.1 7-9.6V6l-7-3Z"
                fill="currentColor"
                opacity="0.25"
              />
              <path
                d="m9.5 11.8 1.7 1.7 3.6-3.6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          )}
          {label}
        </span>
      </div>
    </header>
  );
}
