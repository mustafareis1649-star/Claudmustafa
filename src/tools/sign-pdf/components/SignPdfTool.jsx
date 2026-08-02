import { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { signPdfDicts } from '../i18n';
import { loadPdfForPreview, renderPageToCanvas, applySignaturesToPdf, formatSize } from '../logic/signPdf';

let placementIdSeq = 0;
const SIGNATURE_FONT = "italic 64px 'Segoe Script', 'Brush Script MT', 'Bradley Hand', cursive";

export default function SignPdfTool() {
  const t = useToolI18n(signPdfDicts);
  const location = useLocation();
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null); // PDF page preview
  const stageRef = useRef(null);
  const padRef = useRef(null); // signature drawing pad

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const [sigMode, setSigMode] = useState('draw'); // 'draw' | 'type'
  const [typedText, setTypedText] = useState('');
  const [signature, setSignature] = useState(null); // { dataUrl, aspectRatio }
  const [hasDrawing, setHasDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const bboxRef = useRef(null); // { minX, minY, maxX, maxY } in pad canvas px
  const lastPointRef = useRef(null);

  const [sizeRatio, setSizeRatio] = useState(0.28); // signature width as ratio of page width
  const [placements, setPlacements] = useState([]); // { id, page, xRatio, yRatio, widthRatio, aspectRatio, dataUrl }
  const [activePlacementId, setActivePlacementId] = useState(null);

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
    setPlacements([]);
    setActivePlacementId(null);
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

  // If the homepage workspace already had a PDF loaded and the visitor
  // clicked "Sign" there, the file arrives via router state instead of
  // making them upload it again.
  useEffect(() => {
    const incoming = location.state?.file;
    if (incoming) pickFile(incoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    const size = await renderPageToCanvas(pdfDoc, pageNumber, canvasRef.current, 1.4);
    setCanvasSize(size);
  }, [pdfDoc, pageNumber]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // ---- signature drawing pad -------------------------------------------

  function padPoint(e) {
    const rect = padRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDraw(e) {
    e.preventDefault();
    const p = padPoint(e);
    isDrawingRef.current = true;
    lastPointRef.current = p;
    bboxRef.current = bboxRef.current
      ? bboxRef.current
      : { minX: p.x, minY: p.y, maxX: p.x, maxY: p.y };
    setHasDrawing(true);
  }

  function moveDraw(e) {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const p = padPoint(e);
    const ctx = padRef.current.getContext('2d');
    ctx.strokeStyle = '#12213a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;

    const b = bboxRef.current;
    b.minX = Math.min(b.minX, p.x);
    b.minY = Math.min(b.minY, p.y);
    b.maxX = Math.max(b.maxX, p.x);
    b.maxY = Math.max(b.maxY, p.y);
  }

  function endDraw() {
    isDrawingRef.current = false;
  }

  function clearPad() {
    const canvas = padRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    bboxRef.current = null;
    setHasDrawing(false);
  }

  function useDrawnSignature() {
    const canvas = padRef.current;
    if (!canvas || !bboxRef.current) return;
    const pad = 10;
    const b = bboxRef.current;
    const sx = Math.max(0, b.minX - pad);
    const sy = Math.max(0, b.minY - pad);
    const sw = Math.min(canvas.width, b.maxX + pad) - sx;
    const sh = Math.min(canvas.height, b.maxY + pad) - sy;

    const out = document.createElement('canvas');
    out.width = sw;
    out.height = sh;
    out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    setSignature({ dataUrl: out.toDataURL('image/png'), aspectRatio: sw / sh });
  }

  // ---- typed signature ---------------------------------------------------

  function useTypedSignature() {
    const text = typedText.trim();
    if (!text) return;
    const fontSize = 64;
    const measure = document.createElement('canvas').getContext('2d');
    measure.font = SIGNATURE_FONT;
    const textWidth = Math.max(measure.measureText(text).width, 20);
    const padX = fontSize * 0.3;
    const padY = fontSize * 0.45;

    const canvas = document.createElement('canvas');
    canvas.width = textWidth + padX * 2;
    canvas.height = fontSize + padY * 2;
    const ctx = canvas.getContext('2d');
    ctx.font = SIGNATURE_FONT;
    ctx.fillStyle = '#12213a';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, padX, canvas.height / 2);

    setSignature({ dataUrl: canvas.toDataURL('image/png'), aspectRatio: canvas.width / canvas.height });
  }

  function clearSignature() {
    setSignature(null);
  }

  // ---- placing the signature on the page ---------------------------------

  function handleStageClick(e) {
    if (!signature || !canvasSize.width) return;
    const rect = stageRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;
    const id = ++placementIdSeq;
    setPlacements((prev) => [
      ...prev,
      {
        id,
        page: pageNumber,
        xRatio,
        yRatio,
        widthRatio: sizeRatio,
        aspectRatio: signature.aspectRatio,
        dataUrl: signature.dataUrl,
      },
    ]);
    setActivePlacementId(id);
  }

  function removePlacement(id) {
    setPlacements((prev) => prev.filter((p) => p.id !== id));
    if (activePlacementId === id) setActivePlacementId(null);
  }

  async function handleApply() {
    if (placements.length === 0) {
      setError(t('need_placement'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { blob, fileName } = await applySignaturesToPdf(file, placements);
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
    setPlacements([]);
    setActivePlacementId(null);
    setSignature(null);
    setTypedText('');
    clearPad();
    setResult(null);
    setError('');
  }

  const pagePlacements = placements.filter((p) => p.page === pageNumber);

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
                {!signature && (
                  <div>
                    <div className="pdf-editor-card-title">{t('signature_ready')}</div>
                    <div className="pdf-editor-tabs">
                      <button
                        type="button"
                        className={`pdf-editor-tab${sigMode === 'draw' ? ' active' : ''}`}
                        onClick={() => setSigMode('draw')}
                      >
                        {t('tab_draw')}
                      </button>
                      <button
                        type="button"
                        className={`pdf-editor-tab${sigMode === 'type' ? ' active' : ''}`}
                        onClick={() => setSigMode('type')}
                      >
                        {t('tab_type')}
                      </button>
                    </div>

                    {sigMode === 'draw' && (
                      <div>
                        <canvas
                          ref={padRef}
                          width={400}
                          height={140}
                          className="pdf-editor-sigpad"
                          onMouseDown={startDraw}
                          onMouseMove={moveDraw}
                          onMouseUp={endDraw}
                          onMouseLeave={endDraw}
                          onTouchStart={startDraw}
                          onTouchMove={moveDraw}
                          onTouchEnd={endDraw}
                        />
                        <p className="pdf-editor-hint">{t('draw_hint')}</p>
                        <div className="pdf-editor-row" style={{ marginTop: 10 }}>
                          <button type="button" className="pdf-editor-btn pdf-editor-btn-ghost" onClick={clearPad} disabled={!hasDrawing}>
                            {t('clear_btn')}
                          </button>
                          <button type="button" className="pdf-editor-btn pdf-editor-btn-primary" onClick={useDrawnSignature} disabled={!hasDrawing}>
                            {t('use_signature_btn')}
                          </button>
                        </div>
                      </div>
                    )}

                    {sigMode === 'type' && (
                      <div>
                        <input
                          type="text"
                          value={typedText}
                          onChange={(e) => setTypedText(e.target.value)}
                          placeholder={t('type_placeholder')}
                          className="pdf-editor-siginput"
                        />
                        <button
                          type="button"
                          className="pdf-editor-btn pdf-editor-btn-primary"
                          style={{ marginTop: 10 }}
                          onClick={useTypedSignature}
                          disabled={!typedText.trim()}
                        >
                          {t('use_signature_btn')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {signature && (
                  <div>
                    <div className="pdf-editor-card-title">{t('signature_ready')}</div>
                    <div className="pdf-editor-sigpreview">
                      <img src={signature.dataUrl} alt="signature" style={{ maxHeight: 60 }} />
                    </div>

                    <div style={{ margin: '14px 0 6px', display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-2)' }}>
                      <span>{t('size_label')}</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.6}
                      step={0.01}
                      value={sizeRatio}
                      onChange={(e) => setSizeRatio(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />

                    <button type="button" className="pdf-editor-btn pdf-editor-btn-secondary" style={{ marginTop: 12 }} onClick={clearSignature}>
                      {t('change_signature')}
                    </button>
                    <p className="pdf-editor-hint" style={{ textAlign: 'center' }}>{t('click_hint')}</p>
                  </div>
                )}
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
                {signature && <span className="hint">{t('click_hint')}</span>}
              </div>
              <div className="pdf-editor-viewer-stage-outer">
                <div
                  ref={stageRef}
                  onClick={handleStageClick}
                  className="pdf-editor-stage"
                  style={{ cursor: signature ? 'crosshair' : 'default' }}
                >
                  <canvas ref={canvasRef} />
                  {pagePlacements.map((p) => (
                    <div
                      key={p.id}
                      onClick={(e) => { e.stopPropagation(); setActivePlacementId(p.id); }}
                      className="pdf-editor-mark"
                      style={{
                        left: `${p.xRatio * 100}%`,
                        top: `${p.yRatio * 100}%`,
                        width: `${p.widthRatio * 100}%`,
                        outline: activePlacementId === p.id ? '1px dashed #4F6EF7' : 'none',
                      }}
                    >
                      <img src={p.dataUrl} alt="signature" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removePlacement(p.id); }}
                        className="pdf-editor-mark-del"
                      >
                        ✕
                      </button>
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
