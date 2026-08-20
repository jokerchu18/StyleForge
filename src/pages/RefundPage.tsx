import { useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { setPageMeta } from '../lib/seo';

export default function RefundPage() {
  useEffect(() => {
    setPageMeta('Refund Policy | StyleForge', 'StyleForge refund policy for credit purchases and payments.');
  }, []);

  return (
    <AppLayout>
      <div className="container legal">
        <h1>Refund Policy</h1>
        <p className="legal-date">Last updated: August 19, 2026</p>

        <h2>1. Credit Purchases</h2>
        <p>
          All credit purchases are final and non-refundable unless explicitly stated otherwise. Credits are a digital product and are consumed upon use.
        </p>

        <h2>2. Service Issues</h2>
        <p>
          If you experience a technical issue that prevents you from using your purchased credits, please contact our support team at{' '}
          <a href="mailto:support@styleforge.org">support@styleforge.org</a>. We will review your case and may issue a credit refund or restoration at our discretion.
        </p>

        <h2>3. Unauthorized Purchases</h2>
        <p>
          If you believe a purchase was made without your authorization, contact us immediately. We will work with you to resolve the issue, which may include a refund after verification.
        </p>

        <h2>4. Chargebacks</h2>
        <p>
          Initiating a chargeback without first contacting us may result in account suspension. Please reach out to our support team first — we are happy to resolve legitimate issues.
        </p>

        <h2>5. Contact</h2>
        <p>
          For refund inquiries, contact us at{' '}
          <a href="mailto:support@styleforge.org">support@styleforge.org</a>.
        </p>
      </div>
    </AppLayout>
  );
}