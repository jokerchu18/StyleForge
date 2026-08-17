import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppSidebar from '../components/studio/AppSidebar';
import Sidebar from '../components/studio/Sidebar';
import UploadDropzone from '../components/UploadDropzone';
import ProcessingOverlay from '../components/ProcessingOverlay';
import ResultCompare from '../components/ResultCompare';
import { en } from '../i18n/en';
import {
  canvasToTensor,
  loadImageFromFile,
  resizeToCanvas,
} from '../lib/preprocess';
import { tensorToCanvas } from '../lib/postprocess';
import { getSession, runAnime } from '../lib/animeOnnx';
import {
  getHealth,
  transformImage,
  type GenerateResultData,
} from '../lib/generate/client';
import { blobToCanvas } from '../lib/generate/format';
import type { Feature } from '../shared/styles';
import { resolveStyleMeta } from '../shared/styles';
import { useStyles } from '../hooks/useStyles';
import type { ProviderId } from '../shared/generate-types';

type Phase = 'idle' | 'ready' | 'loading' | 'processing' | 'done';

interface TensorData {
  data: Float32Array;
  width: number;
  height: number;
}

export default function HomePage() {
  useEffect(() => {
    document.title = `${en.appName} — Photo Stylizer`;
  }, []);

  const [searchParams] = useSearchParams();
  const initialFeature: Feature = searchParams.get('feature') === 'api' ? 'api' : 'browser';
  const [feature, setFeature] = useState<Feature>(initialFeature);
  const [collapsed, setCollapsed] = useState(false);
  const [styleId, setStyleId] = useState('');
  const [original, setOriginal] = useState<HTMLCanvasElement | null>(null);
  const [tensor, setTensor] = useState<TensorData | null>(null);
  const [apiOriginal, setApiOriginal] = useState<HTMLCanvasElement | null>(null);
  const [uploadBlob, setUploadBlob] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<HTMLCanvasElement | null>(null);
  const [error, setError] = useState('');
  const [availableProvider, setAvailableProvider] = useState<ProviderId | undefined>(undefined);

  const catalog = useStyles();
  const allStyles = useMemo(() => catalog?.styles ?? [], [catalog]);
  const featureEngine = feature === 'browser' ? 'local' : 'cloud';
  const featureStyles = allStyles.filter((s) => s.engine === featureEngine);

  // Pick the first style for the initial feature once the catalog is loaded.
  const initialized = useRef(false);
  useEffect(() => {
    if (!catalog || initialized.current) return;
    const first = catalog.styles.find((s) => s.engine === (initialFeature === 'api' ? 'cloud' : 'local'));
    if (first) {
      setStyleId(first.id);
      initialized.current = true;
    }
  }, [catalog, initialFeature]);

  useEffect(() => {
    getHealth()
      .then((h) => {
        const available = (Object.keys(h.providers) as ProviderId[]).filter(
          (id) => h.providers[id],
        );
        const real = available.find((id) => id !== 'mock');
        setAvailableProvider(real ?? available[0]);
      })
      .catch(() => {});
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setResult(null);
    try {
      const img = await loadImageFromFile(file);
      const { canvas } = resizeToCanvas(img, 512);
      const t = canvasToTensor(canvas);
      // Also keep a 1024-max version + JPEG blob for the API path.
      const apiCanvas = resizeToCanvas(img, 1024).canvas;
      const blob = await new Promise<Blob>((resolve, reject) => {
        apiCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
          'image/jpeg',
          0.85,
        );
      });
      setFileName(file.name);
      setOriginal(canvas);
      setTensor(t);
      setApiOriginal(apiCanvas);
      setUploadBlob(blob);
      setPhase('ready');
    } catch {
      setError(en.errorInvalidImage);
      setPhase('idle');
    }
  }, []);

  const processLocal = useCallback(async () => {
    if (!tensor) return;
    const model = allStyles.find((s) => s.id === styleId)?.model;
    if (!model) {
      setError(en.errorModel);
      return;
    }
    setPhase('loading');
    let session;
    try {
      session = await getSession(model);
    } catch {
      setPhase('ready');
      setError(en.errorModel);
      return;
    }
    setPhase('processing');
    try {
      const out = await runAnime(session, tensor.data, tensor.width, tensor.height);
      setResult(tensorToCanvas(out.data, out.width, out.height));
      setPhase('done');
    } catch {
      setPhase('ready');
      setError(en.errorProcess);
    }
  }, [tensor, styleId, allStyles]);

  const processApi = useCallback(async () => {
    if (!uploadBlob || !styleId) return;
    setPhase('loading');
    try {
      const r: GenerateResultData = await transformImage(
        { styleId, provider: availableProvider },
        uploadBlob,
      );
      const canvas = await blobToCanvas(r.blob);
      setResult(canvas);
      setPhase('done');
    } catch {
      setPhase('ready');
      setError(en.errorProcess);
    }
  }, [uploadBlob, styleId, availableProvider]);

  const process = useCallback(() => {
    return feature === 'api' ? processApi() : processLocal();
  }, [feature, processLocal, processApi]);

  const selectStyle = useCallback(
    (next: string) => {
      setStyleId(next);
      if (phase === 'ready' || phase === 'done') {
        setResult(null);
        setPhase('ready');
        requestAnimationFrame(() => process());
      }
    },
    [phase, process],
  );

  const switchFeature = useCallback(
    (next: Feature) => {
      if (next === feature) return;
      setFeature(next);
      const nextEngine = next === 'browser' ? 'local' : 'cloud';
      const first = allStyles.find((s) => s.engine === nextEngine);
      if (first) setStyleId(first.id);
      setResult(null);
      setError('');
      if (phase === 'ready' || phase === 'done') {
        setPhase('ready');
        requestAnimationFrame(() => process());
      }
    },
    [feature, phase, process, allStyles],
  );

  const reset = useCallback(() => {
    setOriginal(null);
    setTensor(null);
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

  return (
    <div className="page page--app page--tool">
      <AppSidebar
        feature={feature}
        onFeature={switchFeature}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      <main className={`app-main${collapsed ? ' app-main--collapsed' : ''}`}>
        {/* Active tool — full width */}
        <div className="studio">
          <div className="studio-main">
            {/* Inline hero header */}
            <div className="studio-header">
              <h1 className="studio-title">
                {en.homeHeroTitle}{' '}
                <span className="hero-accent">{en.homeHeroAccent}</span>
              </h1>
              <p className="studio-desc">{en.homeHeroSubtitle}</p>
            </div>

            <div className="studio-tool">
              {phase === 'idle' && <UploadDropzone onFile={handleFile} />}

              {original && (phase === 'ready' || phase === 'done' || busy) && (
                <div className="file-info">
                  <span className="file-thumb" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <circle cx="8.5" cy="10" r="1.6" fill="currentColor" />
                      <path
                        d="m5 17 4-4 3 3 3.5-3.5L19 16.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </span>
                  <span className="file-meta">
                    <strong className="file-name">{fileName}</strong>
                    <small className="file-dims">
                      {tensor && `${tensor.width} × ${tensor.height} px`}
                    </small>
                  </span>
                  <UploadDropzone onFile={handleFile} disabled={busy} compact />
                </div>
              )}

              {busy && (
                <ProcessingOverlay
                  phase={phase === 'loading' ? 'loading' : 'processing'}
                  label={feature === 'api' ? en.apiProcessing : undefined}
                />
              )}

              {phase === 'done' && original && result && (
                <ResultCompare
                  original={feature === 'api' && apiOriginal ? apiOriginal : original}
                  result={result}
                  style={styleId}
                  resultLabel={resultLabel}
                  onReset={reset}
                />
              )}

              {phase === 'ready' && original && !busy && (
                <div className="auto-run-hint">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => process()}
                  >
                    {feature === 'api' ? en.apiRunButton : en.runButton}
                  </button>
                </div>
              )}

              {error && <p className="error-text">{error}</p>}
            </div>
          </div>

          <Sidebar
            feature={feature}
            styles={featureStyles}
            selected={styleId}
            onSelect={selectStyle}
            disabled={busy}
          />
        </div>
      </main>
    </div>
  );
}
