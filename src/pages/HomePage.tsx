import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import StyleCard from '../components/StyleCard';
import StyleGrid from '../components/StyleGrid';
import SearchBar from '../components/SearchBar';
import TopNav from '../components/TopNav';
import { useStyles } from '../hooks/useStyles';
import { resolveStyleMeta } from '../shared/styles';

const HOW_IT_WORKS = [
  {
    title: 'Upload your image',
    desc: 'Drag in a portrait, a landscape, or any photo you want to restyle.',
  },
  {
    title: 'Pick a style',
    desc: 'Choose from cinematic editorial, anime character, cyberpunk and more.',
  },
  {
    title: 'Generate with AI',
    desc: 'Our image-to-image engine transforms it into a brand new visual.',
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
    document.title = 'StyleForge — AI Image Transformation & Image to Image Tool';
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/all-styles?q=${encodeURIComponent(q)}` : '/all-styles');
  };

  const showcase = styles.slice(0, 8);
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
            Transform existing images into new visuals with AI — cinematic editorials, anime characters, cyberpunk worlds and more.
          </p>
          <div className="sp-hero-cta">
            <button type="button" className="btn-primary btn-lg" onClick={() => navigate('/image-to-image')}>
              Try AI Image
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
              StyleForge is an image-to-image AI tool. Upload a photo, pick a visual style, and get a transformed result — no prompt engineering required.
            </p>
          </div>
          <div className="ai-image-features">
            <div className="ai-image-feature">
              <h3>Image to Image</h3>
              <p>Your source photo drives the result — identity, pose and composition are preserved while the style is reimagined.</p>
            </div>
            <div className="ai-image-feature">
              <h3>AI Photo Restyling</h3>
              <p>Turn an ordinary photo into a cinematic portrait, a fashion editorial, an anime character or a fantasy world.</p>
            </div>
            <div className="ai-image-feature">
              <h3>No Prompt Needed</h3>
              <p>Every style carries its own prompt configuration. You just choose a look and press generate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how-it-works" className="sp-section sp-alt">
        <div className="sp-inner">
          <div className="sp-section-head">
            <h2 className="sp-section-title">Three steps to a new image</h2>
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
              Try AI Image
            </button>
          </div>
        </div>
      </section>

      {/* ── Styles Showcase ─────────────────────────────────── */}
      <section id="styles" className="sp-section">
        <div className="sp-inner">
          <div className="sp-section-head">
            <h2 className="sp-section-title">Explore our style library</h2>
            <p className="sp-section-sub">Curated image-to-image styles across every category.</p>
          </div>
          <StyleGrid>
            {showcase.map((s) => (
              <StyleCard key={s.id} style={s} onUse={(id) => navigate(`/styles/${id}`)} />
            ))}
          </StyleGrid>
          <div className="sp-section-cta">
            <button type="button" className="btn-ghost btn-lg" onClick={() => navigate('/all-styles')}>
              Explore All Styles
            </button>
          </div>
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
            It’s free to start. Upload a photo and generate your first AI image in seconds.
          </p>
          <button type="button" className="btn-primary btn-lg" onClick={() => navigate('/image-to-image')}>
            Try AI Image
          </button>
        </div>
      </section>
    </AppLayout>
  );
}
