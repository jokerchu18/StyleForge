import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '../components/studio/AppSidebar';
import { en } from '../i18n/en';
import type { Feature } from '../shared/styles';
import { resolveStyleMeta } from '../shared/styles';
import { useStyles } from '../hooks/useStyles';

export default function LandingPage() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const catalog = useStyles();
  const styles = catalog?.styles ?? [];

  useEffect(() => {
    document.title = `${en.appName} — Free AI Photo Stylizer: Anime, Sci-Fi & More`;
  }, []);

  const goFeature = (f: Feature) => navigate(`/?feature=${f}`);

  const features: { feature: Feature; title: string; desc: string; icon: 'browser' | 'api' }[] = [
    {
      feature: 'browser',
      title: en.featureBrowser,
      desc: en.featureBrowserHint,
      icon: 'browser',
    },
    {
      feature: 'api',
      title: en.featureApi,
      desc: en.featureApiHint,
      icon: 'api',
    },
  ];

  return (
    <div className="page page--app">
      <AppSidebar
        feature="browser"
        onFeature={goFeature}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      <main className={`app-main landing-app-main${collapsed ? ' app-main--collapsed' : ''}`}>
        {/* Hero */}
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <h1 className="hero-h1">
              {en.homeHeroTitle}{' '}
              <span className="hero-accent">{en.homeHeroAccent}</span>
            </h1>
            <p className="hero-sub">{en.homeHeroSubtitle}</p>
            <div className="landing-cta">
              <a href="#features" className="btn-primary">
                {en.homeHeroCta}
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="landing-section">
          <div className="landing-section-inner">
            <div className="section-head">
              <h2>{en.landingFeaturesTitle}</h2>
              <p>{en.landingFeaturesSubtitle}</p>
            </div>
            <div className="landing-features">
              {features.map((f) => (
                <button
                  key={f.feature}
                  type="button"
                  className="landing-feature-card"
                  onClick={() => goFeature(f.feature)}
                >
                  <span className="landing-feature-icon" aria-hidden="true">
                    {f.icon === 'browser' ? (
                      <svg viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="9" cy="10" r="1.7" fill="currentColor" />
                        <path d="m4 16 4-3.5 3 2.5 3-2.5L20 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M7 18a4.5 4.5 0 0 1-.6-8.95 5.5 5.5 0 0 1 10.7 1.2A3.75 3.75 0 0 1 17 18H7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
                      </svg>
                    )}
                  </span>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                  <span className="landing-feature-go" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Style previews */}
        <section id="styles" className="landing-section landing-section--alt">
          <div className="landing-section-inner">
            <div className="section-head">
              <h2>{en.landingStylesTitle}</h2>
              <p>{en.landingStylesSubtitle}</p>
            </div>
            <div className="landing-styles">
              {styles.map((s) => (
                <div key={s.id} className="landing-style-item">
                  <img src={s.sampleImage} alt="" loading="lazy" />
                  <span>{resolveStyleMeta(s).label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
