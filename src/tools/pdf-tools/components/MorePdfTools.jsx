import { Link } from 'react-router-dom';
import { useI18n } from '../../../shell/i18n/I18nContext';

// Static English copy for now (marketing chrome, not per-tool i18n),
// same convention as shell/components/PopularTools.jsx.
const TOOLS = [
  { path: '/merge-pdf', color: '#2F6FED', label: 'Merge PDF', desc: 'Combine multiple PDFs into one document' },
  { path: '/split-pdf', color: '#F2543D', label: 'Split PDF', desc: 'Break a PDF into one file per page' },
  { path: '/compress-pdf', color: '#0EA5A0', label: 'Compress PDF', desc: 'Shrink a PDF\u2019s file size' },
  { path: '/rotate-pdf', color: '#8B5CF6', label: 'Rotate PDF', desc: 'Fix the orientation of every page' },
  { path: '/watermark-pdf', color: '#E2A63B', label: 'Watermark PDF', desc: 'Stamp text across every page' },
  { path: '/protect-pdf', color: '#334155', label: 'Protect / Unlock PDF', desc: 'Add or remove a password' },
  { path: '/pdf-to-jpg', color: '#D6455D', label: 'PDF to JPG', desc: 'Turn every page into a JPG image' },
  { path: '/jpg-to-pdf', color: '#2FA36B', label: 'JPG to PDF', desc: 'Combine images into a single PDF' },
  { path: '/delete-pdf-pages', color: '#7C5CFC', label: 'Delete PDF Pages', desc: 'Remove specific pages from a PDF' },
  { path: '/pdf-to-png', color: '#E85A9C', label: 'PDF to PNG', desc: 'Turn every page into a transparent-ready PNG' },
  { path: '/image-to-pdf', color: '#3FAE5A', label: 'Image to PDF', desc: 'Combine JPG, PNG, or WebP images into a PDF' },
  { path: '/extract-pdf-pages', color: '#9C5CFC', label: 'Extract PDF Pages', desc: 'Pull specific pages into a new PDF' },
  { path: '/add-page-numbers', color: '#2FA3D6', label: 'Add Page Numbers', desc: 'Stamp page numbers onto every page' },
  { path: '/edit-pdf', color: '#EF6C5C', label: 'Edit PDF', desc: 'Click anywhere on a page to add text' },
  { path: '/word-to-pdf', color: '#2F6FED', label: 'Word to PDF', desc: 'Convert a .docx file into a PDF' },
  { path: '/add-blank-page', color: '#6C8CFF', label: 'Add PDF Page', desc: 'Insert blank pages anywhere in a PDF' },
  { path: '/reorder-pdf-pages', color: '#0FA36B', label: 'Reorder PDF Pages', desc: 'Move pages into the order you need' },
  { path: '/sign-pdf', color: '#C2483D', label: 'Sign PDF', desc: 'Draw or type a signature and place it on any page' },
  { path: '/pdf-metadata-editor', color: '#5C7CFC', label: 'PDF Metadata Editor', desc: 'View and edit title, author, subject, and keywords' },
  { path: '/grayscale-pdf', color: '#6B7280', label: 'Grayscale PDF', desc: 'Strip the color from every page of a PDF' },
  { path: '/pdf-info', color: '#0E9488', label: 'PDF Info', desc: 'See page count, size, version, and metadata at a glance' },
  { path: '/pdf-to-word', color: '#2F6FED', label: 'PDF to Word', desc: 'Convert a PDF into an editable Word document' },
  { path: '/pdf-to-excel', color: '#1D6F42', label: 'PDF to Excel', desc: 'Pull tables and text out of a PDF into an .xlsx file' },
  { path: '/excel-to-pdf', color: '#107C41', label: 'Excel to PDF', desc: 'Turn a spreadsheet into a clean, shareable PDF' },
  { path: '/redact-pdf', color: '#1F2937', label: 'Redact PDF', desc: 'Black out sensitive text and images for good' },
  { path: '/fill-pdf-form', color: '#2F6FED', label: 'Fill PDF Form', desc: 'Type into every field and download the result' },
  { path: '/compare-pdf', color: '#EA5C2B', label: 'Compare PDF', desc: 'See exactly what changed between two versions' },
  { path: '/pdf-to-powerpoint', color: '#D24625', label: 'PDF to PowerPoint', desc: 'Turn each page of a PDF into an editable slide' },
  { path: '/powerpoint-to-pdf', color: '#B8391D', label: 'PowerPoint to PDF', desc: 'Convert a .pptx presentation into a shareable PDF' },
  { path: '/pdf-to-text', color: '#475569', label: 'PDF to Text', desc: 'Extract every word from a PDF into a plain .txt file' },
];

export default function MorePdfTools() {
  const { lang } = useI18n();
  const withLang = (path) => `${path}?lang=${lang}`;

  return (
    <section className="popular">
      <div className="wrap">
        <div className="section-head">
          <h2>More PDF Tools</h2>
          <p>Organize, secure, and clean up your PDFs — all processed on your own device.</p>
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
