import { useEffect, useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { imageWatermarkDicts } from '../i18n';
import { previewWatermark, applyWatermark, formatSize } from '../logic/imageWatermark';

const POSITIONS = ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'];

export default function ImageWatermarkTool() {
  const t = useToolI18n(imageWatermarkDicts);
  const fileInputRef = useRef(null);
  const debounceRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [text, setText] = useState('itdocsy');
  const [position, setPosition] = useState('bottom-right');
  const [opacity, setOpacity] = useState(0.6);
  const [fontSize, setFontSize] = useState(6);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const opts = { text, position, opacity, fontSize };

  useEffect(() => {
    if (!file) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      previewWatermark(file, opts).then(setPreviewUrl).catch(() => {});
    }, 150);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, text, position, opacity, fontSize]);

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

  async function handleApply() {
    setBusy(true);
    setError('');
    try {
      const { blob, fileName } = await applyWatermark(file, opts);
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
    setPreviewUrl(null);
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
            <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: 10, margin: '10px 0' }} />
          )}

          {file && !result && (
            <div style={{ margin: '10px 0 16px' }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
                {t('text_label')}
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, marginBottom: 14 }}
              />

              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
                {t('position_label')}
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, marginBottom: 14 }}
              >
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{t(`pos_${p.replace('-', '_')}`)}</option>
                ))}
              </select>

              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
                {t('opacity_label')}: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                style={{ width: '100%', marginBottom: 14 }}
              />

              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
                {t('size_label')}
              </label>
              <input
                type="range"
                min="2"
                max="14"
                step="0.5"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
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
