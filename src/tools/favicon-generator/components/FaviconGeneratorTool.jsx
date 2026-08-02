import { useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { faviconGeneratorDicts } from '../i18n';
import { generateFavicons } from '../logic/faviconGenerator';

export default function FaviconGeneratorTool() {
  const t = useToolI18n(faviconGeneratorDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function pickFile(f) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError(t('invalid_file'));
      return;
    }
    setError('');
    setFile(f);
    setResult(null);
    setBusy(true);
    try {
      const { previews, zipBlob } = await generateFavicons(f);
      setResult({ previews, zipUrl: URL.createObjectURL(zipBlob) });
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
    a.href = result.zipUrl;
    a.download = 'favicons.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function reset() {
    if (result?.zipUrl) URL.revokeObjectURL(result.zipUrl);
    setFile(null);
    setResult(null);
    setError('');
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
            </div>
          )}

          {busy && (
            <p className="footnote" style={{ textAlign: 'center', margin: '16px 0' }}>{t('generating')}</p>
          )}

          {error && <p className="status-line">{error}</p>}

          {result && !busy && (
            <>
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '14px 0 8px' }}>{t('preview_title')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', margin: '4px 0 16px' }}>
                {result.previews.map((p) => (
                  <div key={p.fileName} style={{ textAlign: 'center' }}>
                    <img
                      src={p.dataUrl}
                      alt={`${p.size}x${p.size}`}
                      width={Math.min(p.size, 64)}
                      height={Math.min(p.size, 64)}
                      style={{ borderRadius: 6, border: '1px solid var(--border, #e5e5e5)', background: '#fff' }}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{p.size}px</div>
                  </div>
                ))}
              </div>

              <div className="download-row">
                <button className="btn btn-signal" style={{ width: '100%' }} onClick={handleDownload}>
                  {t('download_all_btn')}
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
