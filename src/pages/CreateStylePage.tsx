import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { en } from '../i18n/en';
import { CATEGORY_PRESETS } from '../shared/styles-catalog';
import { saveStyle } from '../lib/styles/saveStyle';
import { useAuth } from '../hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface ReplicateModelOption {
  id: string;
  label: string;
}

export default function CreateStylePage() {
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
      setTimeout(() => navigate('/all-styles'), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save style');
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || authLoading;

  return (
    <AppLayout>
      <div className="landing-app-main">
        <div className="create-head">
          <h1 className="hero-h1">{en.create.title}</h1>
          <p className="hero-sub">{en.create.subtitle}</p>
        </div>

        {!user && !authLoading ? (
          <div className="create-gate">
            <p className="error-text">{en.create.needLogin}</p>
          </div>
        ) : (
          <div className="create-layout">
            {/* Left — style information */}
            <div className="create-form">
              <div className="create-field">
                <label htmlFor="create-label">{en.create.label}</label>
                <input
                  id="create-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={en.create.labelPlaceholder}
                  disabled={busy}
                />
              </div>

              <div className="create-field">
                <label htmlFor="create-category">{en.create.category}</label>
                <Select value={category} onValueChange={setCategory} disabled={busy}>
                  <SelectTrigger id="create-category" aria-label={en.create.category}>
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
                <label htmlFor="create-desc">{en.create.description}</label>
                <input
                  id="create-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={en.create.descriptionPlaceholder}
                  disabled={busy}
                />
              </div>

              <div className="create-field">
                <label htmlFor="create-prompt">{en.create.prompt}</label>
                <textarea
                  id="create-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={en.create.promptPlaceholder}
                  rows={5}
                  disabled={busy}
                />
              </div>

              <div className="create-field">
                <label>{en.create.model}</label>
                {models.length ? (
                  <div className="model-grid">
                    {models.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`model-card${model === m.id ? ' selected' : ''}`}
                        onClick={() => setModel(m.id)}
                        disabled={busy}
                      >
                        <strong>{m.label}</strong>
                        <small>{m.id}</small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="model-empty">
                    No models configured — set the REPLICATE_MODELS env var and
                    restart the server.
                  </p>
                )}
              </div>

              <div className="create-field">
                <label htmlFor="create-seed">{en.create.seed}</label>
                <input
                  id="create-seed"
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder={en.create.seedPlaceholder}
                  disabled={busy}
                />
              </div>
            </div>

            {/* Right — preview + submit */}
            <div className="create-preview-panel">
              <div className="create-field">
                <label>{en.create.sampleImage}</label>
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
                    <img
                      className="create-preview"
                      src={preview}
                      alt="Sample preview"
                    />
                  ) : (
                    <span className="create-upload-empty">
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="m17 8-5-5-5 5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 3v12"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                      <strong>Upload a sample image</strong>
                      <small>{en.create.sampleHint}</small>
                    </span>
                  )}
                </button>
              </div>

              {error && <p className="error-text">{error}</p>}
              {success && <p className="success-text">Submitted for review — it will appear once approved.</p>}

              <button
                type="button"
                className="btn-primary btn-lg create-submit"
                onClick={handleSubmit}
                disabled={busy}
              >
                {submitting ? en.create.submitting : en.create.submit}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
