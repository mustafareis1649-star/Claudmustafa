import { useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { batchResizeDicts } from '../i18n';
import { batchResize, formatSize } from '../logic/batchResize';

export default function BatchResizeTool() {
  const t = useToolI18n(batchResizeDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { blobUrl, fileName }
  const [busy, setBusy] = useState(false);

  function handleFiles(fileList) {
    const images = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!images.length) {
      setError(t('invalid_file'));
      return;
    }
    setError('');
    setResult(null);
    setFiles(images);
  }

  async function handleRun() {
    if (!files.length) return;
    setBusy(true);
    setError('');
    setProgress(0);
    try {
      const { blob, fileName } = await batchResize(files, Number(width), Number(height), (current, total) => {
        setProgress(Math.round((current / total) * 100));
        setStatus(t('status_processing').replace('{current}', current).replace('{total}', total));
      });
      setStatus(t('status_done'));
      const blobUrl = URL.createObjectURL(blob);
      setResult({ blobUrl, fileName });
    } catch (err) {
      console.error(err);
      setError(t('resize_error'));
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
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
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
            onChange={(e) => e.target.files.length && handleFiles(e.target.files)}
          />

          {files.length > 0 && (
            <div className="file-row" style={{ display: 'flex' }}>
              <span className="name">{t('files_selected').replace('{count}', files.length)}</span>
              <span>{formatSize(files.reduce((sum, f) => sum + f.size, 0))}</span>
            </div>
          )}

          {files.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)' }}>{t('width_label')}</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-2)' }}>{t('height_label')}</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="download-row">
              <button className="btn btn-signal" style={{ width: '100%' }} onClick={handleRun} disabled={busy}>
                {busy ? t('resizing_btn') : t('resize_btn')}
              </button>
            </div>
          )}

          {busy && (
            <div>
              <div className="progress-bar">
                <div style={{ width: `${progress}%` }} />
              </div>
              <p className="status-line">{status}</p>
            </div>
          )}

          {error && <p className="status-line">{error}</p>}

          {result && (
            <div className="download-row">
              <button className="btn btn-signal" style={{ width: '100%' }} onClick={handleDownload}>
                {t('download_btn')}
              </button>
            </div>
          )}

          <p className="footnote">{t('footnote')}</p>
        </div>
      </div>
    </section>
  );
}
