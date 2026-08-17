import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import PrivacyBadge from '../components/PrivacyBadge';
import { en } from '../i18n/en';

interface Props {
  slug: string;
}

const CONTENT: Record<string, { title: string; body: string[] }> = {
  'photo-to-anime': {
    title: 'Photo to Anime Converter — Free & Private',
    body: [
      'Turn any photo into anime art for free, right in your browser. Upload a portrait or landscape, pick a style (Hayao, Shinkai or Paprika), and get an anime version in seconds.',
      'Unlike most tools, your photo is processed locally on your device using an AI model. Nothing is uploaded, stored or shared.',
    ],
  },
  'photo-to-cartoon': {
    title: 'Photo to Cartoon — Instant Cartoonizer',
    body: [
      'Convert your photos into cartoon-style art instantly. Choose from three distinct anime aesthetics and download the result as a PNG.',
      'Free, private and runs entirely in your browser — no account, no upload.',
    ],
  },
  'anime-avatar-generator': {
    title: 'Anime Avatar Generator — Your Photo, Anime Style',
    body: [
      'Generate a unique anime avatar from your photo. Great for profiles, social media and creative projects.',
      'Your photo never leaves your device — processing happens locally with an on-device AI model.',
    ],
  },
  'anime-filter': {
    title: 'Anime Photo Filter — Apply the Anime Look',
    body: [
      'Apply a beautiful anime filter to your photos with a single click. Choose from Hayao, Shinkai and Paprika styles.',
      '100% free, private and instant — everything runs in your browser.',
    ],
  },
};

export default function SeoPage({ slug }: Props) {
  const content = CONTENT[slug] ?? CONTENT['photo-to-anime'];

  useEffect(() => {
    document.title = `${content.title} | ${en.appName}`;
  }, [content.title]);

  return (
    <div className="page">
      <Header />
      <main className="container seo">
        <h1>{content.title}</h1>
        {content.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <Link to="/" className="btn-primary seo-cta">
          Try it now — it's free
        </Link>
        <PrivacyBadge />
      </main>
      <footer className="footer">
        <span>© {new Date().getFullYear()} {en.appName}</span>
        <span className="footer-privacy">{en.privacyPill}</span>
      </footer>
    </div>
  );
}
