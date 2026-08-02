import { useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { pdfToTextDicts } from '../i18n';
import { convertPdfToText, formatSize } from '../logic/pdfToText';

export default function PdfToTextTool() {
  const t = useToolI18n(pdfToTextDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(f) {
    if (!f) return;
    if (f.type !== 'application/pdf') { setError(t('invalid_file')); return; }
    setError(''); setFile(f); setResult(null); setProgress(0); setBusy(true);
    setStatus(t('status_reading').replace('{current}', 0).replace('{total}', '?'));
    try {
      const { blob, fileName } = await convertPdfToText(f, (current, total) => {
        setProgress(Math.round((current / total) * 100));
        setStatus(t('status_reading').replace('{current}', current).replace('{total}', total));
      });
      setProgress(100);
      setStatus(t('status_done'));
      setResult({ blobUrl: URL.createObjectURL(blob), fileName });
    } catch (err) {
      console.error(err); setError(t('generic_error'));
    } finally { setBusy(false); }
  }

  function handleDownload() {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.blobUrl; a.download = result.fileName;
    document.body.appendChild(a); a.click(); a.remove();
  }

  function reset() {
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setFile(null); setResult(null); setError(''); setBusy(false); setStatus(''); setProgress(0);
  }

  return (
    <section className="pdf-ws" id="tool">
      <div className="pdf-ws-header">
        <div className="wrap">
          <div className="format-chip" style={{ marginBottom: 16 }}>
            <span className="swap" />
            <span style={{ fontWeight: 500, color: 'var(--hero-text-2)' }}>{t('hero_eyebrow')}</span>
          </div>
          <h1>{t('hero_title_a')} <span className="accent">{t('hero_title_b')}</span></h1>
          <p className="lead" style={{ marginTop: 14 }}>{t('hero_lead')}</p>
        </div>
      </div>

      <div className="pdf-ws-body">
        <div className="wrap">
          <div className="pdf-ws-card">
            <div className="pdf-ws-grid">
              <div className="pdf-ws-left">
                <div className="pdf-ws-panel-label">📂 Dosya Yükleme Alanı</div>
                {!file ? (
                  <div
                    className={`pdf-ws-dropzone${dragging ? ' drag' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  >
                    <div className="icon">PDF</div>
                    <h3>{t('drop_title')}</h3>
                    <p>{t('drop_sub')}</p>
                  </div>
                ) : (
                  <div className="pdf-ws-file-row">
                    <div className="pdf-ws-file-ic">PDF</div>
                    <div className="pdf-ws-file-meta">
                      <div className="pdf-ws-file-name">{file.name}</div>
                      <div className="pdf-ws-file-size">{formatSize(file.size)}</div>
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,application/pdf"
                  style={{ display: 'none' }} onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
              </div>

              <div className="pdf-ws-right">
                <div className="pdf-ws-panel-label">Metin Önizleme</div>
                <div className="pdf-ws-preview">
                  {!result ? (
                    <div className="pdf-ws-preview-empty">
                      <div className="icon">TXT</div>
                      <p>PDF dosyası yükleyin</p>
                    </div>
                  ) : (
                    <div className="pdf-ws-page-item">
                      <div className="pdf-ws-page-thumb" />
                      <span className="pdf-ws-page-label">{result.fileName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(busy || status) && (
              <div className="pdf-ws-progress">
                {busy && <div className="progress-bar"><div style={{ width: `${progress || 5}%` }} /></div>}
                <p className="status-line">{error || status}</p>
              </div>
            )}
            {!status && error && <p className="status-line">{error}</p>}

            <div className="pdf-ws-footer">
              {result && <button className="btn btn-signal pdf-ws-primary" onClick={handleDownload}>{t('download_btn')}</button>}
              {file && <button type="button" className="btn btn-ghost pdf-ws-secondary" onClick={reset}>{t('choose_another')}</button>}
              <p className="footnote">{t('footnote')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
