import { useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { collageMakerDicts } from '../i18n';
import { buildCollage, formatSize } from '../logic/collageMaker';

const LAYOUTS = [
  { cols: 2, rows: 1 },
  { cols: 1, rows: 2 },
  { cols: 2, rows: 2 },
  { cols: 3, rows: 2 },
  { cols: 3, rows: 3 },
];

export default function CollageMakerTool() {
  const t = useToolI18n(collageMakerDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [layout, setLayout] = useState(LAYOUTS[2]);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  function addFiles(list) {
    const images = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (!images.length) {
      setError(t('invalid_file'));
      return;
    }
    setError('');
    setResult(null);
    setFiles((prev) => [...prev, ...images]);
  }

  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleBuild() {
    setBusy(true);
    setError('');
    try {
      const { blob, fileName } = await buildCollage(files, layout.cols, layout.rows);
      setResult({ blobUrl: URL.createObjectURL(blob), fileName });
    } catch (err) {
      console.error(err);
      setError(t('generic_error'));
    } finally {
      setBusy(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.blobUrl;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function reset() {
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setFiles([]);
    setResult(null);
    setError('');
  }

  const slots = layout.cols * layout.rows;

  return (
    <section className="hero" id="tool">
      <div
        className="wrap"
        style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '56px', alignItems: 'center', width: '100%' }}
      >
        <div>
          <div className="format-chip" style={{ marginBottom: 20 }}>
            <span className="swap" />
            <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>{t('hero_eyebrow')}</span>
          </div>
          <h1>
            <span>{t('hero_title_a')}</span>
            <br />
            <span className="accent">{t('hero_title_b')}</span>
          </h1>
          <p className="lead" style={{ marginTop: 20 }}>
            {t('hero_lead')}
          </p>
        </div>

        <div className="tool-card">
          <div
            className={`dropzone${dragging ? ' drag' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
          >
            <div className="icon">IMG</div>
            <h3>{t('drop_title')}</h3>
            <p>{t('drop_sub')}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => e.target.files.length && addFiles(e.target.files)}
          />

          <div style={{ margin: '14px 0' }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
              {t('layout_label')}
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {LAYOUTS.map((l) => (
                <button
                  key={`${l.cols}x${l.rows}`}
                  type="button"
                  className={layout.cols === l.cols && layout.rows === l.rows ? 'btn btn-signal' : 'btn btn-ghost'}
                  onClick={() => setLayout(l)}
                >
                  {l.cols}×{l.rows}
                </button>
              ))}
            </div>
            <p className="status-line" style={{ marginTop: 8 }}>
              {t('slots_hint').replace('{count}', files.length).replace('{slots}', slots)}
            </p>
          </div>

          {files.map((f, idx) => (
            <div className="file-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }} key={idx}>
              <span className="name" style={{ flex: 1 }}>{idx + 1}. {f.name}</span>
              <span>{formatSize(f.size)}</span>
              <button type="button" className="btn btn-ghost" onClick={() => removeFile(idx)}>✕</button>
            </div>
          ))}

          {error && <p className="status-line">{error}</p>}

          {files.length > 0 && !result && (
            <div className="download-row">
              <button className="btn btn-signal" style={{ width: '100%' }} onClick={handleBuild} disabled={busy}>
                {busy ? t('building') : t('build_btn')}
              </button>
            </div>
          )}

          {result && (
            <div className="download-row">
              <button className="btn btn-signal" style={{ width: '100%' }} onClick={handleDownload}>
                {t('download_btn')}
              </button>
            </div>
          )}

          {files.length > 0 && (
            <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: 10 }} onClick={reset}>
              {t('start_over')}
            </button>
          )}

          <p className="footnote">{t('footnote')}</p>
        </div>
      </div>
    </section>
  );
}
