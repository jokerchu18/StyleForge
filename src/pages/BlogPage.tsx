import { useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { en } from '../i18n/en';

interface Post {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string;
}

const POSTS: Post[] = [
  {
    slug: 'photo-to-anime-guide',
    title: 'How to Turn Your Photo into Anime: A Beginner’s Guide',
    excerpt:
      'Pick a style, upload, and get anime art in seconds. Learn which cloud AI styles suit portraits, landscapes and more.',
    image: '/styles/api/anime.png',
    category: 'Guide',
    date: 'Aug 12, 2026',
  },
  {
    slug: 'sci-fi-photo-edits',
    title: 'Create Sci-Fi Photos: Neon, Cyberpunk and Futuristic Looks',
    excerpt:
      'Give your photos a futuristic glow with our sci-fi style — perfect for avatars, posters and creative projects.',
    image: '/styles/api/sci-fi.png',
    category: 'Inspiration',
    date: 'Aug 5, 2026',
  },
  {
    slug: 'watercolor-vs-oil',
    title: 'Watercolor vs Oil Painting: Which Style Suits Your Photo?',
    excerpt:
      'Both turn photos into painterly art, but they feel very different. A quick comparison to help you choose.',
    image: '/styles/api/oil-painting.png',
    category: 'Comparison',
    date: 'Jul 28, 2026',
  },
];

export default function BlogPage() {
  useEffect(() => {
    document.title = `${en.blog.title} | ${en.appName}`;
  }, []);

  return (
    <AppLayout>
      <div className="landing-app-main">
        <div className="blog-head">
          <span className="landing-eyebrow">StyleForge Journal</span>
          <h1 className="hero-h1">{en.blog.title}</h1>
          <p className="hero-sub">{en.blog.subtitle}</p>
        </div>

        <div className="blog-grid">
          {POSTS.map((post) => (
            <article key={post.slug} className="blog-card">
              <div className="blog-card-media">
                <img src={post.image} alt={`${post.title} cover`} loading="lazy" />
              </div>
              <div className="blog-card-body">
                <span className="blog-card-cat">{post.category}</span>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <div className="blog-card-meta">
                  <time dateTime={post.date}>{post.date}</time>
                  <span className="blog-card-more">Coming soon</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
