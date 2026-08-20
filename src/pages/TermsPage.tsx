import { useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { setPageMeta } from '../lib/seo';

export default function TermsPage() {
  useEffect(() => {
    setPageMeta('Terms of Service | StyleForge', 'StyleForge terms of service — rules and guidelines for using our AI image transformation platform.');
  }, []);

  return (
    <AppLayout>
      <div className="container legal">
        <h1>Terms of Service</h1>
        <p className="legal-date">Last updated: August 19, 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By using StyleForge, you agree to these Terms of Service. If you do not agree, do not use the service.
        </p>

        <h2>2. Service Description</h2>
        <p>
          StyleForge is an AI-powered image transformation platform that allows users to upload images and
          apply curated visual styles using AI models. The service is provided "as is" and may be updated
          or modified at any time.
        </p>

        <h2>3. User Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials. You must be
          at least 13 years old to use the service. Accounts found to be in violation of these terms may
          be suspended or terminated.
        </p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Upload illegal, harmful, or abusive content</li>
          <li>Use the service to generate harmful or misleading content</li>
          <li>Attempt to circumvent credit systems or access controls</li>
          <li>Use automated scripts or bots to interact with the service</li>
          <li>Violate any applicable laws or regulations</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>
          You retain ownership of your uploaded images. StyleForge does not claim any ownership over
          the content you upload or generate. The styles, prompts, and platform technology are the
          intellectual property of StyleForge.
        </p>

        <h2>6. Credits and Payments</h2>
        <p>
          Credits are non-refundable and non-transferable. We reserve the right to modify credit costs,
          pricing, and credit expiration policies. Unused credits may expire after a period of inactivity.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          StyleForge is provided without warranty of any kind. We are not liable for any damages arising
          from your use of the service, including but not limited to loss of data, lost profits, or
          service interruption.
        </p>

        <h2>8. Termination</h2>
        <p>
          We reserve the right to suspend or terminate access to the service at any time, with or without
          cause, and with or without notice.
        </p>

        <h2>9. Changes to Terms</h2>
        <p>
          We may update these terms at any time. Continued use of the service after changes constitutes
          acceptance of the new terms.
        </p>

        <h2>10. Contact</h2>
        <p>
          For questions about these terms, contact us at{' '}
          <a href="mailto:legal@styleforge.org">legal@styleforge.org</a>.
        </p>
      </div>
    </AppLayout>
  );
}