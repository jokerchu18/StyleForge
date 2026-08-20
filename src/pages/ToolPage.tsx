import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import StyleCard from '../components/StyleCard';
import CategoryTabs from '../components/CategoryTabs';
import UploadDropzone from '../components/UploadDropzone';
import ProcessingOverlay from '../components/ProcessingOverlay';
import ResultCompare from '../components/ResultCompare';
import { en } from '../i18n/en';
import { loadImageFromFile, resizeToCanvas } from '../lib/imageUtils';
import { getHealth, startGeneration, pollGeneration, fetchResultImage } from '../lib/generate/client';
import { generateErrorMessage, isProviderError } from '../lib/generate/errors';
import { blobToCanvas } from '../lib/generate/format';
import { resolveStyleMeta } from '../shared/styles';
import { useStyles } from '../hooks/useStyles';
import { useAuth } from '../hooks/useAuth';
import { useAccount } from '../hooks/useAccount';
import { setPageMeta } from '../lib/seo';
import { saveLastGeneration, loadLastGeneration, clearLastGeneration } from '../lib/idb-cache';
import type { ProviderId } from '../shared/generate-types';

type Phase = 'idle' | 'ready' | 'loading' | 'processing' | 'done';

const TIPS = [
  'Each Style is powered by a carefully crafted AI prompt.',
  'Your original image stays recognizable — the AI transforms the style, not the subject.',
  'You can try the same photo with different Styles to see completely different results.',
  'StyleForge uses image-to-image AI to preserve your composition while changing the visual direction.',
  'AI prompts guide the lighting, color, atmosphere, texture, and mood of your transformation.',
  'You can upload portraits, landscapes, travel photos, or product shots.',
  'Every generation uses credits — check your balance in the top navigation.',
  'More Styles are added regularly. Check back for new visual transformations.',
];

const MODEL_NAMES: Record<string, string> = {
  'flux-kontext-pro': 'FLUX Kontext Pro',
  'nano-banana-2': 'Nano Banana 2',
  'gpt-image-2': 'GPT Image 2',
};

const SEO_FAQ = [
  {
    q: 'What is AI image transformation?',
    a: 'AI image transformation (also called image-to-image AI) restyles an existing photo into a new visual — turning a portrait into a cinematic editorial, an anime character, a fantasy scene, or a different photographic look while preserving the original subject.',
  },
  {
    q: 'How does image-to-image AI work?',
    a: 'You upload a photo and choose a Style. Each Style is a carefully crafted AI prompt configuration that tells the model how to transform your image.',
  },
  {
    q: 'What can I transform with AI?',
    a: 'Portraits, landscapes, product photos, travel shots — anything. Popular transformations include anime photo transformation, cinematic photo transformation, and Y2K photo transformation.',
  },
];

export default function ToolPage() {
  useEffect(() => {
    setPageMeta(
      'AI Image Transformation & Image-to-Image AI | StyleForge',
      'Transform any photo with image-to-image AI. Upload an image, choose a Style, and create a completely new visual in seconds.',
    );
  }, []);

  const { user, signInWithGoogle } = useAuth();
  const { refresh: refreshAccount } = useAccount();
  const [searchParams] = useSearchParams();
  const initialStyle = searchParams.get('style') ?? '';
  const [styleId, setStyleId] = useState('');
  const [apiOriginal, setApiOriginal] = useState<HTMLCanvasElement | null>(null);
  const [uploadBlob, setUploadBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<HTMLCanvasElement | null>(null);
  const [error, setError] = useState('');
  const [providerChain, setProviderChain] = useState<ProviderId[]>(['mock']);
  const [category, setCategory] = useState('all');
  const [tipIndex, setTipIndex] = useState(0);

  const catalog = useStyles();
  const allStyles = useMemo(() => catalog?.styles ?? [], [catalog]);
  const categories = useMemo(() => catalog?.categories ?? [], [catalog]);

  const featureStyles = useMemo(() => {
    let list = allStyles.filter((s) => s.engine === 'cloud');
    if (category !== 'all') {
      list = list.filter((s) => s.category === category);
    }
    return list;
  }, [allStyles, category]);

  const initialized = useRef(false);
  useEffect(() => {
    if (!catalog || initialized.current) return;
    const requested = catalog.styles.find(
      (s) => s.engine === 'cloud' && s.id === initialStyle,
    );
    const first = requested ?? catalog.styles.find((s) => s.engine === 'cloud');
    if (first) {
      setStyleId(first.id);
      initialized.current = true;
    }
  }, [catalog, initialStyle]);

  useEffect(() => {
    getHealth()
      .then((h) => {
        const available = (Object.keys(h.providers) as ProviderId[]).filter((id) => h.providers[id]);
        const real = available.filter((id) => id !== 'mock');
        const chain: ProviderId[] = real.length
          ? [...real].sort((a, b) => (a === 'replicate' ? -1 : b === 'replicate' ? 1 : 0))
          : available.includes('mock') ? ['mock'] : [];
        if (chain.length) setProviderChain(chain);
      })
      .catch(() => {});
  }, []);

  // Restore last generation from IndexedDB cache (24h expiry).
  useEffect(() => {
    loadLastGeneration().then(async (cached) => {
      if (!cached) return;
      try {
        // Reconstruct the original canvas from the cached blob.
        const img = await loadImageFromFile(new File([cached.originalBlob], 'cached', { type: cached.originalBlob.type }));
        const apiCanvas = resizeToCanvas(img, 1024).canvas;
        setApiOriginal(apiCanvas);
        setUploadBlob(cached.originalBlob);
        setStyleId(cached.styleId);
        // Reconstruct the result canvas.
        const resultCanvas = await blobToCanvas(cached.resultBlob);
        setResult(resultCanvas);
        setPhase('done');
        setFileName(cached.styleLabel);
      } catch {
        // Cache miss or corrupted — silently ignore.
      }
    });
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(''); setResult(null);
    try {
      const img = await loadImageFromFile(file);
      const apiCanvas = resizeToCanvas(img, 1024).canvas;
      const blob = await new Promise<Blob>((resolve, reject) => {
        apiCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85);
      });
      setFileName(file.name); setApiOriginal(apiCanvas); setUploadBlob(blob); setPhase('ready');
    } catch { setError(en.errorInvalidImage); setPhase('idle'); }
  }, []);

  const processApi = useCallback(async () => {
    if (!uploadBlob || !styleId) return;
    setError(''); setPhase('loading');
    try {
      let started = null;
      let lastError: unknown = new Error('No generation providers available');
      for (const provider of providerChain) {
        try { started = await startGeneration({ styleId, provider }, uploadBlob); break; }
        catch (err) { lastError = err; if (!isProviderError(err)) throw err; }
      }
      if (!started) throw lastError;

      const handleSuccess = async (blob: Blob) => {
        const canvas = await blobToCanvas(blob);
        setResult(canvas); setPhase('done'); refreshAccount();
        // Cache the result in IndexedDB (24h).
        if (uploadBlob) {
          saveLastGeneration({
            originalBlob: uploadBlob,
            resultBlob: blob,
            styleId,
            styleLabel: resolveStyleMeta(currentStyle!).label,
            createdAt: Date.now(),
          }).catch(() => {});
        }
      };

      if (started.status === 'succeeded' && started.imageUrl) {
        await handleSuccess(await fetchResultImage(started.imageUrl)); return;
      }
      if (started.status === 'failed') throw new Error('Generation failed');

      setPhase('processing');
      const deadline = Date.now() + 180_000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await pollGeneration(started.generationId);
        if (status.status === 'succeeded') {
          if (!status.imageUrl) throw new Error('Generation completed without an image');
          await handleSuccess(await fetchResultImage(status.imageUrl)); return;
        }
        if (status.status === 'failed') throw new Error('Generation failed');
      }
      throw new Error('Generation timed out');
    } catch (err) { setPhase('ready'); setError(generateErrorMessage(err)); }
  }, [uploadBlob, styleId, providerChain, refreshAccount]);

  const selectStyle = useCallback((next: string) => { setStyleId(next); }, []);
  const reset = useCallback(() => {
    setApiOriginal(null); setUploadBlob(null); setFileName(''); setResult(null); setError(''); setPhase('idle');
    clearLastGeneration().catch(() => {});
  }, []);

  const busy = phase === 'loading' || phase === 'processing';
  const currentStyle = allStyles.find((s) => s.id === styleId);
  const resultLabel = currentStyle ? resolveStyleMeta(currentStyle).label : en.compareResult;
  const previewUrl = useMemo(() => (apiOriginal ? apiOriginal.toDataURL('image/jpeg', 0.85) : null), [apiOriginal]);

  // Rotate tips every 4 seconds during generation
  useEffect(() => {
    if (!busy) { setTipIndex(0); return; }
    const timer = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [busy]);

  const handleGenerate = useCallback(() => {
    if (!user) { signInWithGoogle(); return; }
    processApi();
  }, [user, processApi, signInWithGoogle]);

  return (
    <AppLayout>
      <div className="transform">
        <div className="transform-head">
          <h1 className="transform-title">Image to Image</h1>
          <p className="transform-sub">Transform your image with AI Styles</p>
        </div>

        {phase === 'done' && apiOriginal && result ? (
          <ResultCompare
            original={apiOriginal}
            result={result}
            style={styleId}
            resultLabel={resultLabel}
            onReset={reset}
          />
        ) : (
          <div className="i2i-split">
            {/* ── Left: Upload ──────────────────────────────── */}
            <div className="i2i-left">
              <h3 className="i2i-section-title">Upload Image</h3>
              <div className="i2i-upload-area">
                {apiOriginal ? (
                  <div className="i2i-preview">
                    <img className="i2i-preview-img" src={previewUrl ?? ''} alt={fileName} />
                    <div className="i2i-preview-meta">
                      <span className="i2i-preview-name">{fileName}</span>
                      <span className="i2i-preview-dims">{apiOriginal.width} × {apiOriginal.height}</span>
                    </div>
                    <div className="i2i-preview-actions">
                      <UploadDropzone onFile={handleFile} disabled={busy} compact />
                    </div>
                  </div>
                ) : (
                  <UploadDropzone onFile={handleFile} />
                )}
              </div>
            </div>

            {/* ── Right: Style picker + Transform ──────────── */}
            <div className="i2i-right">
              <div className="i2i-right-header">
                <h3 className="i2i-section-title">Choose a Style</h3>
                {categories.length > 0 && (
                  <CategoryTabs
                    categories={categories}
                    active={category}
                    onChange={setCategory}
                  />
                )}
              </div>

              <div className="i2i-styles-scroll">
                <div className="i2i-styles-grid">
                  {featureStyles.map((s) => (
                    <StyleCard
                      key={s.id}
                      style={s}
                      compact
                      selected={styleId === s.id}
                      onUse={selectStyle}
                      actionLabel=""
                    />
                  ))}
                </div>
                {featureStyles.length === 0 && (
                  <div className="empty-state">
                    <strong>No styles found</strong>
                    <span>Try a different category.</span>
                  </div>
                )}
              </div>

              <div className="i2i-footer">
                {currentStyle && (
                  <>
                    <span className="i2i-style-label">{resolveStyleMeta(currentStyle).label}</span>
                    <span className="i2i-meta-label">
                      {MODEL_NAMES[currentStyle.model ?? ''] ?? currentStyle.model ?? 'AI Model'}
                      {currentStyle.costUnits != null && <> · ⚡ {currentStyle.costUnits} Credits</>}
                    </span>
                  </>
                )}
                <button
                  type="button"
                  className="btn-primary i2i-transform-btn"
                  disabled={!apiOriginal || !styleId || busy}
                  onClick={handleGenerate}
                >
                  ✨ {busy ? 'Transforming…' : 'Transform Image'}
                </button>
              </div>
            </div>
          </div>
        )}

        {busy && (
          <div className="transform-busy" role="status">
            <ProcessingOverlay phase={phase === 'loading' ? 'loading' : 'processing'} label="Transforming your image…" />
            <p className="transform-tip">{TIPS[tipIndex]}</p>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        {/* ── SEO content ──────────────────────────────────── */}
        <section className="transform-seo">
          <div className="transform-seo-block">
            <h2>How AI Image Transformation Works</h2>
            <p>Upload an existing image, choose a Style, and let image-to-image AI transform the visual according to that Style's prompt and configuration. The transformation can change the image's artistic direction, lighting, color, atmosphere, texture, and overall aesthetic while preserving important elements of the original image.</p>
          </div>
          <div className="transform-seo-block">
            <h2>Transform Your Photo into Different Styles</h2>
            <p>StyleForge lets you transform the same photo into completely different visual directions. Turn a portrait into an anime character, recreate it as cartoon art, give it a cinematic editorial look, place it in a cyberpunk world, or explore fantasy and Y2K aesthetics.</p>
          </div>
          <div className="transform-seo-block">
            <h2>Powered by Carefully Crafted AI Prompts</h2>
            <p>Each Style is built around a carefully crafted AI prompt that defines how the original image should be transformed. The prompt can guide visual elements such as composition, lighting, color, atmosphere, texture, styling, and mood.</p>
          </div>
          <div className="transform-seo-faq">
            <h2>FAQ</h2>
            {SEO_FAQ.map((f) => (
              <div key={f.q} className="transform-seo-faq-item">
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
          <div className="transform-seo-block">
            <h2>Explore More Styles</h2>
            <p>
              Browse the full library on the <Link to="/all-styles">All Styles</Link> page, or discover a specific look on its own page — from{' '}
              <Link to="/styles/cinematic-editorial">Cinematic Editorial</Link> to{' '}
              <Link to="/styles/anime-character">Anime Character</Link>.
            </p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}