import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer>
      <div className="wrap foot-row">
        <div className="logo" style={{ fontSize: 16, color: 'var(--ink)' }}>
          <span className="mark" style={{ width: 22, height: 22 }}>
            <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
              <path d="M10 1 L18 6 L10 11 L2 6 Z" fill="#fff" opacity="0.95" />
              <path d="M10 7 L18 12 L10 17 L2 12 Z" fill="#fff" opacity="0.6" />
            </svg>
          </span>
          itdocsy
        </div>
        <div className="foot-links">
          <Link to="/privacy-policy">{t('footer_privacy')}</Link>
          <Link to="/terms-of-use">{t('footer_terms')}</Link>
          <a href="mailto:itdocsy@gmail.com">itdocsy@gmail.com</a>
        </div>
        <div className="copyright">{t('footer_copyright')}</div>
      </div>
    </footer>
  );
}
