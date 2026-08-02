import { useRef, useState, useEffect, useCallback } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { editPdfDicts } from '../i18n';
import { loadPdfForPreview, renderPageToCanvas, applyEditsToPdf, formatSize } from '../logic/editPdf';

let noteIdSeq = 0;

export default function EditPdfTool() {
  const t = useToolI18n(editPdfDicts);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [notes, setNotes] = useState([]); // { id, page, xRatio, yRatio, text }
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function pickFile(f) {
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError(t('invalid_file'));
      return;
    }
    setError('');
    setResult(null);
    setNotes([]);
    setActiveNoteId(null);
    try {
      const buf = await f.arrayBuffer();
      const pdf = await loadPdfForPreview(buf);
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setPageNumber(1);
      setFile(f);
    } catch (err) {
      console.error(err);
      setError(t('generic_error'));
    }
  }

  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    const size = await renderPageToCanvas(pdfDoc, pageNumber, canvasRef.current, 1.4);
    setCanvasSize(size);
  }, [pdfDoc, pageNumber]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  function handleStageClick(e) {
    if (!canvasSize.width) return;
    // Ignore clicks on an existing note (it stops propagation itself).
    const rect = stageRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;
    const id = ++noteIdSeq;
    setNotes((prev) => [...prev, { id, page: pageNumber, xRatio, yRatio, text: '' }]);
    setActiveNoteId(id);
  }

  function updateNoteText(id, text) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
  }

  function removeNote(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
  }

  async function handleApply() {
    const meaningful = notes.filter((n) => n.text.trim());
    if (meaningful.length === 0) {
      setError(t('need_text'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { blob, fileName } = await applyEditsToPdf(file, meaningful);
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
    setPdfDoc(null);
    setNumPages(0);
    setPageNumber(1);
    setNotes([]);
    setActiveNoteId(null);
    setResult(null);
    setError('');
  }

  const pageNotes = notes.filter((n) => n.page === pageNumber);

  return (
    <section className="pdf-editor" id="tool">
      <div className="pdf-editor-grid">
        <aside className="pdf-editor-sidebar">
          <div className="pdf-editor-brand">
            <div className="mark">PDF</div>
            <div className="pdf-editor-brand-text">
              <h1>{t('hero_title_a')} {t('hero_title_b')}</h1>
              <p>{t('hero_lead')}</p>
            </div>
          </div>

          {!file && (
            <div className="pdf-editor-card">
              <div className="pdf-editor-card-title">{t('hero_eyebrow')}</div>
              <div
                className={`pdf-editor-dropzone${dragging ? ' drag' : ''}`}
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
                <div className="icon">PDF</div>
                <h3>{t('drop_title')}</h3>
                <p>{t('drop_sub')}</p>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && pickFile(e.target.files[0])}
          />

          {file && (
            <>
              <div className="pdf-editor-card">
                <div className="pdf-editor-file">
                  <div className="file-ic">PDF</div>
                  <div className="file-meta">
                    <div className="fname">{file.name}</div>
                    <div className="fsize">{formatSize(file.size)}</div>
                  </div>
                </div>

                {numPages > 1 && (
                  <div className="pdf-editor-pagenav">
                    <button
                      type="button"
                      className="pg-btn"
                      disabled={pageNumber <= 1}
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    >
                      ←
                    </button>
                    <span className="pg-label">{t('page_of').replace('{n}', pageNumber).replace('{total}', numPages)}</span>
                    <button
                      type="button"
                      className="pg-btn"
                      disabled={pageNumber >= numPages}
                      onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                    >
                      →
                    </button>
                  </div>
                )}
              </div>

              <div className="pdf-editor-card">
                <div className="pdf-editor-card-title">{t('click_hint')}</div>
                <p className="pdf-editor-hint">{t('click_hint')}</p>
              </div>

              {error && <p className="pdf-editor-status">{error}</p>}

              <div className="pdf-editor-card">
                {!result && (
                  <button className="pdf-editor-btn pdf-editor-btn-primary" onClick={handleApply} disabled={busy}>
                    {busy ? t('applying') : t('apply_btn')}
                  </button>
                )}

                {result && (
                  <button className="pdf-editor-btn pdf-editor-btn-primary" onClick={handleDownload}>
                    {t('download_btn')}
                  </button>
                )}

                <button type="button" className="pdf-editor-btn pdf-editor-btn-ghost" style={{ marginTop: 10 }} onClick={reset}>
                  {t('choose_another')}
                </button>

                <p className="pdf-editor-hint" style={{ textAlign: 'center' }}>{t('footnote')}</p>
              </div>
            </>
          )}
        </aside>

        <div className="pdf-editor-viewer">
          {file ? (
            <>
              <div className="pdf-editor-viewer-toolbar">
                <span className="hint">{t('page_of').replace('{n}', pageNumber).replace('{total}', numPages || 1)}</span>
                <span className="hint">{t('click_hint')}</span>
              </div>
              <div className="pdf-editor-viewer-stage-outer">
                <div
                  ref={stageRef}
                  onClick={handleStageClick}
                  className="pdf-editor-stage"
                  style={{ cursor: 'text' }}
                >
                  <canvas ref={canvasRef} />
                  {pageNotes.map((n) => (
                    <div
                      key={n.id}
                      onClick={(e) => { e.stopPropagation(); setActiveNoteId(n.id); }}
                      className="pdf-editor-mark"
                      style={{
                        left: `${n.xRatio * 100}%`,
                        top: `${n.yRatio * 100}%`,
                        transform: 'translate(0, -2px)',
                        minWidth: 120,
                      }}
                    >
                      {activeNoteId === n.id ? (
                        <input
                          autoFocus
                          value={n.text}
                          onChange={(e) => updateNoteText(n.id, e.target.value)}
                          onBlur={() => { if (!n.text.trim()) removeNote(n.id); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') setActiveNoteId(null); }}
                          placeholder={t('note_placeholder')}
                          style={{
                            font: '16px/1.2 Helvetica, Arial, sans-serif',
                            padding: '2px 4px',
                            border: '1px dashed #4F6EF7',
                            background: 'rgba(79,110,247,0.06)',
                            minWidth: 140,
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            font: '16px/1.2 Helvetica, Arial, sans-serif',
                            color: '#1a1a1a',
                            padding: '2px 4px',
                            border: '1px dashed transparent',
                            whiteSpace: 'pre',
                          }}
                          onDoubleClick={(e) => { e.stopPropagation(); setActiveNoteId(n.id); }}
                        >
                          {n.text || t('note_placeholder')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="pdf-editor-empty">
              <div className="big-ic">PDF</div>
              <h3>{t('drop_title')}</h3>
              <p>{t('drop_sub')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
