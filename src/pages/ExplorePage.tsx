import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import StyleCard from '../components/StyleCard';
import StyleGrid from '../components/StyleGrid';
import SearchBar from '../components/SearchBar';
import CategoryTabs from '../components/CategoryTabs';
import SortDropdown from '../components/SortDropdown';
import { resolveStyleMeta } from '../shared/styles';
import { useStyles } from '../hooks/useStyles';

type SortKey = 'popular' | 'newest';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? 'all');
  const [sort, setSort] = useState<SortKey>('popular');

  useEffect(() => {
    document.title = 'All Styles — AI Photo Styles | StyleForge';
  }, []);

  const catalog = useStyles();
  const categories = catalog?.categories ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (catalog?.styles ?? []).filter((s) => {
      if (category !== 'all' && s.category !== category) return false;
      if (q) {
        const { label, description } = resolveStyleMeta(s);
        const haystack = [label, description, s.category, (s.tags ?? []).join(' ')]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [catalog, category, query]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sort === 'popular') {
      list.sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0));
    } else {
      list.sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
    }
    return list;
  }, [filtered, sort]);

  const setCategoryAndUrl = (next: string) => {
    setCategory(next);
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('category');
    else params.set('category', next);
    setSearchParams(params, { replace: true });
  };

  return (
    <AppLayout>
      <div className="landing-app-main">
        <div className="explore-head">
          <h1 className="hero-h1">All Styles</h1>
          <p className="hero-sub">Browse AI photo styles and discover your next look.</p>

          <div className="explore-controls">
            <div className="explore-row">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search styles, categories, or tags…"
              />
              <SortDropdown
                value={sort}
                onChange={(v) => setSort(v as SortKey)}
                options={SORT_OPTIONS}
              />
            </div>
            <CategoryTabs
              categories={categories}
              active={category}
              onChange={setCategoryAndUrl}
            />
          </div>
        </div>

        {sorted.length ? (
          <>
            <p className="explore-count" aria-live="polite">
              {sorted.length} style{sorted.length === 1 ? '' : 's'}
            </p>
            <div className="style-gallery-wrapper">
              <StyleGrid>
                {sorted.map((s) => (
                  <StyleCard
                    key={s.id}
                    style={s}
                    onUse={(id) => navigate(`/styles/${id}`)}
                  />
                ))}
              </StyleGrid>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>No styles found</strong>
            <span>Try a different search or category.</span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
