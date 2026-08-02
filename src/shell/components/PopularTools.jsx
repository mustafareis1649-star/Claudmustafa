import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nContext';

// Static English copy for now (this section is marketing chrome, not a
// per-tool i18n string) — links reuse the real routes registered in App.jsx.
const TOOLS = [
  { path: '/pdf-to-word', color: '#2F6FED', label: 'PDF to Word', desc: 'Convert PDF files to editable Word documents' },
  { path: '/photo-editor', color: '#8B5CF6', label: 'Photo Editor', desc: 'Crop, resize and touch up images in your browser' },
  { path: '/video-editor', color: '#F2543D', label: 'Video Editor', desc: 'Trim, crop and export video clips in seconds' },
  { path: '/audio-trimmer', color: '#0EA5A0', label: 'Audio Trimmer', desc: 'Cut and export the exact clip you need' },
  { path: '/batch-resize', color: '#E2A63B', label: 'Batch Resize', desc: 'Resize a whole folder of images at once' },
];

export default function PopularTools() {
  const { lang } = useI18n();
  const withLang = (path) => `${path}?lang=${lang}`;

  return (
    <section className="popular">
      <div className="wrap">
        <div className="section-head">
          <h2>Most Popular Tools</h2>
          <p>Jump straight into the tools people use every day.</p>
        </div>
        <div className="popular-grid">
          {TOOLS.map((tool) => (
            <Link className="tool-chip-card" to={withLang(tool.path)} key={tool.path}>
              <span className="ic" style={{ background: tool.color }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="3" width="16" height="18" rx="2" stroke="#fff" strokeWidth="1.6" fill="none" />
                  <path d="M8 8h8M8 12h8M8 16h5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <h4>{tool.label}</h4>
              <p>{tool.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
