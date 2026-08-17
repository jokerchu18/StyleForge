import { Link, useLocation } from 'react-router-dom';
import { en } from '../../i18n/en';
import type { Feature } from '../../shared/styles';
import AuthButton from '../AuthButton';

interface Props {
  feature: Feature;
  onFeature: (f: Feature) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export default function AppSidebar({ feature, onFeature, collapsed, onToggle }: Props) {
  const { pathname } = useLocation();
  const isHome = pathname === '/home';
  const isExplore = pathname === '/explore';
  const isCreate = pathname === '/create';
  const isBlog = pathname === '/blog';

  return (
    <aside className={`app-sidebar${collapsed ? ' app-sidebar--collapsed' : ''}`}>
      <button
        type="button"
        className="app-sidebar-toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M9 3v18" />
        </svg>
      </button>

      <div className="app-sidebar-inner">
        <div className="app-sidebar-top">
          <Link to="/home" className="logo app-sidebar-logo" title={en.appName}>
            <span className="logo-mark">S</span>
            {!collapsed && <span className="logo-name">{en.appName}</span>}
          </Link>
        </div>

        <nav className="app-nav" aria-label="Navigation">
          {/* Home — back to landing */}
          <Link to="/home" className={`app-nav-item${isHome ? ' active' : ''}`} title="Back to home">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 11 12 4l8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 10v9h12v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {!collapsed && <span className="app-nav-text"><strong>{en.appNavHome}</strong></span>}
          </Link>

          {/* Explore Styles */}
          <Link to="/explore" className={`app-nav-item${isExplore ? ' active' : ''}`} title="Explore Styles">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="m14.5 9.5-5 2-2 5 5-2 2-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" />
            </svg>
            {!collapsed && <span className="app-nav-text"><strong>Explore Styles</strong></span>}
          </Link>

          {/* Create Style */}
          <Link to="/create" className={`app-nav-item${isCreate ? ' active' : ''}`} title="Create Style">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {!collapsed && <span className="app-nav-text"><strong>{en.create.navLabel}</strong></span>}
          </Link>

          {/* Image to Image — Local */}
          <button
            type="button"
            className={`app-nav-item${!isHome && !isExplore && !isCreate && !isBlog && feature === 'browser' ? ' active' : ''}`}
            onClick={() => onFeature('browser')}
            title="Img2Img — Local"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="4" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="9" cy="10" r="1.7" fill="currentColor" />
              <path d="m4 16 4-3.5 3 2.5 3-2.5L20 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            {!collapsed && <span className="app-nav-text"><strong>{en.featureBrowser}</strong></span>}
          </button>

          {/* Image to Image — Cloud */}
          <button
            type="button"
            className={`app-nav-item${!isHome && !isExplore && !isCreate && !isBlog && feature === 'api' ? ' active' : ''}`}
            onClick={() => onFeature('api')}
            title="Img2Img — Cloud"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 18a4.5 4.5 0 0 1-.6-8.95 5.5 5.5 0 0 1 10.7 1.2A3.75 3.75 0 0 1 17 18H7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
            </svg>
            {!collapsed && <span className="app-nav-text"><strong>{en.featureApi}</strong></span>}
          </button>
        </nav>

        <div className="app-nav app-nav--foot">
          <Link to="/blog" className={`app-nav-item${isBlog ? ' active' : ''}`} title={en.appNavBlog}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="3" width="16" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {!collapsed && <span className="app-nav-text"><strong>{en.appNavBlog}</strong></span>}
          </Link>
          <AuthButton collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}
