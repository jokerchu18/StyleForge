import { useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { setPageMeta } from '../lib/seo';

export default function AboutPage() {
  useEffect(() => {
    setPageMeta('About Us | StyleForge', 'StyleForge is an AI-powered image transformation platform. Learn about our mission and team.');
  }, []);

  return (
    <AppLayout>
      <div className="container legal">
        <h1>About StyleForge</h1>
        <p className="legal-sub">
          StyleForge is an AI-powered image transformation platform. We help you transform your photos into stunning visual styles using carefully crafted AI prompts.
        </p>

        <h2>Our Mission</h2>
        <p>
          We believe AI image transformation should be accessible, creative, and intentional. Every Style on StyleForge is built around a carefully designed AI prompt — not a simple filter. We focus on composition, lighting, atmosphere, character details, color, and visual texture to create transformations that feel purposeful and polished.
        </p>

        <h2>What Makes StyleForge Different</h2>
        <p>
          Unlike simple photo filters or generic AI image generators, StyleForge combines image-to-image AI with curated, expertly crafted prompts. Each Style is a complete transformation recipe designed to produce consistent, high-quality results.
        </p>

        <h2>Contact</h2>
        <p>
          Have questions or feedback? Reach out at{' '}
          <a href="mailto:support@styleforge.org">support@styleforge.org</a>.
        </p>
      </div>
    </AppLayout>
  );
}