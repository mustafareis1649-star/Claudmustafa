import { useI18n } from '../i18n/I18nContext';

export default function FaqSection() {
  const { t } = useI18n();

  return (
    <section className="faq" id="faq">
      <div className="wrap">
        <div className="section-head">
          <h2>{t('faq_title')}</h2>
        </div>
        <div style={{ marginTop: 18 }}>
          {[1, 2, 3, 4].map((n) => (
            <details className="faq-item" key={n} open={n === 1}>
              <summary>{t(`faq${n}_q`)}</summary>
              <p>{t(`faq${n}_a`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
