import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createFullMask,
  cloneMask,
  brushStroke,
  fillPath,
  magicWandFill,
  getSourceImageData,
  invertMask,
  applyMask,
  canvasToBlob,
} from '../logic/manualBackgroundRemoval';

const TOOLS = ['wand', 'brush', 'lasso', 'polygon'];
const MAX_HISTORY = 20;

/**
 * Fully manual (no AI) background removal editor. The user paints, wand-
 * selects, or draws a lasso/polygon over the areas to remove or restore;
 * everything runs as classic canvas pixel operations in the browser.
 *
 * @param {{ image: { img: HTMLImageElement, width: number, height: number }, t: (key: string) => string, onDownload: (blob: Blob) => void }} props
 */
export default function BackgroundRemoverEditor({ image, t, onDownload }) {
  const displayRef = useRef(null);
  const wrapRef = useRef(null);
  const maskRef = useRef(null);
  const sourceDataRef = useRef(null);
  const historyRef = useRef([]);
  const pointerDown = useRef(false);
  const polygonPoints = useRef([]);
  const rafRef = useRef(null);

  const [tool, setTool] = useState('wand');
  const [mode, setMode] = useState('erase'); // erase | restore
  const [brushSize, setBrushSize] = useState(28);
  const [tolerance, setTolerance] = useState(24);
  const [contiguous, setContiguous] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [polygonActive, setPolygonActive] = useState(false);

  const { img, width, height } = image;

  // Init mask + source pixel data once per image.
  useEffect(() => {
    maskRef.current = createFullMask(width, height);
    sourceDataRef.current = getSourceImageData(img, width, height);
    historyRef.current = [];
    setCanUndo(false);
    polygonPoints.current = [];
    setPolygonActive(false);
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, width, height]);

  const redraw = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const canvas = displayRef.current;
      if (!canvas || !maskRef.current) return;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const composited = applyMask(img, maskRef.current, width, height);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(composited, 0, 0);
    });
  }, [img, width, height]);

  function pushHistory() {
    const stack = historyRef.current;
    stack.push(cloneMask(maskRef.current));
    if (stack.length > MAX_HISTORY) stack.shift();
    setCanUndo(true);
  }

  function undo() {
    const stack = historyRef.current;
    if (!stack.length) return;
    maskRef.current = stack.pop();
    setCanUndo(stack.length > 0);
    redraw();
  }

  function resetMask() {
    pushHistory();
    maskRef.current = createFullMask(width, height);
    redraw();
  }

  function invert() {
    pushHistory();
    invertMask(maskRef.current);
    redraw();
  }

  // Map a pointer event to image-space pixel coords.
  function toImageCoords(e) {
    const canvas = displayRef.current;
    const bounds = canvas.getBoundingClientRect();
    const sx = width / bounds.width;
    const sy = height / bounds.height;
    return { x: (e.clientX - bounds.left) * sx, y: (e.clientY - bounds.top) * sy };
  }

  function onPointerDown(e) {
    const pt = toImageCoords(e);
    if (tool === 'wand') {
      pushHistory();
      magicWandFill(maskRef.current.getContext('2d'), sourceDataRef.current, pt.x, pt.y, tolerance, mode, contiguous);
      redraw();
      return;
    }
    if (tool === 'brush') {
      pushHistory();
      pointerDown.current = true;
      brushStroke(maskRef.current.getContext('2d'), pt.x, pt.y, brushSize, mode);
      redraw();
      return;
    }
    if (tool === 'lasso') {
      pushHistory();
      pointerDown.current = true;
      polygonPoints.current = [pt];
      return;
    }
    if (tool === 'polygon') {
      if (!polygonActive) {
        pushHistory();
        polygonPoints.current = [pt];
        setPolygonActive(true);
      } else {
        polygonPoints.current.push(pt);
      }
    }
  }

  function onPointerMove(e) {
    if (!pointerDown.current) return;
    const pt = toImageCoords(e);
    if (tool === 'brush') {
      brushStroke(maskRef.current.getContext('2d'), pt.x, pt.y, brushSize, mode);
      redraw();
    } else if (tool === 'lasso') {
      polygonPoints.current.push(pt);
    }
  }

  function onPointerUp() {
    if (tool === 'lasso' && pointerDown.current) {
      fillPath(maskRef.current.getContext('2d'), polygonPoints.current, mode);
      polygonPoints.current = [];
      redraw();
    }
    pointerDown.current = false;
  }

  function closePolygon() {
    if (polygonPoints.current.length >= 3) {
      fillPath(maskRef.current.getContext('2d'), polygonPoints.current, mode);
      redraw();
    }
    polygonPoints.current = [];
    setPolygonActive(false);
  }

  function cancelPolygon() {
    polygonPoints.current = [];
    setPolygonActive(false);
    undo();
  }

  async function handleDownload() {
    const finalCanvas = applyMask(img, maskRef.current, width, height);
    const blob = await canvasToBlob(finalCanvas);
    onDownload(blob);
  }

  return (
    <div>
      <div className="bgr-toolbar">
        <div className="bgr-tool-group">
          {TOOLS.map((tl) => (
            <button
              key={tl}
              type="button"
              className={`bgr-tool-btn${tool === tl ? ' active' : ''}`}
              onClick={() => { setTool(tl); polygonPoints.current = []; setPolygonActive(false); }}
            >
              {t(`bgr_tool_${tl}`)}
            </button>
          ))}
        </div>
        <div className="bgr-tool-group">
          <button
            type="button"
            className={`bgr-tool-btn${mode === 'erase' ? ' active' : ''}`}
            onClick={() => setMode('erase')}
          >
            {t('bgr_mode_erase')}
          </button>
          <button
            type="button"
            className={`bgr-tool-btn${mode === 'restore' ? ' active' : ''}`}
            onClick={() => setMode('restore')}
          >
            {t('bgr_mode_restore')}
          </button>
        </div>
      </div>

      <div className="bgr-layout">
        <div className="bgr-canvas-wrap" ref={wrapRef}>
          <canvas
            ref={displayRef}
            className="bgr-canvas"
            style={{ cursor: tool === 'brush' ? 'crosshair' : tool === 'wand' ? 'pointer' : 'crosshair' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
          {tool === 'polygon' && polygonActive && (
            <div className="bgr-polygon-hint">{t('bgr_polygon_hint')}</div>
          )}
        </div>

        <div className="bgr-props">
          <p className="bgr-props-title">{t('bgr_settings_title')}</p>

          {tool === 'brush' && (
            <div className="field">
              <label>{t('bgr_brush_size')} — {brushSize}px</label>
              <input type="range" min="4" max="120" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
            </div>
          )}

          {tool === 'wand' && (
            <>
              <div className="field">
                <label>{t('bgr_tolerance')} — {tolerance}</label>
                <input type="range" min="1" max="100" value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} />
              </div>
              <label className="checkbox-row">
                <input type="checkbox" checked={contiguous} onChange={(e) => setContiguous(e.target.checked)} />
                {t('bgr_contiguous')}
              </label>
            </>
          )}

          {tool === 'polygon' && (
            <p className="status-line" style={{ margin: '0 0 10px', padding: 0 }}>{t('bgr_polygon_help')}</p>
          )}
          {tool === 'lasso' && (
            <p className="status-line" style={{ margin: '0 0 10px', padding: 0 }}>{t('bgr_lasso_help')}</p>
          )}
          {tool === 'wand' && (
            <p className="status-line" style={{ margin: '0 0 10px', padding: 0 }}>{t('bgr_wand_help')}</p>
          )}
          {tool === 'brush' && (
            <p className="status-line" style={{ margin: '0 0 10px', padding: 0 }}>{t('bgr_brush_help')}</p>
          )}

          {tool === 'polygon' && polygonActive && (
            <div className="bgr-props-actions">
              <button type="button" className="btn btn-signal" onClick={closePolygon}>{t('bgr_polygon_close')}</button>
              <button type="button" className="btn btn-ghost" onClick={cancelPolygon}>{t('bgr_polygon_cancel')}</button>
            </div>
          )}

          <div className="bgr-props-actions">
            <button type="button" className="btn btn-ghost" disabled={!canUndo} onClick={undo}>{t('bgr_undo')}</button>
            <button type="button" className="btn btn-ghost" onClick={invert}>{t('bgr_invert')}</button>
            <button type="button" className="btn btn-ghost" onClick={resetMask}>{t('bgr_reset')}</button>
          </div>

          <button type="button" className="btn btn-signal" style={{ width: '100%', marginTop: 10 }} onClick={handleDownload}>
            {t('bgr_download')}
          </button>
        </div>
      </div>
    </div>
  );
}
