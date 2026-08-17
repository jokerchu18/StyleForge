import { en } from '../i18n/en';

export default function PrivacyBadge() {
  return (
    <section className="privacy-section">
      <h2>{en.privacyTitle}</h2>
      <ul className="privacy-list">
        {en.privacyItems.map((item) => (
          <li key={item}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" />
              <path
                d="m8.5 12 2.4 2.4 4.6-4.8"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
