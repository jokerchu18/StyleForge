import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { apiJson } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

interface CreationItem {
  id: string;
  styleId: string;
  styleLabel: string;
  model: string;
  generationType: string;
  costUnits: number;
  imageUrl: string | null;
  status: string;
  createdAt: string;
}

function formatDate(ts: string): string {
  try {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function CreationsPage() {
  const { user } = useAuth();
  const [creations, setCreations] = useState<CreationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!user) {
      setCreations([]);
      setLoading(false);
      return;
    }
    try {
      const data = await apiJson<{ items: CreationItem[] }>('/api/generations');
      setCreations(data.items);
    } catch {
      setCreations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    document.title = 'My Creations | StyleForge';
    setLoading(true);
    load();
  }, [load]);

  const remove = useCallback(
    async (id: string) => {
      try {
        await apiJson(`/api/generations?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        setCreations((c) => c.filter((x) => x.id !== id));
      } catch {
        /* ignore */
      }
    },
    [],
  );

  return (
    <AppLayout>
      <div className="landing-app-main">
        <div className="creations-head">
          <span className="landing-eyebrow">Your work</span>
          <h1 className="hero-h1">My Creations</h1>
          <p className="hero-sub">Every image you’ve transformed.</p>
        </div>

        {loading ? (
          <div className="processing">
            <div className="spinner" />
          </div>
        ) : !user ? (
          <div className="empty-state">
            <strong>Sign in to see your creations</strong>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/')}
            >
              Sign in
            </button>
          </div>
        ) : creations.length ? (
          <>
            <div className="creations-bar">
              <span className="creations-count">
                {creations.length} creation{creations.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="creations-grid">
              {creations.map((c) => (
                <article key={c.id} className="creation-card">
                  <div className="creation-media">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={`${c.styleLabel} creation`} loading="lazy" />
                    ) : (
                      <div className="creation-failed">Failed</div>
                    )}
                  </div>
                  <div className="creation-body">
                    <div className="creation-top">
                      <strong>{c.styleLabel}</strong>
                      <time dateTime={new Date(c.createdAt).toISOString()}>
                        {formatDate(c.createdAt)}
                      </time>
                    </div>
                    <div className="creation-meta">
                      <span>{c.costUnits} Generation{c.costUnits > 1 ? 's' : ''}</span>
                      <span>{c.generationType}</span>
                    </div>
                    <div className="creation-actions">
                      {c.imageUrl && (
                        <a
                          href={c.imageUrl}
                          download={`styleforge-${c.styleId}.png`}
                          className="btn-primary"
                        >
                          Download
                        </a>
                      )}
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => navigate(`/tool?style=${encodeURIComponent(c.styleId)}`)}
                      >
                        Try again
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => remove(c.id)}
                        aria-label={`Delete ${c.styleLabel} creation`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>No creations yet</strong>
            <span>Transform a photo and it will appear here.</span>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/tool')}
            >
              Transform a photo
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
