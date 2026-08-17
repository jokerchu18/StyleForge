import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '../components/studio/AppSidebar';
import { en } from '../i18n/en';
import type { Feature } from '../shared/styles';
import { resolveStyleMeta } from '../shared/styles';
import { useStyles } from '../hooks/useStyles';

type EngineFilter = 'all' | 'local' | 'cloud';

export default function ExplorePage() {
  const [collapsed, setCollapsed] = useState(false);
  const [engine, setEngine] = useState<EngineFilter>('all');
  const [category, setCategory] = useState<string>('all');
  const navigate = useNavigate();
  const catalog = useStyles();
  const styles = catalog?.styles ?? [];
  const categories = catalog?.categories ?? [];

  useEffect(() => {
    document.title = `${en.appName} — Explore Styles`;
  }, []);

  const goFeature = (f: Feature) => navigate(`/?feature=${f}`);

  const displayed = styles.filter((s) => {
    if (engine !== 'all' && s.engine !== engine) return false;
    if (category !== 'all' && s.category !== category) return false;
    return true;
  });

  return (
    <div className="page page--app">
      <AppSidebar
        feature="browser"
        onFeature={goFeature}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      <main className={`app-main landing-app-main${collapsed ? ' app-main--collapsed' : ''}`}>
        <div className="explore-head">
          <h1 className="hero-h1">Explore Styles</h1>
          <p className="hero-sub">Browse all available styles — on-device anime looks and cloud AI transformations.</p>
          <div className="explore-filters">
            {(['all', 'local', 'cloud'] as const).map((e) => (
              <button
                key={e}
                type="button"
                className={`explore-filter-btn${engine === e ? ' active' : ''}`}
                onClick={() => setEngine(e)}
              >
                {e === 'all' ? 'All' : e === 'local' ? 'On-device' : 'Cloud AI'}
              </button>
            ))}
          </div>
          <div className="explore-filters">
            <button
              type="button"
              className={`explore-filter-btn${category === 'all' ? ' active' : ''}`}
              onClick={() => setCategory('all')}
            >
              All categories
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`explore-filter-btn${category === c ? ' active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="explore-grid">
          {displayed.map((s) => {
            const { label, description } = resolveStyleMeta(s);
            return (
              <button
                key={s.id}
                type="button"
                className="explore-card"
                onClick={() => navigate(`/?feature=${s.engine === 'local' ? 'browser' : 'api'}`)}
              >
                <div className="explore-card-img-wrap">
                  <img src={s.sampleImage} alt={label} loading="lazy" className="explore-card-img" />
                  <span className={`explore-card-badge explore-card-badge--${s.engine}`}>
                    {s.engine === 'local' ? 'On-device' : 'Cloud'}
                  </span>
                </div>
                <div className="explore-card-body">
                  <strong>{label}</strong>
                  {description && <small>{description}</small>}
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
