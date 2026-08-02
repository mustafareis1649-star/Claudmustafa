import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { pdfToolsDicts } from '../i18n';
import { convertPdfToWord, formatSize } from '../logic/pdfToWord';
import { splitPdf } from '../../split-pdf/logic/splitPdf';
import { compressPdf } from '../../compress-pdf/logic/compressPdf';
import { rotatePdf } from '../../rotate-pdf/logic/rotatePdf';
import { watermarkPdf } from '../../watermark-pdf/logic/watermarkPdf';
import { protectPdf, unlockPdf } from '../../protect-pdf/logic/protectPdf';
import { addPageNumbers } from '../../add-page-numbers/logic/addPageNumbers';
import { deletePdfPages } from '../../delete-pdf-pages/logic/deletePdfPages';
import { extractPdfPages } from '../../extract-pdf-pages/logic/extractPdfPages';
import { reorderPdfPages } from '../../reorder-pdf-pages/logic/reorderPdfPages';
import { grayscalePdf } from '../../grayscale-pdf/logic/grayscalePdf';
import { addBlankPage } from '../../add-blank-page/logic/addBlankPage';
import { readMetadata, writeMetadata } from '../../pdf-metadata-editor/logic/pdfMetadataEditor';
import { getPdfInfo } from '../../pdf-info/logic/pdfInfo';
import { pdfToJpg } from '../../pdf-to-jpg/logic/pdfToJpg';
import { loadPdfForPreview, renderPageToCanvas } from '../../sign-pdf/logic/signPdf';

// Every PDF operation the homepage workspace can run on one loaded file.
// 'merge' and 'sign' are visual/multi-file experiences of their own — for
// those the loaded file is handed off to that tool's dedicated page via
// router state, so the visitor doesn't have to upload it a second time.
const OPS = [
  'word', 'merge', 'split', 'compress', 'sign', 'rotate', 'watermark',
  'protect', 'page_numbers', 'delete_pages', 'extract_pages', 'reorder_pages',
  'grayscale', 'blank_page', 'metadata', 'info', 'to_jpg',
];
const PASSTHROUGH_ROUTES = { merge: '/merge-pdf', sign: '/sign-pdf' };
// Ops where the page grid becomes something you click/drag, not just look at.
const INTERACTIVE_GRID_OPS = ['delete_pages', 'extract_pages', 'reorder_pages'];

export default function PdfWorkspaceTool() {
  const t = useToolI18n(pdfToolsDicts);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const canvasRefs = useRef([]);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [op, setOp] = useState('word');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null); // { blobUrl, fileName }

  // The actually-opened document: rendered page thumbnails, so the visitor
  // sees their real PDF instead of an abstract page-number field.
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbsReady, setThumbsReady] = useState(false);
  const [order, setOrder] = useState([]); // current page order, 0-based original indices
  const [markedDelete, setMarkedDelete] = useState(() => new Set());
  const [markedKeep, setMarkedKeep] = useState(() => new Set());
  const [dragIndex, setDragIndex] = useState(null);

  // per-op input state
  const [degrees, setDegrees] = useState(90);
  const [wmText, setWmText] = useState('');
  const [wmOpacity, setWmOpacity] = useState(0.25);
  const [level, setLevel] = useState('medium'); // shared by compress / grayscale / to_jpg
  const [protectMode, setProtectMode] = useState('protect'); // protect | unlock
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [numPosition, setNumPosition] = useState('bottom-center');
  const [numStartAt, setNumStartAt] = useState(1);
  const [blankPosition, setBlankPosition] = useState('end');
  const [blankAfter, setBlankAfter] = useState(1);
  const [meta, setMeta] = useState(null);
  const [info, setInfo] = useState(null);

  async function pickFile(f) {
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError(t('invalid_file'));
      return;
    }
    setError('');
    setResult(null);
    setMeta(null);
    setInfo(null);
    setStatus('');
    setProgress(0);
    setMarkedDelete(new Set());
    setMarkedKeep(new Set());
    setThumbsReady(false);
    setPdfDoc(null);
    setFile(f);
    try {
      const buf = await f.arrayBuffer();
      const doc = await loadPdfForPreview(buf);
      setPdfDoc(doc);
      setPageCount(doc.numPages);
      setOrder(Array.from({ length: doc.numPages }, (_, i) => i));
    } catch (err) {
      console.error(err);
      setError(t('generic_error'));
    }
  }

  // Renders every page to its thumbnail canvas once the document (and its
  // canvases) exist. Runs again if the page order changes so dragged
  // thumbnails keep showing the right page.
  useEffect(() => {
    if (!pdfDoc || !order.length) return;
    let cancelled = false;
    (async () => {
      setThumbsReady(false);
      for (let slot = 0; slot < order.length; slot++) {
        if (cancelled) return;
        const canvas = canvasRefs.current[slot];
        if (!canvas) continue;
        try {
          await renderPageToCanvas(pdfDoc, order[slot] + 1, canvas, 0.32);
        } catch (err) {
          console.error(err);
        }
      }
      if (!cancelled) setThumbsReady(true);
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, order]);

  function resetOpState() {
    setResult(null);
    setError('');
    setStatus('');
    setProgress(0);
  }

  function switchOp(nextOp) {
    if (PASSTHROUGH_ROUTES[nextOp]) {
      navigate(PASSTHROUGH_ROUTES[nextOp], { state: { file } });
      return;
    }
    setOp(nextOp);
    resetOpState();
  }

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      try {
        if (op === 'metadata' && !meta) {
          const m = await readMetadata(file);
          if (!cancelled) setMeta(m);
        }
        if (op === 'info' && !info) {
          const i = await getPdfInfo(file);
          if (!cancelled) setInfo(i);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(t('generic_error'));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [op, file]);

  function downloadBlob(blob, fileName) {
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setResult({ blobUrl: URL.createObjectURL(blob), fileName });
  }

  function onProgress(current, total) {
    setProgress(Math.round((current / total) * 100));
    setStatus(t('status_reading').replace('{current}', current).replace('{total}', total));
  }

  async function run(fn) {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      await fn();
    } catch (err) {
      console.error(err);
      setError(t('generic_error'));
    } finally {
      setBusy(false);
    }
  }

  const runWord = () => run(async () => {
    const { blob, fileName } = await convertPdfToWord(file, onProgress);
    setStatus(t('status_done'));
    downloadBlob(blob, fileName);
  });

  const runSplit = () => run(async () => {
    const { blob, fileName } = await splitPdf(file, onProgress);
    setStatus(t('status_done'));
    downloadBlob(blob, fileName);
  });

  const runCompress = () => run(async () => {
    const { blob, fileName } = await compressPdf(file, level, onProgress);
    setStatus(t('status_done'));
    downloadBlob(blob, fileName);
  });

  const runRotate = () => run(async () => {
    const { blob, fileName } = await rotatePdf(file, degrees);
    downloadBlob(blob, fileName);
  });

  const runWatermark = () => run(async () => {
    if (!wmText.trim()) { setError(t('wm_required')); return; }
    const { blob, fileName } = await watermarkPdf(file, wmText, { opacity: wmOpacity });
    downloadBlob(blob, fileName);
  });

  const runProtect = () => run(async () => {
    if (!password) { setError(t('password_required')); return; }
    if (protectMode === 'protect') {
      const { blob, fileName } = await protectPdf(file, password, password2 || undefined);
      downloadBlob(blob, fileName);
    } else {
      const { blob, fileName } = await unlockPdf(file, password);
      downloadBlob(blob, fileName);
    }
  });

  const runPageNumbers = () => run(async () => {
    const { blob, fileName } = await addPageNumbers(file, { position: numPosition, startAt: numStartAt });
    downloadBlob(blob, fileName);
  });

  const runDeletePages = () => run(async () => {
    if (!markedDelete.size) { setError(t('pick_pages_error')); return; }
    if (markedDelete.size >= pageCount) { setError(t('range_error')); return; }
    const { blob, fileName } = await deletePdfPages(file, markedDelete);
    downloadBlob(blob, fileName);
  });

  const runExtractPages = () => run(async () => {
    if (!markedKeep.size) { setError(t('pick_pages_error')); return; }
    const { blob, fileName } = await extractPdfPages(file, markedKeep);
    downloadBlob(blob, fileName);
  });

  const runReorderPages = () => run(async () => {
    const { blob, fileName } = await reorderPdfPages(file, order);
    downloadBlob(blob, fileName);
  });

  const runGrayscale = () => run(async () => {
    const { blob, fileName } = await grayscalePdf(file, level, onProgress);
    setStatus(t('status_done'));
    downloadBlob(blob, fileName);
  });

  const runBlankPage = () => run(async () => {
    const { blob, fileName } = await addBlankPage(file, { position: blankPosition, afterPage: blankAfter });
    downloadBlob(blob, fileName);
  });

  const runMetadataSave = () => run(async () => {
    const { blob, fileName } = await writeMetadata(file, meta);
    downloadBlob(blob, fileName);
  });

  const runToJpg = () => run(async () => {
    const { blob, fileName } = await pdfToJpg(file, level, onProgress);
    setStatus(t('status_done'));
    downloadBlob(blob, fileName);
  });

  function resetToNewFile() {
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    setFile(null);
    setResult(null);
    setError('');
    setPdfDoc(null);
    setPageCount(0);
    setOrder([]);
    setMeta(null);
    setInfo(null);
  }

  useEffect(() => () => { if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl); }, [result]);

  // ---- page grid interactions -------------------------------------------

  function toggleDelete(originalIdx) {
    setMarkedDelete((prev) => {
      const next = new Set(prev);
      next.has(originalIdx) ? next.delete(originalIdx) : next.add(originalIdx);
      return next;
    });
  }
  function toggleKeep(originalIdx) {
    setMarkedKeep((prev) => {
      const next = new Set(prev);
      next.has(originalIdx) ? next.delete(originalIdx) : next.add(originalIdx);
      return next;
    });
  }
  function onThumbClick(originalIdx) {
    if (op === 'delete_pages') toggleDelete(originalIdx);
    else if (op === 'extract_pages') toggleKeep(originalIdx);
  }
  function onThumbDragStart(slot) {
    if (op !== 'reorder_pages') return;
    setDragIndex(slot);
  }
  function onThumbDrop(slot) {
    if (op !== 'reorder_pages' || dragIndex === null) return;
    setOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(slot, 0, moved);
      return next;
    });
    setDragIndex(null);
  }

  const gridInteractive = INTERACTIVE_GRID_OPS.includes(op);

  return (
    <section className="hero" id="tool">
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: '56px', alignItems: 'center', width: '100%' }}>
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
          <p className="lead" style={{ marginTop: 20 }}>{t('hero_lead')}</p>
          <div className="stat-row">
            <div className="stat"><span>{t('stat1_num')}</span><span>{t('stat1_label')}</span></div>
            <div className="stat"><span>{t('stat2_num')}</span><span>{t('stat2_label')}</span></div>
            <div className="stat"><span>{t('stat3_num')}</span><span>{t('stat3_label')}</span></div>
          </div>
        </div>

        <div className="tool-card" style={file ? { maxWidth: 'none' } : undefined}>
          {!file && (
            <>
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
                <div className="icon">PDF</div>
                <h3>{t('drop_title')}</h3>
                <p>{t('drop_sub')}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files[0] && pickFile(e.target.files[0])}
              />
              {error && <p className="status-line">{error}</p>}
              <p className="footnote">{t('footnote')}</p>
            </>
          )}

          {file && (
            <div style={{ padding: 8 }}>
              <div className="file-row" style={{ margin: '0 0 10px' }}>
                <span className="name">{file.name}</span>
                <span>{formatSize(file.size)}{pageCount ? ` · ${pageCount} ${t('pages_word')}` : ''}</span>
              </div>

              <div className="op-tabs">
                {OPS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    className={`op-tab${op === o ? ' active' : ''}`}
                    onClick={() => switchOp(o)}
                  >
                    {t(`op_${o}`)}
                  </button>
                ))}
              </div>

              {/* The actually-opened PDF: real page thumbnails, not just a
                  filename. Clickable/draggable for the ops that need it. */}
              {pageCount > 0 && (
                <div style={{ margin: '0 8px 12px' }}>
                  {gridInteractive && (
                    <p className="status-line" style={{ margin: '0 0 8px' }}>
                      {op === 'delete_pages' && t('grid_hint_delete')}
                      {op === 'extract_pages' && t('grid_hint_keep')}
                      {op === 'reorder_pages' && t('grid_hint_reorder')}
                    </p>
                  )}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
                      gap: 10,
                      maxHeight: 300,
                      overflowY: 'auto',
                      padding: 4,
                      border: '1px solid var(--line)',
                      borderRadius: 9,
                      background: 'var(--paper)',
                    }}
                  >
                    {order.map((originalIdx, slot) => {
                      const isDelete = markedDelete.has(originalIdx);
                      const isKeep = markedKeep.has(originalIdx);
                      return (
                        <div
                          key={originalIdx}
                          draggable={op === 'reorder_pages'}
                          onDragStart={() => onThumbDragStart(slot)}
                          onDragOver={(e) => op === 'reorder_pages' && e.preventDefault()}
                          onDrop={() => onThumbDrop(slot)}
                          onClick={() => onThumbClick(originalIdx)}
                          style={{
                            position: 'relative',
                            cursor: gridInteractive ? (op === 'reorder_pages' ? 'grab' : 'pointer') : 'default',
                            border: `2px solid ${isDelete ? 'var(--red, #d0453d)' : isKeep ? 'var(--signal)' : 'var(--line)'}`,
                            borderRadius: 6,
                            overflow: 'hidden',
                            opacity: isDelete ? 0.4 : 1,
                            background: '#fff',
                          }}
                        >
                          <canvas ref={(el) => (canvasRefs.current[slot] = el)} style={{ width: '100%', display: 'block' }} />
                          <span style={{ position: 'absolute', bottom: 2, right: 4, fontSize: 10, fontWeight: 700, color: 'var(--text-3)', background: 'rgba(255,255,255,0.85)', borderRadius: 4, padding: '0 4px' }}>
                            {originalIdx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {!thumbsReady && <p className="status-line" style={{ marginTop: 6 }}>{t('loading')}</p>}
                </div>
              )}

              {op === 'word' && (
                <div className="op-panel">
                  <p className="status-line" style={{ margin: '0 0 10px' }}>{t('word_desc')}</p>
                  <button className="btn btn-signal" style={{ width: '100%' }} disabled={busy} onClick={runWord}>
                    {busy ? t('working') : t('word_apply')}
                  </button>
                </div>
              )}

              {op === 'split' && (
                <div className="op-panel">
                  <p className="status-line" style={{ margin: '0 0 10px' }}>{t('split_desc')}</p>
                  <button className="btn btn-signal" style={{ width: '100%' }} disabled={busy} onClick={runSplit}>
                    {busy ? t('working') : t('split_apply')}
                  </button>
                </div>
              )}

              {op === 'compress' && (
                <div className="op-panel">
                  <LevelPicker t={t} level={level} setLevel={setLevel} />
                  <button className="btn btn-signal" style={{ width: '100%', marginTop: 10 }} disabled={busy} onClick={runCompress}>
                    {busy ? t('working') : t('compress_apply')}
                  </button>
                </div>
              )}

              {op === 'rotate' && (
                <div className="op-panel">
                  <div className="op-tabs" style={{ marginBottom: 10 }}>
                    {[90, 180, 270].map((d) => (
                      <button key={d} type="button" className={`op-tab${degrees === d ? ' active' : ''}`} onClick={() => setDegrees(d)}>
                        {d}°
                      </button>
                    ))}
                  </div>
                  <button className="btn btn-signal" style={{ width: '100%' }} disabled={busy} onClick={runRotate}>
                    {busy ? t('working') : t('rotate_apply')}
                  </button>
                </div>
              )}

              {op === 'watermark' && (
                <div className="op-panel">
                  <div className="field">
                    <label>{t('wm_text_label')}</label>
                    <input type="text" value={wmText} onChange={(e) => setWmText(e.target.value)} placeholder={t('wm_text_placeholder')} />
                  </div>
                  <div className="field">
                    <label>{t('wm_opacity_label')} — {Math.round(wmOpacity * 100)}%</label>
                    <input type="range" min="0.1" max="0.6" step="0.05" value={wmOpacity} onChange={(e) => setWmOpacity(Number(e.target.value))} />
                  </div>
                  <button className="btn btn-signal" style={{ width: '100%', marginTop: 10 }} disabled={busy} onClick={runWatermark}>
                    {busy ? t('working') : t('wm_apply')}
                  </button>
                </div>
              )}

              {op === 'protect' && (
                <div className="op-panel">
                  <div className="op-tabs" style={{ marginBottom: 10 }}>
                    <button type="button" className={`op-tab${protectMode === 'protect' ? ' active' : ''}`} onClick={() => setProtectMode('protect')}>{t('protect_mode_protect')}</button>
                    <button type="button" className={`op-tab${protectMode === 'unlock' ? ' active' : ''}`} onClick={() => setProtectMode('unlock')}>{t('protect_mode_unlock')}</button>
                  </div>
                  <div className="field">
                    <label>{t('password_label')}</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  {protectMode === 'protect' && (
                    <div className="field">
                      <label>{t('password2_label')}</label>
                      <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
                    </div>
                  )}
                  <button className="btn btn-signal" style={{ width: '100%', marginTop: 10 }} disabled={busy} onClick={runProtect}>
                    {busy ? t('working') : (protectMode === 'protect' ? t('protect_apply') : t('unlock_apply'))}
                  </button>
                </div>
              )}

              {op === 'page_numbers' && (
                <div className="op-panel">
                  <div className="field">
                    <label>{t('numbers_position_label')}</label>
                    <select value={numPosition} onChange={(e) => setNumPosition(e.target.value)}>
                      {['bottom-center', 'bottom-right', 'bottom-left', 'top-center', 'top-right', 'top-left'].map((p) => (
                        <option key={p} value={p}>{t(`pos_${p.replace('-', '_')}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>{t('numbers_start_label')}</label>
                    <input type="number" min="1" value={numStartAt} onChange={(e) => setNumStartAt(Number(e.target.value) || 1)} />
                  </div>
                  <button className="btn btn-signal" style={{ width: '100%', marginTop: 10 }} disabled={busy} onClick={runPageNumbers}>
                    {busy ? t('working') : t('numbers_apply')}
                  </button>
                </div>
              )}

              {op === 'delete_pages' && (
                <div className="op-panel">
                  <p className="status-line" style={{ margin: '0 0 10px' }}>{t('marked_delete_count').replace('{count}', markedDelete.size)}</p>
                  <button className="btn btn-signal" style={{ width: '100%' }} disabled={busy || !markedDelete.size} onClick={runDeletePages}>
                    {busy ? t('working') : t('delete_pages_apply')}
                  </button>
                </div>
              )}

              {op === 'extract_pages' && (
                <div className="op-panel">
                  <p className="status-line" style={{ margin: '0 0 10px' }}>{t('marked_keep_count').replace('{count}', markedKeep.size)}</p>
                  <button className="btn btn-signal" style={{ width: '100%' }} disabled={busy || !markedKeep.size} onClick={runExtractPages}>
                    {busy ? t('working') : t('extract_pages_apply')}
                  </button>
                </div>
              )}

              {op === 'reorder_pages' && (
                <div className="op-panel">
                  <button className="btn btn-signal" style={{ width: '100%' }} disabled={busy} onClick={runReorderPages}>
                    {busy ? t('working') : t('reorder_apply')}
                  </button>
                </div>
              )}

              {op === 'grayscale' && (
                <div className="op-panel">
                  <LevelPicker t={t} level={level} setLevel={setLevel} />
                  <button className="btn btn-signal" style={{ width: '100%', marginTop: 10 }} disabled={busy} onClick={runGrayscale}>
                    {busy ? t('working') : t('grayscale_apply')}
                  </button>
                </div>
              )}

              {op === 'blank_page' && (
                <div className="op-panel">
                  <div className="op-tabs" style={{ marginBottom: 10 }}>
                    {['start', 'end', 'after'].map((p) => (
                      <button key={p} type="button" className={`op-tab${blankPosition === p ? ' active' : ''}`} onClick={() => setBlankPosition(p)}>
                        {t(`blank_pos_${p}`)}
                      </button>
                    ))}
                  </div>
                  {blankPosition === 'after' && (
                    <div className="field">
                      <label>{t('blank_after_label').replace('{count}', pageCount || '?')}</label>
                      <input type="number" min="1" max={pageCount || 1} value={blankAfter} onChange={(e) => setBlankAfter(Number(e.target.value) || 1)} />
                    </div>
                  )}
                  <button className="btn btn-signal" style={{ width: '100%', marginTop: 10 }} disabled={busy} onClick={runBlankPage}>
                    {busy ? t('working') : t('blank_apply')}
                  </button>
                </div>
              )}

              {op === 'metadata' && (
                <div className="op-panel">
                  {!meta && <p className="status-line">{t('loading')}</p>}
                  {meta && (
                    <>
                      {['title', 'author', 'subject', 'keywords'].map((f) => (
                        <div className="field" key={f}>
                          <label>{t(`meta_${f}`)}</label>
                          <input type="text" value={meta[f]} onChange={(e) => setMeta({ ...meta, [f]: e.target.value })} />
                        </div>
                      ))}
                      <button className="btn btn-signal" style={{ width: '100%', marginTop: 10 }} disabled={busy} onClick={runMetadataSave}>
                        {busy ? t('working') : t('meta_apply')}
                      </button>
                    </>
                  )}
                </div>
              )}

              {op === 'info' && (
                <div className="op-panel">
                  {!info && <p className="status-line">{t('loading')}</p>}
                  {info && (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 13, color: 'var(--text-2)', display: 'grid', gap: 6 }}>
                      <li><strong>{t('info_pages')}:</strong> {info.pageCount}</li>
                      <li><strong>{t('info_version')}:</strong> {info.version || '—'}</li>
                      <li><strong>{t('info_size')}:</strong> {formatSize(info.fileSize)}</li>
                      <li><strong>{t('info_dimensions')}:</strong> {info.pageWidthMm}×{info.pageHeightMm} mm</li>
                      <li><strong>{t('info_title')}:</strong> {info.title || '—'}</li>
                      <li><strong>{t('info_author')}:</strong> {info.author || '—'}</li>
                      <li><strong>{t('info_created')}:</strong> {info.creationDate || '—'}</li>
                      <li><strong>{t('info_encrypted')}:</strong> {info.encrypted ? t('yes') : t('no')}</li>
                    </ul>
                  )}
                </div>
              )}

              {op === 'to_jpg' && (
                <div className="op-panel">
                  <LevelPicker t={t} level={level} setLevel={setLevel} />
                  <button className="btn btn-signal" style={{ width: '100%', marginTop: 10 }} disabled={busy} onClick={runToJpg}>
                    {busy ? t('working') : t('to_jpg_apply')}
                  </button>
                </div>
              )}

              {busy && progress > 0 && (
                <>
                  <div className="progress-bar"><div style={{ width: `${progress}%` }} /></div>
                  <p className="status-line">{status}</p>
                </>
              )}
              {error && <p className="status-line">{error}</p>}

              {result && (
                <div className="download-row">
                  <a className="btn btn-signal" style={{ width: '100%' }} href={result.blobUrl} download={result.fileName}>
                    {t('download_generic_btn')}
                  </a>
                </div>
              )}

              <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: 10 }} onClick={resetToNewFile}>
                {t('choose_another')}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function LevelPicker({ t, level, setLevel }) {
  return (
    <div className="field">
      <label>{t('level_label')}</label>
      <div className="op-tabs" style={{ marginBottom: 0 }}>
        {['low', 'medium', 'high'].map((l) => (
          <button key={l} type="button" className={`op-tab${level === l ? ' active' : ''}`} onClick={() => setLevel(l)}>
            {t(`level_${l}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
