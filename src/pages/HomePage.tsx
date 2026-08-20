import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import StyleCard from '../components/StyleCard';
import StyleGrid from '../components/StyleGrid';
import SearchBar from '../components/SearchBar';
import TopNav from '../components/TopNav';
import { useStyles } from '../hooks/useStyles';
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
    // Structured data for AI engines (GEO)
    const ld = document.createElement('script');
    ld.setAttribute('type', 'application/ld+json');
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'StyleForge',
      url: 'https://www.styleforge.org/',
      applicationCategory: 'Multimedia',
      operatingSystem: 'Web',
      description: 'Transform your images with AI-powered Styles. Upload a photo, choose a curated AI Style, and get a transformed result powered by carefully crafted prompts.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      author: {
        '@type': 'Organization',
        name: 'StyleForge',
        url: 'https://www.styleforge.org',
      },
    });
    document.head.appendChild(ld);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/all-styles?q=${encodeURIComponent(q)}` : '/all-styles');
  };

  const showcase = styles.slice(0, 7);

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

      {/* ── Powered by AI Prompts ──────────────────────────── */}
      <section id="prompts" className="sp-section sp-alt">
        <div className="sp-inner">
          <div className="sp-section-head">
            <h2 className="sp-section-title">Powered by Carefully Crafted AI Prompts</h2>
            <p className="sp-section-sub">
              Every Style combines carefully crafted AI prompts with visual direction to transform your original image.
            </p>
          </div>
          <div className="prompt-showcase">
            <figure className="prompt-figure">
              <div className="prompt-img">
                <img src="/styles/api/home-original.png" alt="Original photo before transformation" loading="lazy" />
              </div>
              <figcaption>Original Photo</figcaption>
            </figure>
            <span className="prompt-arrow">→</span>
            <figure className="prompt-figure">
              <div className="prompt-img">
                <img src="/styles/api/home-transformed.png" alt="AI transformed result" loading="lazy" />
              </div>
              <figcaption>AI Transformation</figcaption>
            </figure>
          </div>
          <div className="prompt-cta">
            <strong className="prompt-style-name">Magazine Editorial</strong>
            <span className="prompt-style-tag">AI Image Transformation</span>
            <button
              type="button"
              className="btn-primary btn-lg"
              onClick={() => navigate('/image-to-image')}
            >
              Try Image to Image →
            </button>
          </div>
        </div>
      </section>

      {/* ── Create Your Own Style ─────────────────────────── */}
      <section id="create-your-own" className="sp-section">
        <div className="sp-inner">
          <div className="sp-section-head">
            <h2 className="sp-section-title">Create Your Own Style</h2>
            <p className="sp-section-sub">
              Turn your creative ideas into reusable AI Styles. Describe the visual direction you want, then use your Style to transform images whenever inspiration strikes.
            </p>
          </div>
          <div className="create-style-card">
            <div className="create-style-left">
              <span className="create-style-label">Create a Style</span>
              <h3 className="create-style-heading">Turn an idea into an AI Style.</h3>
              <p className="create-style-desc">
                Describe the visual direction you want. StyleForge turns your idea into a reusable Style for image transformation.
              </p>
              <div className="create-style-prompt-box">
                <span className="create-style-prompt-placeholder">Describe your style...</span>
                <span className="create-style-prompt-text">
                  Cinematic retro-futuristic street<br />
                  photography with dramatic lighting...
                </span>
              </div>
              <button
                type="button"
                className="btn-primary btn-lg"
                onClick={() => navigate('/create-style')}
              >
                Create Your Own Style →
              </button>
            </div>
            <div className="create-style-right">
              <div className="create-style-preview">
                <img src="/styles/api/home-create-style.png" alt="Custom Style preview example" loading="lazy" />
              </div>
              <div className="create-style-preview-meta">
                <strong className="create-style-preview-name">Japanese Anime</strong>
                <span className="create-style-preview-tags">Anime · Cel Shading · Vibrant · Character Focus</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Site Footer ────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          {/* Brand */}
          <div className="footer-col footer-brand">
            <div className="footer-logo">
              <span className="footer-logo-name">StyleForge</span>
            </div>
            <p className="footer-tagline">Transform images with AI Styles.</p>
            <p className="footer-copy">© 2026 StyleForge. All rights reserved.</p>
          </div>

          {/* Navigation */}
          <div className="footer-col">
            <h4 className="footer-col-title">Navigation</h4>
            <nav className="footer-links">
              <a href="/image-to-image">Image to Image</a>
              <a href="/all-styles">All Styles</a>
              <a href="/create-style">Create a Style</a>
              <a href="/image-to-image">AI Image Transformation</a>
            </nav>
          </div>

          {/* Support */}
          <div className="footer-col">
            <h4 className="footer-col-title">Support</h4>
            <nav className="footer-links">
              <a href="/contact">Contact Us</a>
              <a href="/about">About Us</a>
              <a href="/pricing">Pricing</a>
            </nav>
          </div>

          {/* Legal */}
          <div className="footer-col">
            <h4 className="footer-col-title">Legal</h4>
            <nav className="footer-links">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="/refund">Refund Policy</a>
            </nav>
          </div>
        </div>
      </footer>
    </AppLayout>
  );
}