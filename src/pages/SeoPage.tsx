import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PrivacyBadge from '../components/PrivacyBadge';
import { en } from '../i18n/en';
import { setPageMeta } from '../lib/seo';

interface Props {
  slug: string;
}

const CONTENT: Record<string, { title: string; body: string[] }> = {
  'photo-to-anime': {
    title: 'Photo to Anime Converter — Free & Instant',
    body: [
      'Turn any photo into anime art for free in seconds. Upload a portrait or landscape, pick a style (Anime, Sci-Fi, Oil Painting and more), and get a transformed version ready to download.',
      'Powered by cloud AI — no account needed, and you keep full control of your creations.',
    ],
  },
  'photo-to-cartoon': {
    title: 'Photo to Cartoon — Instant Cartoonizer',
    body: [
      'Convert your photos into cartoon-style art instantly. Choose from a growing style library and download the result as a PNG.',
      'Free and easy — no account, no watermark.',
    ],
  },
  'anime-avatar-generator': {
    title: 'Anime Avatar Generator — Your Photo, Anime Style',
    body: [
      'Generate a unique anime avatar from your photo. Great for profiles, social media and creative projects.',
      'Cloud AI transforms your photo into a fresh anime look in seconds.',
    ],
  },
  'anime-filter': {
    title: 'Anime Photo Filter — Apply the Anime Look',
    body: [
      'Apply a beautiful anime filter to your photos with a single click. Pick from the style library and preview the result before downloading.',
      '100% free and instant — start transforming right away.',
    ],
  },
};

export default function SeoPage({ slug }: Props) {
  const content = CONTENT[slug] ?? CONTENT['photo-to-anime'];

  useEffect(() => {
    setPageMeta(`${content.title} | ${en.appName}`, content.body[0].slice(0, 160));
  }, [content.title]);

  return (
    <AppLayout>
      <div className="container seo">
        <h1>{content.title}</h1>
        {content.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <Link to="/" className="btn-primary seo-cta">
          Try it now — it's free
        </Link>
        <PrivacyBadge />
      </div>
    </AppLayout>
  );
}
