import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAccount } from '../../hooks/useAccount';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/image-to-image', label: 'Image to Image' },
  { to: '/all-styles', label: 'All Styles' },
  { to: '/create-style', label: 'Create Style' },
  { to: '/blog', label: 'Blog' },
  { to: '/pricing', label: 'Pricing' },
] as const;

export default function SiteHeader() {
  const { user, loading, signOut, signInWithGoogle } = useAuth();
  const { account } = useAccount();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
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

  const isActive = (to: string) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-logo">
          StyleForge
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`site-nav-link${isActive(item.to) ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-header-right">
          {!loading && user && account && (
            <>
              <span className="user-greeting">
                {user.user_metadata?.name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'User'}
              </span>
              <Link to="/account" className="generations-chip" title="Credit balance">
                <span className="generations-bolt" aria-hidden="true">⚡</span>
                <span>{account.balance} Credits</span>
                {account.plan !== 'free' && (
                  <span className="plan-badge">{account.planLabel}</span>
                )}
              </Link>
            </>
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
                <Link to="/creations" className="avatar-dropdown-item">
                  My Creations
                </Link>
                <Link to="/account" className="avatar-dropdown-item">
                  Account & Credits
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
