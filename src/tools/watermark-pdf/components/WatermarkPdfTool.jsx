import { useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { watermarkPdfDicts } from '../i18n';
import { watermarkPdf, formatSize } from '../logic/watermarkPdf';

export default function WatermarkPdfTool() {
  const t = useToolI18n(watermarkPdfDicts);
  const fileInputRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pageCount, setPageCount] = useState(null);

  async function pickFile(f) {
    if (!f) return;
    if (f.type !== 'application/pdf') { setError(t('invalid_file')); return; }
    setError(''); setFile(f); setResult(null); setPageCount(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      setPageCount(doc.getPageCount());
    } catch { /* ignore */ }
  }

  async function handleWatermark() {
    if (!text.trim()) { setError(t('need_text')); return; }
    setBusy(true); setError('');
    try {
      const { blob, fileName } = await watermarkPdf(file, text.trim());
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
    setFile(null); setResult(null); setError(''); setText(''); setPageCount(null);
  }

  const previewItems = pageCount ? Array.from({ length: Math.min(pageCount, 8) }, (_, i) => i + 1) : [];

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
                    onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) pickFile(f); }}
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
                      <div className="pdf-ws-file-size">{formatSize(file.size)}{pageCount ? ` · ${pageCount} sayfa` : ''}</div>
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }}
                  onChange={(e) => e.target.files[0] && pickFile(e.target.files[0])} />

                {file && !result && (
                  <div className="pdf-ws-controls">
                    <input type="text" className="pdf-ws-ctrl-input" value={text}
                      onChange={(e) => setText(e.target.value)} placeholder={t('text_placeholder')} />
                  </div>
                )}
              </div>

              <div className="pdf-ws-right">
                <div className="pdf-ws-panel-label">PDF Önizleme</div>
                <div className="pdf-ws-preview">
                  {previewItems.length === 0 ? (
                    <div className="pdf-ws-preview-empty">
                      <div className="icon">PDF</div>
                      <p>PDF dosyası yükleyin</p>
                    </div>
                  ) : (
                    previewItems.map((n) => (
                      <div key={n} className="pdf-ws-page-item">
                        <div className="pdf-ws-page-thumb" />
                        <span className="pdf-ws-page-label">Sayfa {n}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {error && <p className="status-line">{error}</p>}

            <div className="pdf-ws-footer">
              {result ? (
                <button className="btn btn-signal pdf-ws-primary" onClick={handleDownload}>{t('download_btn')}</button>
              ) : (file && !busy) ? (
                <button className="btn btn-signal pdf-ws-primary" onClick={handleWatermark} disabled={busy}>{busy ? t('applying') : t('apply_btn')}</button>
              ) : null}
              {file && <button type="button" className="btn btn-ghost pdf-ws-secondary" onClick={reset}>{t('choose_another')}</button>}
              <p className="footnote">{t('footnote')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
