import { useEffect, useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { photoEditorDicts } from '../i18n';
import {
  formatSize,
  loadImage,
  resizeToCanvas,
  cropToCanvas,
  toCanvas,
  canvasToBlob,
  suggestedFileName,
  OUTPUT_FORMATS,
} from '../logic/photoTools';
import BackgroundRemoverEditor from './BackgroundRemoverEditor';

const OPS = ['resize', 'crop', 'convert', 'removebg'];

export default function PhotoEditorTool() {
  const t = useToolI18n(photoEditorDicts);
  const fileInputRef = useRef(null);
  const previewImgRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null); // { img, url, width, height }
  const [error, setError] = useState('');
  const [op, setOp] = useState('resize');
  const [result, setResult] = useState(null); // { blobUrl, fileName }

  // resize state
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);

  // crop state (in displayed/preview pixel coords)
  const [cropRect, setCropRect] = useState(null);
  const dragStart = useRef(null);

  // convert state
  const [targetFormat, setTargetFormat] = useState(OUTPUT_FORMATS[0]);
  const [quality, setQuality] = useState(0.9);

  async function handleFile(f) {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError(t('invalid_file'));
      return;
    }
    setError('');
    setResult(null);
    setCropRect(null);
    try {
      const loaded = await loadImage(f);
      setFile(f);
      setImage(loaded);
      setWidth(loaded.width);
      setHeight(loaded.height);
    } catch (err) {
      console.error(err);
      setError(t('invalid_file'));
    }
  }

  function resetToNewFile() {
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    if (image?.url) URL.revokeObjectURL(image.url);
    setFile(null);
    setImage(null);
    setResult(null);
    setCropRect(null);
  }

  function downloadBlob(blob, fileName) {
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    const blobUrl = URL.createObjectURL(blob);
    setResult({ blobUrl, fileName });
  }

  // ---- resize ----
  function onWidthChange(v) {
    const w = Math.max(1, Number(v) || 0);
    setWidth(w);
    if (lockAspect && image) setHeight(Math.round((w * image.height) / image.width));
  }
  function onHeightChange(v) {
    const h = Math.max(1, Number(v) || 0);
    setHeight(h);
    if (lockAspect && image) setWidth(Math.round((h * image.width) / image.height));
  }
  async function applyResize() {
    if (!image) return;
    const canvas = resizeToCanvas(image.img, width, height);
    const blob = await canvasToBlob(canvas, targetFormat.mime, targetFormat.lossy ? quality : undefined);
    downloadBlob(blob, suggestedFileName(file.name, targetFormat.ext));
  }

  // ---- crop ----
  function scaleFactors() {
    const el = previewImgRef.current;
    if (!el || !image) return { sx: 1, sy: 1 };
    return { sx: image.width / el.clientWidth, sy: image.height / el.clientHeight };
  }
  function onCropMouseDown(e) {
    const el = previewImgRef.current;
    if (!el) return;
    const bounds = el.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    dragStart.current = { x, y };
    setCropRect({ x, y, width: 0, height: 0 });
  }
  function onCropMouseMove(e) {
    if (!dragStart.current) return;
    const el = previewImgRef.current;
    const bounds = el.getBoundingClientRect();
    const cx = Math.min(Math.max(e.clientX - bounds.left, 0), bounds.width);
    const cy = Math.min(Math.max(e.clientY - bounds.top, 0), bounds.height);
    const start = dragStart.current;
    setCropRect({
      x: Math.min(start.x, cx),
      y: Math.min(start.y, cy),
      width: Math.abs(cx - start.x),
      height: Math.abs(cy - start.y),
    });
  }
  function onCropMouseUp() {
    dragStart.current = null;
  }
  async function applyCrop() {
    if (!image || !cropRect || cropRect.width < 4 || cropRect.height < 4) return;
    const { sx, sy } = scaleFactors();
    const rect = {
      x: cropRect.x * sx,
      y: cropRect.y * sy,
      width: cropRect.width * sx,
      height: cropRect.height * sy,
    };
    const canvas = cropToCanvas(image.img, rect);
    const blob = await canvasToBlob(canvas, targetFormat.mime, targetFormat.lossy ? quality : undefined);
    downloadBlob(blob, suggestedFileName(file.name, targetFormat.ext));
  }

  // ---- convert ----
  async function applyConvert() {
    if (!image) return;
    const canvas = toCanvas(image.img);
    const blob = await canvasToBlob(canvas, targetFormat.mime, targetFormat.lossy ? quality : undefined);
    downloadBlob(blob, suggestedFileName(file.name, targetFormat.ext));
  }

  useEffect(() => () => {
    if (result?.blobUrl) URL.revokeObjectURL(result.blobUrl);
    if (image?.url) URL.revokeObjectURL(image.url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        <div className="tool-card" style={op === 'removebg' && image ? { maxWidth: 'none' } : undefined}>
          {!image && (
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
                  if (f) handleFile(f);
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
                style={{ display: 'none' }}
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
              />
              {error && <p className="status-line">{error}</p>}
              <p className="footnote">{t('footnote')}</p>
            </>
          )}

          {image && (
            <div style={{ padding: 8 }}>
              <div className="file-row" style={{ margin: '0 0 10px' }}>
                <span className="name">{file.name}</span>
                <span>{formatSize(file.size)} · {image.width}×{image.height}</span>
              </div>

              <div className="op-tabs">
                {OPS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    className={`op-tab${op === o ? ' active' : ''}`}
                    onClick={() => setOp(o)}
                  >
                    {t(`op_${o}`)}
                  </button>
                ))}
              </div>

              {op !== 'removebg' && (
                <div
                  className="preview-box"
                  onMouseMove={op === 'crop' ? onCropMouseMove : undefined}
                  onMouseUp={op === 'crop' ? onCropMouseUp : undefined}
                  onMouseLeave={op === 'crop' ? onCropMouseUp : undefined}
                >
                  <img
                    ref={previewImgRef}
                    src={image.url}
                    alt=""
                    draggable={false}
                    onMouseDown={op === 'crop' ? onCropMouseDown : undefined}
                    style={{ cursor: op === 'crop' ? 'crosshair' : 'default' }}
                  />
                  {op === 'crop' && cropRect && (
                    <div
                      className="crop-selection"
                      style={{ left: cropRect.x, top: cropRect.y, width: cropRect.width, height: cropRect.height }}
                    />
                  )}
                </div>
              )}

              {op === 'resize' && (
                <div className="op-panel">
                  <div className="field-row">
                    <div className="field">
                      <label>{t('resize_width')}</label>
                      <input type="number" min="1" value={width} onChange={(e) => onWidthChange(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>{t('resize_height')}</label>
                      <input type="number" min="1" value={height} onChange={(e) => onHeightChange(e.target.value)} />
                    </div>
                  </div>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} />
                    {t('resize_lock')}
                  </label>
                  <FormatPicker t={t} targetFormat={targetFormat} setTargetFormat={setTargetFormat} quality={quality} setQuality={setQuality} />
                  <button className="btn btn-signal" style={{ width: '100%', marginTop: 10 }} onClick={applyResize}>
                    {t('resize_apply')}
                  </button>
                </div>
              )}

              {op === 'crop' && (
                <div className="op-panel">
                  <p className="status-line" style={{ margin: '0 0 10px' }}>{t('crop_hint')}</p>
                  <FormatPicker t={t} targetFormat={targetFormat} setTargetFormat={setTargetFormat} quality={quality} setQuality={setQuality} />
                  <button
                    className="btn btn-signal"
                    style={{ width: '100%', marginTop: 10 }}
                    disabled={!cropRect || cropRect.width < 4 || cropRect.height < 4}
                    onClick={applyCrop}
                  >
                    {t('crop_apply')}
                  </button>
                </div>
              )}

              {op === 'convert' && (
                <div className="op-panel">
                  <FormatPicker t={t} targetFormat={targetFormat} setTargetFormat={setTargetFormat} quality={quality} setQuality={setQuality} />
                  <button className="btn btn-signal" style={{ width: '100%', marginTop: 10 }} onClick={applyConvert}>
                    {t('convert_apply')}
                  </button>
                </div>
              )}

              {op === 'removebg' && (
                <BackgroundRemoverEditor
                  image={image}
                  t={t}
                  onDownload={(blob) => downloadBlob(blob, suggestedFileName(file.name, 'png'))}
                />
              )}

              {result && (
                <div className="download-row">
                  <a className="btn btn-signal" style={{ width: '100%' }} href={result.blobUrl} download={result.fileName}>
                    {t('download_btn')}
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

function FormatPicker({ t, targetFormat, setTargetFormat, quality, setQuality }) {
  return (
    <div className="op-panel" style={{ padding: 0, border: 'none' }}>
      <div className="field">
        <label>{t('format_label')}</label>
        <div className="op-tabs" style={{ marginBottom: 0 }}>
          {OUTPUT_FORMATS.map((f) => (
            <button
              key={f.mime}
              type="button"
              className={`op-tab${targetFormat.mime === f.mime ? ' active' : ''}`}
              onClick={() => setTargetFormat(f)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {targetFormat.lossy && (
        <div className="field" style={{ marginTop: 10 }}>
          <label>{t('quality_label')} — {Math.round(quality * 100)}%</label>
          <input type="range" min="0.4" max="1" step="0.05" value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
        </div>
      )}
    </div>
  );
}
