import { useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { setPageMeta } from '../lib/seo';

export default function PrivacyPage() {
  useEffect(() => {
    setPageMeta('Privacy Policy | StyleForge', 'StyleForge privacy policy — how we handle your data, images, and personal information.');
  }, []);

  return (
    <AppLayout>
      <div className="container legal">
        <h1>Privacy Policy</h1>
        <p className="legal-date">Last updated: August 19, 2026</p>

        <h2>1. Information We Collect</h2>
        <p>
          When you use StyleForge, we may collect the following information:
        </p>
        <ul>
          <li><strong>Account information:</strong> email address and display name when you create an account.</li>
          <li><strong>Images:</strong> the images you upload for transformation. These are processed temporarily and stored only as needed to provide the service.</li>
          <li><strong>Usage data:</strong> which styles you use, generation timestamps, and credit consumption.</li>
          <li><strong>Cookies:</strong> we use essential cookies for authentication and session management.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information solely to:</p>
        <ul>
          <li>Provide and improve the image transformation service</li>
          <li>Manage your account and credits</li>
          <li>Send service-related communications (if applicable)</li>
          <li>Ensure platform security and prevent abuse</li>
        </ul>

        <h2>3. Image Handling</h2>
        <p>
          Uploaded images are processed by our AI providers (Replicate, OpenAI) to generate transformed versions.
          Images are not used to train or improve AI models. Generated results are stored in your account and
          can be deleted at any time. We do not share your images with third parties except as necessary to
          process the transformation.
        </p>

        <h2>4. Data Retention</h2>
        <p>
          Account data is retained until you delete your account. Generated images are retained for as long as
          your account is active. You may delete individual generations or your entire account at any time.
        </p>

        <h2>5. Third-Party Services</h2>
        <p>
          StyleForge uses third-party AI providers to process image transformations. These providers receive
          your images solely for the purpose of generating the requested output and are contractually
          prohibited from using them for any other purpose.
        </p>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request deletion of your data and account</li>
          <li>Export your generated images</li>
          <li>Withdraw consent at any time</li>
        </ul>

        <h2>7. Contact</h2>
        <p>
          For privacy-related inquiries, contact us at{' '}
          <a href="mailto:privacy@styleforge.org">privacy@styleforge.org</a>.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Material changes will be communicated via email
          or through the platform.
        </p>
      </div>
    </AppLayout>
  );
}