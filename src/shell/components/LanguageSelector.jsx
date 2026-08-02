import { SUPPORTED_LANGS, LANG_NAMES } from '../../config/languages';
import { useI18n } from '../i18n/I18nContext';

export default function LanguageSelector() {
  const { lang, setLang } = useI18n();

  return (
    <select
      className="lang-select"
      aria-label="Language"
      value={lang}
      onChange={(e) => setLang(e.target.value)}
    >
      {SUPPORTED_LANGS.map((code) => (
        <option key={code} value={code}>
          {LANG_NAMES[code]}
        </option>
      ))}
    </select>
  );
}
