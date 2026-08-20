import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import StyleCard from '../components/StyleCard';
import StyleGrid from '../components/StyleGrid';
import SearchBar from '../components/SearchBar';
import TopNav from '../components/TopNav';
import { useStyles } from '../hooks/useStyles';
import { resolveStyleMeta } from '../shared/styles';
import { setPageMeta } from '../lib/seo';

const HOW_IT_WORKS = [
  {
    title: 'Upload Your Photo',
    desc: 'Start with a portrait, selfie, landscape, travel photo, or any image you want to transform.',
  },
  {
    title: 'Choose a Style',
    desc: 'Explore curated styles designed for AI image transformation, from anime and cartoon to cinematic, cyberpunk, fantasy, Y2K, and more.',
  },
  {
    title: 'Transform with AI',
    desc: 'Our image-to-image AI applies the selected Style\'s prompt and visual configuration to create a new version of your image.',
  },
];

const TRANSFORMATION_TITLES = [
  'Cinematic Editorial',
  'Y2K Flash',
  'Street Style',
  'Minecraft World',
  'Fantasy Warrior',
  'Dreamscape',
];

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const catalog = useStyles();
  const styles = catalog?.styles ?? [];

  useEffect(() => {
    setPageMeta(
      'AI Image Transformation & Image-to-Image AI | StyleForge',
      'Transform your photos with AI image transformation and curated image-to-image styles. Turn portraits into anime, cartoon, cinematic, cyberpunk, and more.',
    );
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/all-styles?q=${encodeURIComponent(q)}` : '/all-styles');
  };

  const showcase = styles.slice(0, 7);
  const transformations = styles.filter((s) => TRANSFORMATION_TITLES.includes(resolveStyleMeta(s).label));
  const transformationsList = transformations.length ? transformations : styles.slice(0, 6);

  return (
    <AppLayout>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section id="hero" className="sp-hero">
        <div className="sp-hero-content">
          <h1 className="sp-hero-title">
            Transform Your Images<br />
            <span className="sp-hero-accent">with AI.</span>
          </h1>
          <p className="sp-hero-sub">
            Turn your photos into cinematic editorials, anime characters, cartoon portraits, futuristic worlds, and more with AI image transformation.
          </p>
          <div className="sp-hero-cta">
            <button type="button" className="btn-primary btn-lg" onClick={() => navigate('/image-to-image')}>
              Try Image to Image
            </button>
          </div>
          <form className="sp-hero-search" onSubmit={submitSearch}>
            <SearchBar value={query} onChange={setQuery} placeholder="Search styles, categories, or tags…" />
            <button type="submit" className="btn-primary">Search</button>
          </form>
          <TopNav />
        </div>
      </section>

      {/* ── AI Image feature intro ───────────────────────────── */}
      <section id="ai-image" className="sp-section">
        <div className="sp-inner">
          <div className="sp-section-head">
            <h2 className="sp-section-title">AI Image Transformation</h2>
            <p className="sp-section-sub">
              StyleForge transforms your existing photos into completely new visual styles with image-to-image AI. Upload an image, choose a Style, and let a carefully crafted AI prompt guide the transformation.
            </p>
          </div>
          <div className="ai-image-features">
            <div className="ai-image-feature">
              <h3>Image-to-Image AI</h3>
              <p>Start with your own photo and transform it into a new visual while keeping the subject and important elements recognizable.</p>
            </div>
            <div className="ai-image-feature">
              <h3>Transform with AI Styles</h3>
              <p>Choose from cinematic, anime, cartoon, cyberpunk, fantasy, Y2K, fashion, and other curated visual styles.</p>
            </div>
            <div className="ai-image-feature">
              <h3>Curated AI Prompts</h3>
              <p>Every Style is powered by a carefully crafted AI prompt designed to guide the transformation's lighting, composition, color, atmosphere, texture, and visual direction.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how-it-works" className="sp-section sp-alt">
        <div className="sp-inner">
          <div className="sp-section-head">
            <h2 className="sp-section-title">Transform Your Photo in Three Steps</h2>
          </div>
          <div className="how-grid">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.title} className="how-card">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="sp-section-cta">
            <button type="button" className="btn-primary btn-lg" onClick={() => navigate('/image-to-image')}>
              Try Image to Image
            </button>
          </div>
        </div>
      </section>

      {/* ── Styles Showcase ─────────────────────────────────── */}
      <section id="styles" className="sp-section">
        <div className="sp-inner">
          <div className="sp-section-head">
            <h2 className="sp-section-title">Explore AI Image Transformation Styles</h2>
            <p className="sp-section-sub">
              Discover Styles designed to transform your existing images into new visual worlds. Turn a photo into an anime character, reimagine a portrait as cartoon art, create a cinematic editorial, or explore futuristic and fantasy aesthetics.
            </p>
          </div>
          <StyleGrid className="style-grid--home">
            {showcase.map((s) => (
              <StyleCard key={s.id} style={s} onUse={(id) => navigate(`/styles/${id}`)} />
            ))}
            <button
              type="button"
              className="style-card style-card-all"
              onClick={() => navigate('/all-styles')}
            >
              <span className="style-card-all-inner">
                <strong>Explore All Styles</strong>
                <span>→</span>
              </span>
            </button>
          </StyleGrid>
        </div>
      </section>

      {/* ── Creative Transformation Examples ────────────────── */}
      <section id="examples" className="sp-section sp-alt">
        <div className="sp-inner">
          <div className="sp-section-head">
            <h2 className="sp-section-title">Creative Transformations</h2>
            <p className="sp-section-sub">Real photo-to-image results across popular styles.</p>
          </div>
          <StyleGrid>
            {transformationsList.map((s) => (
              <StyleCard key={s.id} style={s} onUse={(id) => navigate(`/styles/${id}`)} />
            ))}
          </StyleGrid>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section id="cta" className="sp-section">
        <div className="sp-inner sp-cta">
          <h2 className="sp-section-title">Ready to transform your image?</h2>
          <p className="sp-section-sub">
            Upload a photo, choose a Style, and transform it with AI. It's free to start.
          </p>
          <button type="button" className="btn-primary btn-lg" onClick={() => navigate('/image-to-image')}>
            Try Image to Image
          </button>
        </div>
      </section>
    </AppLayout>
  );
}