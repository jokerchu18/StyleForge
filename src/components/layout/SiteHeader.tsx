import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAccount } from '../../hooks/useAccount';

const NAV = [
  { to: '/', hash: '#hero',          label: 'Home' },
  { to: '/', hash: '#style-transfer', label: 'Style Transfer' },
  { to: '/', hash: '#ai-styles',      label: 'AI Styles' },
  { to: '/', hash: '#create-style',   label: 'Create Style' },
  { to: '/', hash: '#blog',           label: 'Blog' },
  { to: '/', hash: '#pricing',        label: 'Pricing' },
] as const;

function scrollToSection(hash: string) {
  const el = document.querySelector(hash);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export default function SiteHeader() {
  const { user, loading, signOut, signInWithGoogle } = useAuth();
  const { account } = useAccount();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState('#hero');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    if (pathname !== '/') return;
    const ids = NAV.map((n) => n.hash.slice(1));
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveHash(`#${id}`);
        },
        { threshold: 0.3 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [pathname]);

  const handleNavClick = (e: React.MouseEvent, hash: string) => {
    if (pathname === '/') {
      e.preventDefault();
      scrollToSection(hash);
      setActiveHash(hash);
    }
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-logo" onClick={(e) => handleNavClick(e, '#hero')}>
          StyleForge
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {NAV.map((item) => (
            <a
              key={item.hash}
              href={pathname === '/' ? item.hash : `/${item.hash}`}
              className={`site-nav-link${pathname === '/' && activeHash === item.hash ? ' active' : ''}`}
              onClick={(e) => handleNavClick(e, item.hash)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-header-right">
          {!loading && user && account && (
            <Link to="/account" className="generations-chip" title="Generation History">
              <span className="generations-bolt" aria-hidden="true">⚡</span>
              <span>{account.balance} Generations</span>
              {account.plan !== 'free' && (
                <span className="plan-badge">{account.planLabel}</span>
              )}
            </Link>
          )}

          <div className="avatar-menu" ref={menuRef}>
            {!loading && user && (
              <button
                type="button"
                className="avatar-btn"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {(user.user_metadata?.avatar_url as string | undefined) ? (
                  <img
                    className="avatar-img"
                    src={user.user_metadata.avatar_url as string}
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="avatar-fallback">
                    {(user.email?.[0] ?? 'U').toUpperCase()}
                  </span>
                )}
              </button>
            )}

            {menuOpen && (
              <div className="avatar-dropdown" role="menu">
                <div className="avatar-dropdown-head">
                  <strong>{user?.user_metadata?.name ?? user?.email ?? 'User'}</strong>
                  <span>{account?.planLabel ?? 'Free'}</span>
                </div>
                <Link to="/account" className="avatar-dropdown-item">
                  My Creations
                </Link>
                <Link to="/account" className="avatar-dropdown-item">
                  Generation History
                </Link>
                <button
                  type="button"
                  className="avatar-dropdown-item avatar-dropdown-signout"
                  onClick={signOut}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          {!loading && !user && (
            <button
              type="button"
              className="btn-primary site-login-btn"
              onClick={signInWithGoogle}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
