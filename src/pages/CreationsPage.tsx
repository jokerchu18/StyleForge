import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { apiJson } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { setPageMeta } from '../lib/seo';

interface CreationItem {
  id: string;
  styleId: string;
  styleLabel: string;
  model: string;
  generationType: string;
  costUnits: number;
  imageUrl: string | null;
  thumbnailUrl: string | null;
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

/** Session cache so navigating back to My Creations doesn't re-fetch. */
const creationsCache = new Map<string, CreationItem[]>();

export default function CreationsPage() {
  const { user } = useAuth();
  const [creations, setCreations] = useState<CreationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(
    async (silent = false) => {
      if (!user) {
        setCreations([]);
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const data = await apiJson<{ items: CreationItem[] }>('/api/generations');
        creationsCache.set(user.id, data.items);
        setCreations(data.items);
      } catch {
        setCreations([]);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    setPageMeta('My Creations | StyleForge', 'Every AI image you\'ve created with StyleForge, all in one place.');
    if (user && creationsCache.has(user.id)) {
      setCreations(creationsCache.get(user.id) as CreationItem[]);
      setLoading(false);
      load(true); // warm in background
    } else {
      setLoading(true);
      load();
    }
  }, [load, user]);

  const remove = useCallback(
    async (id: string) => {
      try {
        await apiJson(`/api/generations?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        setCreations((c) => {
          const next = c.filter((x) => x.id !== id);
          if (user) creationsCache.set(user.id, next);
          return next;
        });
      } catch {
        /* ignore */
      }
    },
    [user],
  );

  return (
    <AppLayout>
      <div className="landing-app-main">
        <div className="creations-head">
          <h1 className="hero-h1">My Creations</h1>
          <p className="hero-sub">Every AI image you’ve created with StyleForge, all in one place.</p>
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
                    {(c.thumbnailUrl || c.imageUrl) ? (
                      <img src={c.thumbnailUrl ?? c.imageUrl ?? ''} alt={`${c.styleLabel} creation`} loading="lazy" />
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
                      <span>{c.costUnits} Credit{c.costUnits > 1 ? 's' : ''}</span>
                      <span>{c.generationType}</span>
                    </div>
                    <div className="creation-actions">
                      {c.imageUrl != null && (
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
                        onClick={() => navigate(`/image-to-image?style=${encodeURIComponent(c.styleId)}`)}
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
            <strong>No Creations Yet</strong>
            <span>Transform your first photo and your AI-generated images will appear here.</span>
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/image-to-image')}
            >
              Create Your First Image
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
