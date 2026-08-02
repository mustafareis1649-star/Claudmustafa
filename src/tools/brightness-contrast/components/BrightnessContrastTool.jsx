import { useEffect, useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { brightnessContrastDicts } from '../i18n';
import { applyAdjust, formatSize } from '../logic/brightnessContrast';

export default function BrightnessContrastTool() {
  const t = useToolI18n(brightnessContrastDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pickFile(f) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError(t('invalid_file'));
      return;
    }
    setError('');
    setFile(f);
    setResult(null);
    setBrightness(0);
    setContrast(0);
  }

  async function handleApply() {
    setBusy(true);
    setError('');
    try {
      const { blob, fileName } = await applyAdjust(file, brightness, contrast);
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
    setFile(null);
    setResult(null);
    setError('');
    setBrightness(0);
    setContrast(0);
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

          {file && previewUrl && !result && (
            <img
              src={previewUrl}
              alt=""
              style={{
                width: '100%',
                borderRadius: 10,
                margin: '10px 0',
                filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`,
              }}
            />
          )}

          {file && !result && (
            <div style={{ margin: '10px 0 16px' }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
                {t('brightness_label')}: {brightness}
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                style={{ width: '100%' }}
              />

              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', margin: '14px 0 6px' }}>
                {t('contrast_label')}: {contrast}
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {error && <p className="status-line">{error}</p>}

          {file && !result && (
            <div className="download-row">
              <button className="btn btn-signal" style={{ width: '100%' }} onClick={handleApply} disabled={busy}>
                {busy ? t('applying') : t('apply_btn')}
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
