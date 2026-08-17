import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '../components/studio/AppSidebar';
import { en } from '../i18n/en';
import type { Feature } from '../shared/styles';
import { CATEGORY_PRESETS } from '../shared/styles-catalog';
import { saveStyle } from '../lib/styles/saveStyle';
import { useAuth } from '../hooks/useAuth';

interface ReplicateModelOption {
  id: string;
  label: string;
}

export default function CreateStylePage() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORY_PRESETS[0] ?? '');
  const [prompt, setPrompt] = useState('');
  const [models, setModels] = useState<ReplicateModelOption[]>([]);
  const [model, setModel] = useState('');
  const [seed, setSeed] = useState('');
  const [sampleImage, setSampleImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = `${en.appName} — ${en.create.title}`;
  }, []);

  useEffect(() => {
    let alive = true;
    fetch('/api/models')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { models: ReplicateModelOption[] }) => {
        if (alive) {
          setModels(data.models);
          if (data.models[0]) setModel(data.models[0].id);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!sampleImage) return;
    const url = URL.createObjectURL(sampleImage);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [sampleImage]);

  const goFeature = (f: Feature) => navigate(`/?feature=${f}`);

  const handleFile = (file: File | undefined) => {
    if (file && file.type.startsWith('image/')) {
      setSampleImage(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!label.trim() || !prompt.trim() || !model || !category || !sampleImage) {
      setError('Please fill in all required fields and upload a sample image.');
      return;
    }
    setSubmitting(true);
    try {
      await saveStyle({
        label: label.trim(),
        description: description.trim(),
        category,
        prompt: prompt.trim(),
        model,
        seed: seed.trim() === '' ? undefined : Number(seed),
        sampleImage,
      });
      setSuccess(true);
      setTimeout(() => navigate('/explore'), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save style');
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || authLoading;

  return (
    <div className="page page--app">
      <AppSidebar
        feature="browser"
        onFeature={goFeature}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />

      <main className={`app-main landing-app-main${collapsed ? ' app-main--collapsed' : ''}`}>
        <div className="create-head">
          <h1 className="hero-h1">{en.create.title}</h1>
          <p className="hero-sub">{en.create.subtitle}</p>
        </div>

        {!user && !authLoading ? (
          <div className="create-card">
            <p className="error-text">{en.create.needLogin}</p>
          </div>
        ) : (
          <div className="create-card">
            <div className="create-grid">
              <label className="create-field">
                <span>{en.create.label}</span>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={en.create.labelPlaceholder}
                  disabled={busy}
                />
              </label>

              <label className="create-field">
                <span>{en.create.category}</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={busy}>
                  {CATEGORY_PRESETS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="create-field create-field--full">
                <span>{en.create.description}</span>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={en.create.descriptionPlaceholder}
                  disabled={busy}
                />
              </label>

              <label className="create-field create-field--full">
                <span>{en.create.prompt}</span>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={en.create.promptPlaceholder}
                  rows={4}
                  disabled={busy}
                />
              </label>

              <label className="create-field">
                <span>{en.create.model}</span>
                <select value={model} onChange={(e) => setModel(e.target.value)} disabled={busy}>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </label>

              <label className="create-field">
                <span>{en.create.seed}</span>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder={en.create.seedPlaceholder}
                  disabled={busy}
                />
              </label>

              <div className="create-field create-field--full">
                <span>{en.create.sampleImage}</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="create-upload"
                  onClick={() => fileRef.current?.click()}
                  disabled={busy}
                >
                  {preview ? (
                    <img className="create-preview" src={preview} alt="Sample preview" />
                  ) : (
                    <span>{en.create.sampleHint}</span>
                  )}
                </button>
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}
            {success && <p className="success-text">{en.create.success}</p>}

            <button
              type="button"
              className="btn-primary"
              onClick={handleSubmit}
              disabled={busy}
            >
              {submitting ? en.create.submitting : en.create.submit}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
