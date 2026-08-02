import { useToolI18n } from "../../../shell/i18n/I18nContext";
import { splitPdfDicts } from "../i18n";

export default function HowItWorks() {
  const t = useToolI18n(splitPdfDicts);

  return (
    <section className="how" id="how">
      <div className="wrap">
        <div className="section-head">
          <h2>{t("how_title")}</h2>
          <p>{t("how_lead")}</p>
        </div>
        <div className="how-grid">
          {[1, 2, 3].map((n) => (
            <div className="step" key={n}>
              <div className="marker">{n}</div>
              <h3>{t(`step${n}_title`)}</h3>
              <p>{t(`step${n}_desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
