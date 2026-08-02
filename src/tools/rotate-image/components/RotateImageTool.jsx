import { useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { rotateImageDicts } from '../i18n';
import { rotateImage, formatSize } from '../logic/rotateImage';

export default function RotateImageTool() {
  const t = useToolI18n(rotateImageDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [degrees, setDegrees] = useState(90);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
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

  async function handleApply() {
    setBusy(true);
    setError('');
    try {
      const { blob, fileName } = await rotateImage(file, degrees, { flipH, flipV });
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
    setDegrees(90);
    setFlipH(false);
    setFlipV(false);
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

          {file && !result && (
            <div style={{ margin: '16px 0' }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)', marginBottom: 6 }}>
                {t('rotation_label')}
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[0, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    className={degrees === deg ? 'btn btn-signal' : 'btn btn-ghost'}
                    style={{ flex: 1 }}
                    onClick={() => setDegrees(deg)}
                  >
                    {deg}°
                  </button>
                ))}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input type="checkbox" checked={flipH} onChange={(e) => setFlipH(e.target.checked)} />
                {t('flip_horizontal')}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={flipV} onChange={(e) => setFlipV(e.target.checked)} />
                {t('flip_vertical')}
              </label>
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
