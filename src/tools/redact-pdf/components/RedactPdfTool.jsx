import { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { redactPdfDicts } from '../i18n';
import { loadPdfForPreview, renderPageToCanvas, applyRedactions, formatSize } from '../logic/redactPdf';

let boxIdSeq = 0;

export default function RedactPdfTool() {
  const t = useToolI18n(redactPdfDicts);
  const location = useLocation();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);

  const [boxes, setBoxes] = useState([]); // { id, page, xRatio, yRatio, widthRatio, heightRatio }
  const [draftBox, setDraftBox] = useState(null); // in-progress drag, stage px
  const drawStartRef = useRef(null);

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
    setBoxes([]);
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

  useEffect(() => {
    const incoming = location.state?.file;
    if (incoming) pickFile(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    await renderPageToCanvas(pdfDoc, pageNumber, canvasRef.current, 1.4);
  }, [pdfDoc, pageNumber]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // ---- drag-to-draw a redaction box --------------------------------------

  function stagePoint(e) {
    const rect = stageRef.current.getBoundingClientRect();
    return {
      x: Math.min(Math.max(e.clientX - rect.left, 0), rect.width),
      y: Math.min(Math.max(e.clientY - rect.top, 0), rect.height),
      rectWidth: rect.width,
      rectHeight: rect.height,
    };
  }

  function handleStageMouseDown(e) {
    if (!file) return;
    const p = stagePoint(e);
    drawStartRef.current = p;
    setDraftBox({ x: p.x, y: p.y, width: 0, height: 0 });
  }

  function handleStageMouseMove(e) {
    if (!drawStartRef.current) return;
    const start = drawStartRef.current;
    const p = stagePoint(e);
    setDraftBox({
      x: Math.min(start.x, p.x),
      y: Math.min(start.y, p.y),
      width: Math.abs(p.x - start.x),
      height: Math.abs(p.y - start.y),
    });
  }

  function handleStageMouseUp(e) {
    if (!drawStartRef.current) return;
    const start = drawStartRef.current;
    const p = stagePoint(e);
    drawStartRef.current = null;

    const width = Math.abs(p.x - start.x);
    const height = Math.abs(p.y - start.y);
    setDraftBox(null);
    if (width < 6 || height < 6) return; // ignore accidental clicks/tiny drags

    const rect = stageRef.current.getBoundingClientRect();
    const id = ++boxIdSeq;
    setBoxes((prev) => [
      ...prev,
      {
        id,
        page: pageNumber,
        xRatio: Math.min(start.x, p.x) / rect.width,
        yRatio: Math.min(start.y, p.y) / rect.height,
        widthRatio: width / rect.width,
        heightRatio: height / rect.height,
      },
    ]);
  }

  function removeBox(id) {
    setBoxes((prev) => prev.filter((b) => b.id !== id));
  }

  async function handleApply() {
    if (boxes.length === 0) {
      setError(t('need_box'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { blob, fileName } = await applyRedactions(file, boxes, numPages);
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
    setBoxes([]);
    setDraftBox(null);
    setResult(null);
    setError('');
  }

  const pageBoxes = boxes.filter((b) => b.page === pageNumber);
  const totalBoxes = boxes.length;

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
                <div className="pdf-editor-card-title">{t('boxes_title')}</div>
                <p className="pdf-editor-hint" style={{ marginTop: 0 }}>{t('drag_hint')}</p>
                <p className="pdf-editor-hint">
                  {totalBoxes === 0 ? t('no_boxes_yet') : t('boxes_count').replace('{n}', totalBoxes)}
                </p>
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
                <span className="hint">{t('drag_hint')}</span>
              </div>
              <div className="pdf-editor-viewer-stage-outer">
                <div
                  ref={stageRef}
                  className="pdf-editor-stage"
                  style={{ cursor: 'crosshair' }}
                  onMouseDown={handleStageMouseDown}
                  onMouseMove={handleStageMouseMove}
                  onMouseUp={handleStageMouseUp}
                  onMouseLeave={() => { drawStartRef.current = null; setDraftBox(null); }}
                >
                  <canvas ref={canvasRef} />
                  {pageBoxes.map((b) => (
                    <div
                      key={b.id}
                      className="pdf-editor-redact-box"
                      style={{
                        left: `${b.xRatio * 100}%`,
                        top: `${b.yRatio * 100}%`,
                        width: `${b.widthRatio * 100}%`,
                        height: `${b.heightRatio * 100}%`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeBox(b.id); }}
                        className="pdf-editor-mark-del"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {draftBox && (
                    <div
                      className="pdf-editor-redact-box pdf-editor-redact-draft"
                      style={{
                        left: draftBox.x,
                        top: draftBox.y,
                        width: draftBox.width,
                        height: draftBox.height,
                      }}
                    />
                  )}
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
