import { useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { setPageMeta } from '../lib/seo';

export default function ContactPage() {
  useEffect(() => {
    setPageMeta('Contact | StyleForge', 'Get in touch with the StyleForge team — support, feedback, and inquiries.');
  }, []);

  return (
    <AppLayout>
      <div className="container legal">
        <h1>Contact Us</h1>
        <p className="legal-sub">
          Have a question, feedback, or need help? We'd love to hear from you.
        </p>

        <div className="contact-methods">
          <div className="contact-item">
            <h3>Support</h3>
            <p>
              For help with the platform, billing questions, or technical issues, email us at{' '}
              <a href="mailto:support@styleforge.org">support@styleforge.org</a>.
            </p>
          </div>

          <div className="contact-item">
            <h3>Feedback</h3>
            <p>
              Want to suggest a new style or feature? Send your ideas to{' '}
              <a href="mailto:feedback@styleforge.org">feedback@styleforge.org</a>.
            </p>
          </div>

          <div className="contact-item">
            <h3>Legal</h3>
            <p>
              For legal or privacy inquiries, reach out to{' '}
              <a href="mailto:legal@styleforge.org">legal@styleforge.org</a>.
            </p>
          </div>

          <div className="contact-item">
            <h3>Social</h3>
            <p>
              Follow us for updates, new styles, and inspiration:
            </p>
            <p className="contact-social">
              <a href="https://x.com/styleforge" target="_blank" rel="noopener noreferrer">X (Twitter)</a>
              {' · '}
              <a href="https://instagram.com/styleforge" target="_blank" rel="noopener noreferrer">Instagram</a>
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}