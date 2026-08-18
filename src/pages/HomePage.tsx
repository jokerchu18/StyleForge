import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import StyleCard from '../components/StyleCard';
import StyleGrid from '../components/StyleGrid';
import SearchBar from '../components/SearchBar';
import TopNav from '../components/TopNav';
import UploadDropzone from '../components/UploadDropzone';
import ProcessingOverlay from '../components/ProcessingOverlay';
import ResultCompare from '../components/ResultCompare';
import { en } from '../i18n/en';
import { useStyles } from '../hooks/useStyles';
import { useAuth } from '../hooks/useAuth';
import { useAccount } from '../hooks/useAccount';
import { loadImageFromFile, resizeToCanvas } from '../lib/imageUtils';
import { getHealth } from '../lib/generate/client';
import { transformWithFallback, generateErrorMessage } from '../lib/generate/errors';
import { blobToCanvas } from '../lib/generate/format';
import { resolveStyleMeta } from '../shared/styles';
import type { ProviderId } from '../shared/generate-types';
import { CATEGORY_PRESETS } from '../shared/styles-catalog';
import { saveStyle } from '../lib/styles/saveStyle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

type Phase = 'idle' | 'ready' | 'loading' | 'processing' | 'done';

const BLOG_POSTS = [
  {
    slug: 'photo-to-anime-guide',
    title: "How to Turn Your Photo into Anime: A Beginner’s Guide",
    excerpt: 'Pick a style, upload, and get anime art in seconds. Learn which cloud AI styles suit portraits, landscapes and more.',
    image: '/styles/api/anime.png',
    category: 'Guide',
    date: 'Aug 12, 2026',
  },
  {
    slug: 'sci-fi-photo-edits',
    title: 'Create Sci-Fi Photos: Neon, Cyberpunk and Futuristic Looks',
    excerpt: 'Give your photos a futuristic glow with our sci-fi style — perfect for avatars, posters and creative projects.',
    image: '/styles/api/sci-fi.png',
    category: 'Inspiration',
    date: 'Aug 5, 2026',
  },
  {
    slug: 'watercolor-vs-oil',
    title: 'Watercolor vs Oil Painting: Which Style Suits Your Photo?',
    excerpt: 'Both turn photos into painterly art, but they feel very different. A quick comparison to help you choose.',
    image: '/styles/api/oil-painting.png',
    category: 'Comparison',
    date: 'Jul 28, 2026',
  },
];

const PLAN_FEATURES: Record<string, string[]> = {
  free: ['10 Generations / month', 'Standard generation', 'Explore styles', 'Save styles'],
  plus: ['200 Generations / month', 'All styles + Premium styles', 'HD generation', 'No watermark', 'Commercial use', 'Generation history'],
  pro: ['600 Generations / month', 'All styles + Premium models', 'HD / High resolution', 'Priority queue', 'Advanced generation options', 'Style creation & publishing'],
};

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const catalog = useStyles();
  const styles = catalog?.styles ?? [];

  useEffect(() => {
    document.title = `${en.appName} — Free AI Photo Stylizer: Anime, Sci-Fi & More`;
  }, []);

  // ── Style Transfer section ────────────────────────────────────────
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { account, refresh: refreshAccount } = useAccount();
  const [styleId, setStyleId] = useState('');
  const [apiOriginal, setApiOriginal] = useState<HTMLCanvasElement | null>(null);
  const [uploadBlob, setUploadBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<HTMLCanvasElement | null>(null);
  const [toolError, setToolError] = useState('');
  const [providerChain, setProviderChain] = useState<ProviderId[]>(['mock']);

  const featureStyles = useMemo(() => styles.filter((s) => s.engine === 'cloud'), [styles]);

  const initialized = useRef(false);
  useEffect(() => {
    if (!catalog || initialized.current) return;
    const first = catalog.styles.find((s) => s.engine === 'cloud');
    if (first) { setStyleId(first.id); initialized.current = true; }
  }, [catalog]);

  useEffect(() => {
    getHealth().then((h) => {
      const available = (Object.keys(h.providers) as ProviderId[]).filter((id) => h.providers[id]);
      const real = available.filter((id) => id !== 'mock');
      // Real providers first (cross-provider retry), mock only when none are real.
      const chain: ProviderId[] = real.length
        ? real
        : available.includes('mock')
          ? ['mock']
          : [];
      if (chain.length) setProviderChain(chain);
    }).catch(() => {});
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setToolError(''); setResult(null);
    try {
      const img = await loadImageFromFile(file);
      const apiCanvas = resizeToCanvas(img, 1024).canvas;
      const blob = await new Promise<Blob>((resolve, reject) => {
        apiCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85);
      });
      setFileName(file.name); setApiOriginal(apiCanvas); setUploadBlob(blob); setPhase('ready');
    } catch { setToolError(en.errorInvalidImage); setPhase('idle'); }
  }, []);

  const processApi = useCallback(async () => {
    if (!uploadBlob || !styleId) return;
    setToolError(''); setPhase('loading');
    try {
      const r = await transformWithFallback(styleId, uploadBlob, providerChain);
      const canvas = await blobToCanvas(r.blob);
      setResult(canvas); setPhase('done'); refreshAccount();
    } catch (err) {
      setPhase('ready');
      setToolError(generateErrorMessage(err));
    }
  }, [uploadBlob, styleId, providerChain, refreshAccount]);

  const selectStyle = useCallback((next: string) => {
    setStyleId(next);
  }, []);

  const reset = useCallback(() => {
    setApiOriginal(null); setUploadBlob(null); setFileName(''); setResult(null); setToolError(''); setPhase('idle');
  }, []);

  const busy = phase === 'loading' || phase === 'processing';
  const currentStyle = styles.find((s) => s.id === styleId);
  const resultLabel = currentStyle ? resolveStyleMeta(currentStyle).label : en.compareResult;
  const previewUrl = useMemo(() => (apiOriginal ? apiOriginal.toDataURL('image/jpeg', 0.85) : null), [apiOriginal]);

  // ── Create Style section ──────────────────────────────────────────
  const [csLabel, setCsLabel] = useState('');
  const [csDesc, setCsDesc] = useState('');
  const [csCategory, setCsCategory] = useState(CATEGORY_PRESETS[0] ?? '');
  const [csPrompt, setCsPrompt] = useState('');
  const [csModels, setCsModels] = useState<{ id: string; label: string }[]>([]);
  const [csModel, setCsModel] = useState('');
  const [csSeed, setCsSeed] = useState('');
  const [csSampleImage, setCsSampleImage] = useState<File | null>(null);
  const [csPreview, setCsPreview] = useState<string | null>(null);
  const [csSubmitting, setCsSubmitting] = useState(false);
  const [csError, setCsError] = useState('');
  const [csSuccess, setCsSuccess] = useState(false);
  const csFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/models').then((r) => (r.ok ? r.json() : Promise.reject())).then((data: { models: { id: string; label: string }[] }) => {
      setCsModels(data.models);
      if (data.models[0]) setCsModel(data.models[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!csSampleImage) return;
    const url = URL.createObjectURL(csSampleImage);
    setCsPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [csSampleImage]);

  const handleCsFile = (file: File | undefined) => {
    if (file?.type.startsWith('image/')) { setCsSampleImage(file); setCsError(''); }
  };

  const handleCsSubmit = async () => {
    setCsError('');
    if (!csLabel.trim() || !csPrompt.trim() || !csModel || !csCategory || !csSampleImage) {
      setCsError('Please fill in all required fields and upload a sample image.'); return;
    }
    setCsSubmitting(true);
    try {
      await saveStyle({ label: csLabel.trim(), description: csDesc.trim(), category: csCategory, prompt: csPrompt.trim(), model: csModel, seed: csSeed.trim() === '' ? undefined : Number(csSeed), sampleImage: csSampleImage });
      setCsSuccess(true);
      setTimeout(() => navigate('/explore'), 1500);
    } catch (e) {
      setCsError(e instanceof Error ? e.message : 'Failed to save style');
    } finally {
      setCsSubmitting(false);
    }
  };

  const csBusy = csSubmitting || authLoading;

  // ── Pricing section ───────────────────────────────────────────────
  const [plans, setPlans] = useState<{ id: string; label: string; price: number; generations: number; mostPopular?: boolean }[]>([]);
  useEffect(() => {
    fetch('/api/pricing').then((r) => r.ok ? r.json() : Promise.reject()).then((data) => setPlans(data.plans ?? data)).catch(() => {});
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/explore?q=${encodeURIComponent(q)}` : '/explore');
  };

  const sections = [
    { title: 'Featured', items: styles.slice(0, 4) },
    { title: 'Trending', items: styles.slice(2) },
    { title: 'New', items: styles },
  ];

  return (
    <AppLayout>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section id="hero" className="sp-section sp-hero">
        <div className="sp-inner sp-hero-inner">
          <h1 className="sp-hero-title">
            Turn any photo into<br />
            <span className="sp-hero-accent">a new work of art.</span>
          </h1>
          <p className="sp-hero-sub">
            AI-powered style transfer — anime, sci-fi, oil painting, sketch, watercolor — in seconds.
          </p>
          <form className="sp-hero-search" onSubmit={submitSearch}>
            <SearchBar value={query} onChange={setQuery} placeholder="Search styles, prompts, or inspiration…" />
            <button type="submit" className="btn-primary btn-lg">Search</button>
          </form>
          <TopNav />
        </div>
      </section>

      {/* ── Style Transfer ───────────────────────────────────── */}
      <section id="style-transfer" className="sp-section sp-style-transfer">
        <div className="sp-inner">
          <div className="sp-section-head">
            <h2 className="sp-section-title">Style Transfer</h2>
            <p className="sp-section-sub">Upload a photo and pick a style — your transformation is ready in seconds.</p>
          </div>

          {!authLoading && !user ? (
            <div className="sp-gate">
              <p className="sp-gate-text">Sign in to transform your photo. It's free.</p>
              <button type="button" className="btn-primary btn-lg" onClick={signInWithGoogle}>
                Sign in with Google
              </button>
            </div>
          ) : phase === 'done' && apiOriginal && result ? (
            <ResultCompare original={apiOriginal} result={result} style={styleId} resultLabel={resultLabel} onReset={reset} />
          ) : (
            <div className="transform-steps">
              <section className="transform-step">
                <div className="transform-step-head">
                  <span className="step-badge">1</span>
                  <h3>Upload your photo</h3>
                </div>
                {apiOriginal ? (
                  <div className="photo-preview">
                    <img className="photo-preview-img" src={previewUrl ?? ''} alt={fileName} />
                    <div className="photo-preview-meta">
                      <span className="file-name">{fileName}</span>
                      <span className="file-dims">{apiOriginal.width} × {apiOriginal.height} px</span>
                      <UploadDropzone onFile={handleFile} disabled={busy} compact />
                    </div>
                  </div>
                ) : (
                  <UploadDropzone onFile={handleFile} />
                )}
              </section>

              <section className="transform-step">
                <div className="transform-step-head">
                  <span className="step-badge">2</span>
                  <h3>Choose a style</h3>
                </div>
                <StyleGrid className="style-grid--compact">
                  {featureStyles.map((s) => (
                    <StyleCard key={s.id} style={s} compact selected={styleId === s.id} onUse={selectStyle} />
                  ))}
                </StyleGrid>
              </section>

              <section className="transform-step">
                <div className="transform-step-head">
                  <span className="step-badge">3</span>
                  <h3>Transform</h3>
                </div>
                <div className="transform-actions">
                  <button type="button" className="btn-primary btn-lg" disabled={!apiOriginal || busy} onClick={() => processApi()}>
                    {busy ? 'Creating your style…' : 'Transform Image'}
                  </button>
                  {apiOriginal && <button type="button" className="btn-ghost" onClick={reset} disabled={busy}>Remove photo</button>}
                  <span className="generation-cost">1 Generation</span>
                </div>
              </section>
            </div>
          )}

          {busy && (
            <div className="transform-busy" role="status">
              <ProcessingOverlay phase={phase === 'loading' ? 'loading' : 'processing'} label="Creating your style…" />
            </div>
          )}
          {toolError && <p className="error-text">{toolError}</p>}
        </div>
      </section>

      {/* ── AI Styles ────────────────────────────────────────── */}
      <section id="ai-styles" className="sp-section sp-alt">
        <div className="sp-inner">
          <div className="sp-section-head">
            <h2 className="sp-section-title">AI Styles</h2>
            <p className="sp-section-sub">Browse curated styles across every category — find your next look.</p>
            <button type="button" className="text-link sp-section-more" onClick={() => navigate('/explore')}>
              View all styles →
            </button>
          </div>

          <div className="home-sections">
            {sections.map((section) =>
              section.items.length ? (
                <section key={section.title} className="home-section">
                  <div className="section-head">
                    <h2>{section.title}</h2>
                    <button type="button" className="text-link" onClick={() => navigate('/explore')}>View all</button>
                  </div>
                  <StyleGrid>
                    {section.items.map((s) => (
                      <StyleCard key={s.id} style={s} onUse={(id) => navigate(`/styles/${id}`)} />
                    ))}
                  </StyleGrid>
                </section>
              ) : null,
            )}
          </div>
        </div>
      </section>

      {/* ── Create Style ─────────────────────────────────────── */}
      <section id="create-style" className="sp-section">
        <div className="sp-inner">
          <div className="sp-section-head">
            <span className="sp-eyebrow">Community</span>
            <h2 className="sp-section-title">{en.create.title}</h2>
            <p className="sp-section-sub">{en.create.subtitle}</p>
          </div>

          {!user && !authLoading ? (
            <div className="sp-gate">
              <p className="sp-gate-text">{en.create.needLogin}</p>
              <button type="button" className="btn-primary" onClick={signInWithGoogle}>Sign in with Google</button>
            </div>
          ) : (
            <div className="create-layout">
              <div className="create-form">
                <div className="create-field">
                  <label htmlFor="cs-label">{en.create.label}</label>
                  <input id="cs-label" value={csLabel} onChange={(e) => setCsLabel(e.target.value)} placeholder={en.create.labelPlaceholder} disabled={csBusy} />
                </div>
                <div className="create-field">
                  <label htmlFor="cs-category">{en.create.category}</label>
                  <Select value={csCategory} onValueChange={setCsCategory} disabled={csBusy}>
                    <SelectTrigger id="cs-category" aria-label={en.create.category}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_PRESETS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="create-field">
                  <label htmlFor="cs-desc">{en.create.description}</label>
                  <input id="cs-desc" value={csDesc} onChange={(e) => setCsDesc(e.target.value)} placeholder={en.create.descriptionPlaceholder} disabled={csBusy} />
                </div>
                <div className="create-field">
                  <label htmlFor="cs-prompt">{en.create.prompt}</label>
                  <textarea id="cs-prompt" value={csPrompt} onChange={(e) => setCsPrompt(e.target.value)} placeholder={en.create.promptPlaceholder} rows={5} disabled={csBusy} />
                </div>
                <div className="create-field">
                  <label>{en.create.model}</label>
                  {csModels.length ? (
                    <div className="model-grid">
                      {csModels.map((m) => (
                        <button key={m.id} type="button" className={`model-card${csModel === m.id ? ' selected' : ''}`} onClick={() => setCsModel(m.id)} disabled={csBusy}>
                          <strong>{m.label}</strong>
                          <small>{m.id}</small>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="model-empty">No models configured — set the REPLICATE_MODELS env var and restart the server.</p>
                  )}
                </div>
                <div className="create-field">
                  <label htmlFor="cs-seed">{en.create.seed}</label>
                  <input id="cs-seed" type="number" value={csSeed} onChange={(e) => setCsSeed(e.target.value)} placeholder={en.create.seedPlaceholder} disabled={csBusy} />
                </div>
              </div>

              <div className="create-preview-panel">
                <div className="create-field">
                  <label>{en.create.sampleImage}</label>
                  <input ref={csFileRef} type="file" accept="image/*" hidden onChange={(e) => handleCsFile(e.target.files?.[0])} />
                  <button type="button" className="create-upload" onClick={() => csFileRef.current?.click()} disabled={csBusy}>
                    {csPreview ? (
                      <img className="create-preview" src={csPreview} alt="Sample preview" />
                    ) : (
                      <span className="create-upload-empty">
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="m17 8-5-5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <strong>Upload a sample image</strong>
                        <small>{en.create.sampleHint}</small>
                      </span>
                    )}
                  </button>
                </div>
                {csError && <p className="error-text">{csError}</p>}
                {csSuccess && <p className="success-text">Submitted for review — it will appear once approved.</p>}
                <button type="button" className="btn-primary btn-lg create-submit" onClick={handleCsSubmit} disabled={csBusy}>
                  {csSubmitting ? en.create.submitting : en.create.submit}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Blog ─────────────────────────────────────────────── */}
      <section id="blog" className="sp-section sp-alt">
        <div className="sp-inner">
          <div className="sp-section-head">
            <span className="sp-eyebrow">StyleForge Journal</span>
            <h2 className="sp-section-title">Guides & Inspiration</h2>
            <p className="sp-section-sub">Tips, comparisons, and creative ideas for your AI photo transformations.</p>
          </div>
          <div className="blog-grid">
            {BLOG_POSTS.map((post) => (
              <article key={post.slug} className="blog-card">
                <div className="blog-card-media">
                  <img src={post.image} alt={`${post.title} cover`} loading="lazy" />
                </div>
                <div className="blog-card-body">
                  <span className="blog-card-cat">{post.category}</span>
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  <div className="blog-card-meta">
                    <time dateTime={post.date}>{post.date}</time>
                    <span className="blog-card-more">Coming soon</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" className="sp-section">
        <div className="sp-inner sp-pricing-inner">
          <div className="sp-section-head">
            <span className="sp-eyebrow">Simple pricing</span>
            <h2 className="sp-section-title">Generations, not styles.</h2>
            <p className="sp-section-sub">Every style costs the same — you pay for image generations, nothing else.</p>
          </div>
          <div className="pricing-grid">
            {plans.map((plan) => {
              const isCurrent = account?.plan === plan.id;
              const isFree = plan.id === 'free';
              return (
                <div key={plan.id} className={`pricing-card${plan.mostPopular ? ' most-popular' : ''}`}>
                  {plan.mostPopular && <span className="pricing-popular">Most Popular</span>}
                  <h3 className="pricing-name">{plan.label}</h3>
                  <div className="pricing-price">
                    <span>${plan.price}</span>
                    {!isFree && <small>/ month</small>}
                  </div>
                  <div className="pricing-generations">{plan.generations} Generations</div>
                  <ul className="pricing-features">
                    {(PLAN_FEATURES[plan.id] ?? []).map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <button type="button" className={`btn-${isFree ? 'ghost' : 'primary'} pricing-cta`} disabled={isCurrent}>
                    {isCurrent ? 'Current plan' : plan.id === 'free' ? 'Downgrade' : `Choose ${plan.label}`}
                  </button>
                  <p className="pricing-note">
                    {isCurrent && isFree ? 'You are on the Free plan.' : isCurrent ? 'You are on this plan.' : 'Payment coming soon.'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
