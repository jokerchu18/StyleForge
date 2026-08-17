import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { en } from '../i18n/en';

const POSTS: { slug: string; title: string; excerpt: string }[] = [
  {
    slug: 'photo-to-anime-guide',
    title: 'How to Turn Your Photo into Anime: A Beginner’s Guide',
    excerpt:
      'Pick a style, upload, and get anime art in seconds. Learn which on-device and cloud styles suit portraits, landscapes and more.',
  },
  {
    slug: 'sci-fi-photo-edits',
    title: 'Create Sci-Fi Photos: Neon, Cyberpunk and Futuristic Looks',
    excerpt:
      'Give your photos a futuristic glow with our sci-fi style — perfect for avatars, posters and creative projects.',
  },
  {
    slug: 'watercolor-vs-oil',
    title: 'Watercolor vs Oil Painting: Which Style Suits Your Photo?',
    excerpt:
      'Both turn photos into painterly art, but they feel very different. A quick comparison to help you choose.',
  },
];

export default function BlogPage() {
  useEffect(() => {
    document.title = `${en.blog.title} | ${en.appName}`;
  }, []);

  return (
    <div className="page landing-page">
      <header className="header">
        <div className="header-inner">
          <Link to="/home" className="logo">
            <span className="logo-mark">A</span>
            <span className="logo-name">{en.appName}</span>
          </Link>
          <nav className="nav">
            <Link to="/" className="nav-link">
              {en.appNavTools}
            </Link>
          </nav>
          <span className="privacy-pill privacy-pill--private">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 3 5 6v5c0 4.5 2.9 8.4 7 9.6 4.1-1.2 7-5.1 7-9.6V6l-7-3Z"
                fill="currentColor"
                opacity="0.25"
              />
              <path
                d="m9.5 11.8 1.7 1.7 3.6-3.6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            {en.privacyPill}
          </span>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-inner">
            <h1 className="hero-h1">{en.blog.title}</h1>
            <p className="hero-sub">{en.blog.subtitle}</p>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-section-inner">
            <div className="blog-list">
              {POSTS.map((post) => (
                <article key={post.slug} className="blog-card">
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  <span className="blog-card-more">Coming soon</span>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>© {new Date().getFullYear()} {en.appName}</span>
        <span className="footer-privacy">{en.privacyPill}</span>
      </footer>
    </div>
  );
}
