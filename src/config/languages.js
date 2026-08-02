export const SUPPORTED_LANGS = ['en', 'tr', 'es', 'de', 'fr', 'pt', 'ar', 'ru', 'hi'];

export const RTL_LANGS = ['ar'];

export const LANG_NAMES = {
  en: 'English',
  tr: 'Türkçe',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  pt: 'Português',
  ar: 'العربية',
  ru: 'Русский',
  hi: 'हिन्दी',
};

export function detectLang() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('lang');
  if (fromUrl && SUPPORTED_LANGS.includes(fromUrl)) return fromUrl;
  // The landing page always opens in English by default. Visitors can still
  // switch language manually via the language selector (or a ?lang= link).
  return 'en';
}
