import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SUPPORTED_LANGS, RTL_LANGS, detectLang } from '../../config/languages';
import { shellDicts } from './index';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(detectLang);

  const dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  // Shell-level translator: nav, footer, pricing, faq.
  const t = useMemo(() => {
    const dict = shellDicts[lang] || shellDicts.en;
    return (key) => dict[key] || key;
  }, [lang]);

  function changeLang(next) {
    if (!SUPPORTED_LANGS.includes(next)) return;
    setLang(next);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    window.history.replaceState({}, '', url);
  }

  const value = { lang, dir, t, setLang: changeLang };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

// Reusable hook for tool-level dictionaries: pass in { en: {...}, tr: {...}, ... }
// imported from that tool's own i18n/ folder, get back a t() scoped to it,
// following the site-wide active language automatically.
export function useToolI18n(toolDicts) {
  const { lang } = useI18n();
  return useMemo(() => {
    const dict = toolDicts[lang] || toolDicts.en;
    return (key) => dict[key] || key;
  }, [toolDicts, lang]);
}
