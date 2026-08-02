import { Link } from 'react-router-dom';
import { useI18n } from '../shell/i18n/I18nContext';

// Shared shell for static legal pages (privacy policy, terms of use, ...).
// Content is passed in fully rendered per-language from the calling page,
// this component only provides the consistent header/back-link/typography.
export default function LegalPage({ title, updated, children }) {
  const { dir } = useI18n();

  return (
    <div className="wrap" style={{ padding: '56px 28px 96px', maxWidth: 820 }} dir={dir}>
      <Link
        to="/"
        style={{
          color: 'var(--text-3)',
          fontSize: 14,
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: 24,
        }}
      >
        ← itdocsy
      </Link>
      <h1 style={{ fontSize: 32, color: 'var(--ink)', marginBottom: 8 }}>{title}</h1>
      {updated && (
        <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 40 }}>{updated}</p>
      )}
      <div
        style={{
          color: 'var(--text-2)',
          fontSize: 15.5,
          lineHeight: 1.7,
        }}
      >
        {children}
      </div>
      <style>{`
        .legal-body h2 { color: var(--ink); font-size: 19px; margin: 36px 0 12px; }
        .legal-body p { margin: 0 0 14px; }
        .legal-body ul { margin: 0 0 14px; padding-left: 20px; }
        .legal-body li { margin-bottom: 6px; }
        .legal-body a { color: var(--signal); }
      `}</style>
    </div>
  );
}
