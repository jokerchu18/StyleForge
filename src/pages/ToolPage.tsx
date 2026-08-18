import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import StyleCard from '../components/StyleCard';
import StyleGrid from '../components/StyleGrid';
import UploadDropzone from '../components/UploadDropzone';
import ProcessingOverlay from '../components/ProcessingOverlay';
import ResultCompare from '../components/ResultCompare';
import { en } from '../i18n/en';
import { loadImageFromFile, resizeToCanvas } from '../lib/imageUtils';
import { getHealth } from '../lib/generate/client';
import { transformWithFallback, generateErrorMessage } from '../lib/generate/errors';
import { blobToCanvas } from '../lib/generate/format';
import { resolveStyleMeta } from '../shared/styles';
import { useStyles } from '../hooks/useStyles';
import { useAuth } from '../hooks/useAuth';
import { useAccount } from '../hooks/useAccount';
import type { ProviderId } from '../shared/generate-types';

type Phase = 'idle' | 'ready' | 'loading' | 'processing' | 'done';

export default function ToolPage() {
  useEffect(() => {
    document.title = `${en.appName} — Image to Image`;
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
        // Real providers first (cross-provider retry), mock only when none are real.
        const chain: ProviderId[] = real.length
          ? real
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
      const r = await transformWithFallback(styleId, uploadBlob, providerChain);
      const canvas = await blobToCanvas(r.blob);
      setResult(canvas);
      setPhase('done');
      refreshAccount(); // generation was recorded server-side; refresh the chip
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
          <span className="landing-eyebrow">Image to Image</span>
          <h1 className="transform-title">Transform your photo</h1>
          <p className="transform-sub">
            Upload a photo and choose a style to transform it.
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
            {/* Step 1 — Upload */}
            <section className="transform-step">
              <div className="transform-step-head">
                <span className="step-badge">1</span>
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

            {/* Step 2 — Choose style */}
            <section className="transform-step">
              <div className="transform-step-head">
                <span className="step-badge">2</span>
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

            {/* Step 3 — Transform */}
            <section className="transform-step">
              <div className="transform-step-head">
                <span className="step-badge">3</span>
                <h3>Transform</h3>
              </div>
              <div className="transform-actions">
                <button
                  type="button"
                  className="btn-primary btn-lg"
                  disabled={!apiOriginal || busy}
                  onClick={() => processApi()}
                >
                  {busy ? 'Creating your style…' : 'Transform Image'}
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
                <span className="generation-cost">1 Generation</span>
              </div>
            </section>
          </div>
        )}

        {busy && (
          <div className="transform-busy" role="status">
            <ProcessingOverlay
              phase={phase === 'loading' ? 'loading' : 'processing'}
              label="Creating your style…"
            />
          </div>
        )}

        {error && <p className="error-text">{error}</p>}
      </div>
    </AppLayout>
  );
}
