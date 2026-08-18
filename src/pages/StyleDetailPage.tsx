import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import StyleCard from '../components/StyleCard';
import StyleGrid from '../components/StyleGrid';
import { apiJson } from '../lib/api';
import { resolveStyleMeta } from '../shared/styles';
import { useStyles } from '../hooks/useStyles';
import { useAccount } from '../hooks/useAccount';
import type { PublicStyleDefinition } from '../shared/style-types';

function modelLabel(style: PublicStyleDefinition): string {
  const rep = style.providerOverrides?.replicate?.model;
  if (rep) return rep;
  const dash = style.providerOverrides?.dashscope?.dashscopeFunction;
  if (dash) return `dashscope:${dash}`;
  return 'AI Model';
}

export default function StyleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const catalog = useStyles();
  const { account } = useAccount();

  const style = useMemo(
    () => catalog?.styles.find((s) => s.id === id),
    [catalog, id],
  );
  const related = useMemo(() => {
    if (!catalog || !style) return [];
    const sameCat = catalog.styles.filter(
      (s) => s.id !== style.id && s.category === style.category,
    );
    const rest = catalog.styles.filter(
      (s) => s.id !== style.id && s.category !== style.category,
    );
    return [...sameCat, ...rest].slice(0, 4);
  }, [catalog, style]);

  useEffect(() => {
    if (style) {
      const { label } = resolveStyleMeta(style);
      document.title = `${label} Style | StyleForge`;
    }
  }, [style]);

  const isPremiumLocked = useMemo(
    () => (style?.isPremium ?? false) && account?.plan === 'free',
    [style, account],
  );

  const toggleSave = useCallback(async () => {
    if (!style) return;
    try {
      if (saved) {
        await apiJson(`/api/saved-styles?styleId=${encodeURIComponent(style.id)}`, {
          method: 'DELETE',
        });
        setSaved(false);
      } else {
        await apiJson('/api/saved-styles', {
          method: 'POST',
          body: JSON.stringify({ styleId: style.id }),
        });
        setSaved(true);
      }
    } catch {
      /* ignore save failures */
    }
  }, [style, saved]);

  if (!style) {
    return (
      <AppLayout>
        <div className="landing-app-main">
          <div className="empty-state">
            <strong>Style not found</strong>
            <span>The style you’re looking for doesn’t exist.</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { label, description } = resolveStyleMeta(style);

  return (
    <AppLayout>
      <div className="landing-app-main">
        <div className="detail">
          <div className="detail-hero">
            <div className="detail-media">
              <img className="detail-img" src={style.sampleImage} alt={`${label} style preview`} />
            </div>
            <div className="detail-info">
              <div className="detail-tags">
                <span className="style-card-cat">{style.category}</span>
                {style.isPremium && (
                  <span className="premium-badge">Premium</span>
                )}
              </div>
              <h1 className="detail-title">{label}</h1>
              <p className="detail-desc">{description}</p>
              <dl className="detail-meta">
                <div>
                  <dt>Model</dt>
                  <dd>{modelLabel(style)}</dd>
                </div>
                <div>
                  <dt>Category</dt>
                  <dd>{style.category}</dd>
                </div>
                <div>
                  <dt>Uses</dt>
                  <dd>{style.usageCount ?? 0}</dd>
                </div>
                <div>
                  <dt>Likes</dt>
                  <dd>{style.likeCount ?? 0}</dd>
                </div>
              </dl>
              <div className="detail-actions">
                <button
                  type="button"
                  className="btn-primary btn-lg"
                  onClick={() => navigate(`/tool?style=${encodeURIComponent(style.id)}`)}
                  disabled={isPremiumLocked}
                >
                  {isPremiumLocked ? 'Upgrade to use' : 'Use this Style'}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={toggleSave}
                  aria-pressed={saved}
                >
                  {saved ? 'Saved ♥' : 'Save'}
                </button>
              </div>
              {isPremiumLocked && (
                <p className="premium-note">
                  This is a Premium style. Upgrade to unlock it.
                </p>
              )}
            </div>
          </div>

          <section className="detail-related">
            <div className="section-head">
              <h2>Related Styles</h2>
            </div>
            <StyleGrid>
              {related.map((s) => (
                <StyleCard
                  key={s.id}
                  style={s}
                  onUse={(next) => navigate(`/styles/${next}`)}
                />
              ))}
            </StyleGrid>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
