import { useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { backgroundRemoverDicts } from '../i18n';
import { removeImageBackground, formatSize } from '../logic/backgroundRemover';

// Repeating checkerboard so a transparent PNG result is actually legible in
// the preview, instead of just looking like an empty box.
const CHECKER_BG = {
  backgroundImage:
    'linear-gradient(45deg, #d8dbe0 25%, transparent 25%), linear-gradient(-45deg, #d8dbe0 25%, transparent 25%), ' +
    'linear-gradient(45deg, transparent 75%, #d8dbe0 75%), linear-gradient(-45deg, transparent 75%, #d8dbe0 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
};

export default function BackgroundRemoverTool() {
  const t = useToolI18n(backgroundRemoverDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  function pickFile(f) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError(t('invalid_file'));
      return;
    }
    setError('');
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setProgress(0);
  }

  async function handleRemove() {
    setBusy(true);
    setError('');
    setProgress(0);
    try {
      const { blob, fileName, originalSize, newSize } = await removeImageBackground(file, setProgress);
      setResult({ blobUrl: URL.createObjectURL(blob), fileName, originalSize, newSize });
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError('');
    setProgress(0);
  }

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
          {!file && (
            <div
              className={`dropzone${dragging ? ' drag' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) pickFile(f);
              }}
            >
              <div className="icon">IMG</div>
              <h3>{t('drop_title')}</h3>
              <p>{t('drop_sub')}</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && pickFile(e.target.files[0])}
          />

          {file && (
            <div className="file-row" style={{ display: 'flex' }}>
              <span className="name">{file.name}</span>
              <span>{formatSize(file.size)}</span>
            </div>
          )}

          {previewUrl && !result && (
            <div style={{ borderRadius: 10, overflow: 'hidden', margin: '14px 0' }}>
              <img src={previewUrl} alt="" style={{ width: '100%', display: 'block', maxHeight: 260, objectFit: 'contain', background: '#f4f5f7' }} />
            </div>
          )}

          {result && (
            <div style={{ borderRadius: 10, overflow: 'hidden', margin: '14px 0', ...CHECKER_BG }}>
              <img src={result.blobUrl} alt="" style={{ width: '100%', display: 'block', maxHeight: 260, objectFit: 'contain' }} />
            </div>
          )}

          {error && <p className="status-line">{error}</p>}

          {busy && (
            <div className="progress-bar">
              <div style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          )}

          {file && !result && (
            <div className="download-row">
              <button className="btn btn-signal" style={{ width: '100%' }} onClick={handleRemove} disabled={busy}>
                {busy ? t('removing') : t('remove_btn')}
              </button>
            </div>
          )}

          {result && (
            <>
              <p className="status-line">
                {formatSize(result.originalSize)} → {formatSize(result.newSize)}
              </p>
              <div className="download-row">
                <button className="btn btn-signal" style={{ width: '100%' }} onClick={handleDownload}>
                  {t('download_btn')}
                </button>
              </div>
            </>
          )}

          {file && (
            <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: 10 }} onClick={reset}>
              {t('choose_another')}
            </button>
          )}

          <p className="footnote">{t('footnote')}</p>
        </div>
      </div>
    </section>
  );
}
