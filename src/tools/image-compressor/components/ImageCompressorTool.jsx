import { useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { imageCompressorDicts } from '../i18n';
import { compressImage, formatSize } from '../logic/imageCompressor';

export default function ImageCompressorTool() {
  const t = useToolI18n(imageCompressorDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(0.7);
  const [maxDimension, setMaxDimension] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  function pickFile(f) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError(t('invalid_file'));
      return;
    }
    setError('');
    setFile(f);
    setResult(null);
  }

  async function handleCompress() {
    setBusy(true);
    setError('');
    try {
      const { blob, fileName, originalSize, newSize } = await compressImage(file, quality, maxDimension);
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
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setFile(null);
    setResult(null);
    setError('');
  }

  const savedPct = result ? Math.round((1 - result.newSize / result.originalSize) * 100) : null;

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

          {file && !result && (
            <div style={{ margin: '16px 0' }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
                {t('quality_label')}: {Math.round(quality * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                style={{ width: '100%' }}
              />

              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', margin: '14px 0 6px' }}>
                {t('max_dimension_label')}
              </label>
              <select
                value={maxDimension}
                onChange={(e) => setMaxDimension(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8 }}
              >
                <option value={0}>{t('keep_original')}</option>
                <option value={3840}>3840px (4K)</option>
                <option value={1920}>1920px</option>
                <option value={1280}>1280px</option>
                <option value={800}>800px</option>
              </select>
            </div>
          )}

          {error && <p className="status-line">{error}</p>}

          {file && !result && (
            <div className="download-row">
              <button className="btn btn-signal" style={{ width: '100%' }} onClick={handleCompress} disabled={busy}>
                {busy ? t('compressing') : t('compress_btn')}
              </button>
            </div>
          )}

          {result && (
            <>
              <p className="status-line">
                {formatSize(result.originalSize)} → {formatSize(result.newSize)}
                {savedPct > 0 ? ` (\u2212${savedPct}%)` : ''}
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
