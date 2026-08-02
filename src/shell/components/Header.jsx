import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';
import LanguageSelector from './LanguageSelector';

// Single place that defines the top nav. Plain entries render as a plain
// link; anything with `items` renders as an Adobe-style dropdown panel, so
// the bar itself stays short no matter how many tools sit underneath it.
const NAV_GROUPS = [
  { type: 'link', path: '/', labelKey: 'nav_pdf_tools' },
  {
    type: 'dropdown',
    key: 'image',
    labelKey: 'nav_cat_image',
    items: [
      { path: '/photo-editor', labelKey: 'nav_photo_editor' },
      { path: '/image-compressor', labelKey: 'nav_image_compressor' },
      { path: '/batch-resize', labelKey: 'nav_batch_resize' },
      { path: '/rotate-image', labelKey: 'nav_rotate_image' },
      { path: '/brightness-contrast', labelKey: 'nav_brightness_contrast' },
      { path: '/image-watermark', labelKey: 'nav_image_watermark' },
      { path: '/collage-maker', labelKey: 'nav_collage_maker' },
      { path: '/exif-viewer', labelKey: 'nav_exif_viewer' },
      { path: '/favicon-generator', labelKey: 'nav_favicon_generator' },
      { path: '/color-palette-generator', labelKey: 'nav_color_palette_generator' },
      { path: '/background-remover', labelKey: 'nav_background_remover' },
      { path: '/heic-to-jpg', labelKey: 'nav_heic_to_jpg' },
      { path: '/webp-to-png', labelKey: 'nav_webp_to_png' },
      { path: '/png-to-webp', labelKey: 'nav_png_to_webp' },
    ],
  },
  {
    type: 'dropdown',
    key: 'video',
    labelKey: 'nav_cat_video',
    items: [
      { path: '/video-editor', labelKey: 'nav_video_editor' },
      { path: '/audio-trimmer', labelKey: 'nav_audio_trimmer' },
    ],
  },
  {
    type: 'dropdown',
    key: 'design',
    labelKey: 'nav_cat_design',
    items: [
      { path: '/vector-editor', labelKey: 'nav_vector_editor' },
      { path: '/social-post-maker', labelKey: 'nav_social_post_maker' },
    ],
  },
  {
    type: 'dropdown',
    key: 'other',
    labelKey: 'nav_cat_other',
    items: [
      { path: '/word-counter', labelKey: 'nav_word_counter' },
      { path: '/qr-code-generator', labelKey: 'nav_qr_code_generator' },
      { path: '/password-generator', labelKey: 'nav_password_generator' },
    ],
  },
];

export default function Header() {
  const { t, lang } = useI18n();
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null);
  const closeTimer = useRef(null);

  // Client-side navigation now (no full page reload), but the language
  // still travels in the URL as ?lang= so links stay shareable and the
  // right language loads on a hard refresh or direct visit.
  const withLang = (path) => `${path}?lang=${lang}`;

  // Close on outside click / Escape so the panel never gets stuck open.
  useEffect(() => {
    const onClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const openWithHover = (key) => {
    clearTimeout(closeTimer.current);
    setOpenMenu(key);
  };
  const closeWithDelay = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  };
  const toggleOnClick = (key) => {
    clearTimeout(closeTimer.current);
    setOpenMenu((cur) => (cur === key ? null : key));
  };

  return (
    <header>
      <div className="wrap">
        <nav ref={navRef}>
          <div className="logo">
            <span className="mark">
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                <path d="M10 1 L18 6 L10 11 L2 6 Z" fill="#fff" opacity="0.95" />
                <path d="M10 7 L18 12 L10 17 L2 12 Z" fill="#fff" opacity="0.6" />
              </svg>
            </span>
            itdocsy
          </div>

          <div className="nav-links">
            {NAV_GROUPS.map((group) => {
              if (group.type === 'link') {
                return group.path.startsWith('#') ? (
                  <a key={group.labelKey} href={group.path}>
                    {t(group.labelKey)}
                  </a>
                ) : (
                  <Link key={group.labelKey} to={withLang(group.path)}>
                    {t(group.labelKey)}
                  </Link>
                );
              }

              const isOpen = openMenu === group.key;
              return (
                <div
                  key={group.key}
                  className={`nav-drop${isOpen ? ' is-open' : ''}`}
                  onMouseEnter={() => openWithHover(group.key)}
                  onMouseLeave={closeWithDelay}
                >
                  <button
                    type="button"
                    className="nav-drop-trigger"
                    aria-expanded={isOpen}
                    onClick={() => toggleOnClick(group.key)}
                  >
                    {t(group.labelKey)}
                    <svg className="nav-drop-caret" width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" fill="none" />
                    </svg>
                  </button>
                  <div className="nav-drop-panel" role="menu">
                    {group.items.map((item) => (
                      <Link
                        key={item.path}
                        to={withLang(item.path)}
                        role="menuitem"
                        onClick={() => setOpenMenu(null)}
                      >
                        {t(item.labelKey)}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="nav-cta">
            <LanguageSelector />
          </div>
        </nav>
      </div>
    </header>
  );
}
