import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import StyleCard from '../components/StyleCard';
import StyleGrid from '../components/StyleGrid';
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
import type { ProviderId } from '../shared/generate-types';

type Phase = 'idle' | 'ready' | 'loading' | 'processing' | 'done';

const SEO_FAQ = [
  {
    q: 'What is AI image transformation?',
    a: 'AI image transformation (also called image-to-image AI) restyles an existing photo into a new visual — turning a portrait into a cinematic editorial, an anime character, a fantasy scene, or a different photographic look while preserving the original subject.',
  },
  {
    q: 'How does image-to-image AI work?',
    a: 'You upload a photo and choose a style. Each style is a preset prompt configuration that tells the AI how to transform your image. The model regenerates the photo in that style, keeping your composition and subject.',
  },
  {
    q: 'What can I transform with AI?',
    a: 'Portraits, landscapes, product photos, travel shots — anything. Popular transformations include anime photo transformation, cinematic photo transformation, Y2K photo transformation and AI fashion photo.',
  },
];

export default function ToolPage() {
  useEffect(() => {
    document.title = 'AI Image Transformation & Image to Image Tool | StyleForge';
  }, []);

  const { user, loading: authLoading, signInWithGoogle } = useAuth();
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

  const catalog = useStyles();
  const allStyles = useMemo(() => catalog?.styles ?? [], [catalog]);
  const featureStyles = allStyles.filter((s) => s.engine === 'cloud');

  // Pick the requested style (via ?style=) or the first cloud style once the
  // catalog is loaded.
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
        const available = (Object.keys(h.providers) as ProviderId[]).filter(
          (id) => h.providers[id],
        );
        const real = available.filter((id) => id !== 'mock');
        // Replicate (FLUX default) first; other providers are fallback.
        const chain: ProviderId[] = real.length
          ? [...real].sort((a, b) => (a === 'replicate' ? -1 : b === 'replicate' ? 1 : 0))
          : available.includes('mock')
            ? ['mock']
            : [];
        if (chain.length) setProviderChain(chain);
      })
      .catch(() => {});
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setResult(null);
    try {
      const img = await loadImageFromFile(file);
      const apiCanvas = resizeToCanvas(img, 1024).canvas;
      const blob = await new Promise<Blob>((resolve, reject) => {
        apiCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
          'image/jpeg',
          0.85,
        );
      });
      setFileName(file.name);
      setApiOriginal(apiCanvas);
      setUploadBlob(blob);
      setPhase('ready');
    } catch {
      setError(en.errorInvalidImage);
      setPhase('idle');
    }
  }, []);

  const processApi = useCallback(async () => {
    if (!uploadBlob || !styleId) return;
    setError('');
    setPhase('loading');
    try {
      let started = null;
      let lastError: unknown = new Error('No generation providers available');
      for (const provider of providerChain) {
        try {
          started = await startGeneration({ styleId, provider }, uploadBlob);
          break;
        } catch (err) {
          lastError = err;
          if (!isProviderError(err)) throw err;
        }
      }
      if (!started) throw lastError;

      if (started.status === 'succeeded' && started.imageUrl) {
        const blob = await fetchResultImage(started.imageUrl);
        setResult(await blobToCanvas(blob));
        setPhase('done');
        refreshAccount();
        return;
      }
      if (started.status === 'failed') {
        throw new Error('Generation failed');
      }

      setPhase('processing');
      const deadline = Date.now() + 180_000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await pollGeneration(started.generationId);
        if (status.status === 'succeeded') {
          if (!status.imageUrl) throw new Error('Generation completed without an image');
          const blob = await fetchResultImage(status.imageUrl);
          setResult(await blobToCanvas(blob));
          setPhase('done');
          refreshAccount();
          return;
        }
        if (status.status === 'failed') {
          throw new Error('Generation failed');
        }
      }
      throw new Error('Generation timed out');
    } catch (err) {
      setPhase('ready');
      setError(generateErrorMessage(err));
    }
  }, [uploadBlob, styleId, providerChain, refreshAccount]);

  const selectStyle = useCallback((next: string) => {
    setStyleId(next);
  }, []);

  const reset = useCallback(() => {
    setApiOriginal(null);
    setUploadBlob(null);
    setFileName('');
    setResult(null);
    setError('');
    setPhase('idle');
  }, []);

  const busy = phase === 'loading' || phase === 'processing';
  const currentStyle = allStyles.find((s) => s.id === styleId);
  const resultLabel = currentStyle ? resolveStyleMeta(currentStyle).label : en.compareResult;
  const previewUrl = useMemo(
    () => (apiOriginal ? apiOriginal.toDataURL('image/jpeg', 0.85) : null),
    [apiOriginal],
  );

  if (!authLoading && !user) {
    return (
      <AppLayout>
        <div className="tool-gate">
          <h1>Sign in to transform your photo</h1>
          <p>You need an account to generate images — it’s free.</p>
          <button
            type="button"
            className="btn-primary btn-lg"
            onClick={signInWithGoogle}
          >
            Sign in with Google
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="transform">
        <div className="transform-head">
          <h1 className="transform-title">AI Image Transformation</h1>
          <p className="transform-sub">
            Upload a photo, choose a style, and generate a new visual with AI.
          </p>
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
          <div className="transform-steps">
            <section className="transform-step">
              <div className="transform-step-head">
                <h3>Upload your photo</h3>
              </div>
              {apiOriginal ? (
                <div className="photo-preview">
                  <img
                    className="photo-preview-img"
                    src={previewUrl ?? ''}
                    alt={fileName}
                  />
                  <div className="photo-preview-meta">
                    <span className="file-name">{fileName}</span>
                    <span className="file-dims">
                      {apiOriginal.width} × {apiOriginal.height} px
                    </span>
                    <UploadDropzone onFile={handleFile} disabled={busy} compact />
                  </div>
                </div>
              ) : (
                <UploadDropzone onFile={handleFile} />
              )}
            </section>

            <section className="transform-step">
              <div className="transform-step-head">
                <h3>Choose a style</h3>
              </div>
              <StyleGrid className="style-grid--compact">
                {featureStyles.map((s) => (
                  <StyleCard
                    key={s.id}
                    style={s}
                    compact
                    selected={styleId === s.id}
                    onUse={selectStyle}
                  />
                ))}
              </StyleGrid>
            </section>

            <section className="transform-step">
              <div className="transform-step-head">
                <h3>Generate</h3>
              </div>
              <div className="transform-actions">
                <button
                  type="button"
                  className="btn-primary btn-lg"
                  disabled={!apiOriginal || busy}
                  onClick={() => processApi()}
                >
                  {busy ? 'Generating…' : 'Generate'}
                </button>
                {apiOriginal && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={reset}
                    disabled={busy}
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

        {busy && (
          <div className="transform-busy" role="status">
            <ProcessingOverlay
              phase={phase === 'loading' ? 'loading' : 'processing'}
              label="Generating…"
            />
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        {/* ── SEO landing content ────────────────────────────── */}
        <section className="transform-seo">
          <div className="transform-seo-block">
            <h2>How It Works</h2>
            <p>
              Upload an image, choose a style from the library, and press generate.
              StyleForge runs an image-to-image AI model on your photo and returns
              a transformed result — your composition and subject stay recognizable
              while the visual style is completely reimagined.
            </p>
          </div>
          <div className="transform-seo-block">
            <h2>What Can You Transform?</h2>
            <p>
              Portraits, landscapes, product shots, travel photos and more.
              Transform a normal photo into a cinematic portrait, an AI fashion
              photo, an anime character, a fantasy portrait or a Y2K photo.
            </p>
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
              Browse the full library on the <Link to="/all-styles">All Styles</Link> page,
              or discover a specific look on its own page — from{' '}
              <Link to="/styles/cinematic-editorial">Cinematic Editorial</Link> to{' '}
              <Link to="/styles/anime-character">Anime Character</Link>.
            </p>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
