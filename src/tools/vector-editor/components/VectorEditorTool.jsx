import { useEffect, useRef, useState } from 'react';
import { useToolI18n } from '../../../shell/i18n/I18nContext';
import { vectorEditorDicts } from '../i18n';
import {
  newId,
  DEFAULT_STYLE,
  buildSvgDocument,
  downloadText,
  svgToPngBlob,
  parseSvgImport,
} from '../logic/vectorTools';

const TOOLS = ['select', 'rect', 'ellipse', 'line', 'pen', 'text'];
const CANVAS_W = 800;
const CANVAS_H = 480;

export default function VectorEditorTool() {
  const t = useToolI18n(vectorEditorDicts);
  const svgRef = useRef(null);
  const fileInputRef = useRef(null);

  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState('select');
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [canvasSize, setCanvasSize] = useState({ width: CANVAS_W, height: CANVAS_H });

  const [draft, setDraft] = useState(null); // shape being drawn right now
  const drawStart = useRef(null);
  const penPoints = useRef([]);

  const dragInfo = useRef(null); // { id, startX, startY, origShape }
  const [textInput, setTextInput] = useState(null); // { x, y, value }

  const selectedShape = shapes.find((s) => s.id === selectedId) || null;

  function getPoint(e) {
    const el = svgRef.current;
    const bounds = el.getBoundingClientRect();
    const scaleX = canvasSize.width / bounds.width;
    const scaleY = canvasSize.height / bounds.height;
    return {
      x: (e.clientX - bounds.left) * scaleX,
      y: (e.clientY - bounds.top) * scaleY,
    };
  }

  // ---- drawing new shapes ----
  function onCanvasPointerDown(e) {
    if (tool === 'select') {
      setSelectedId(null);
      return;
    }
    const p = getPoint(e);
    if (tool === 'text') {
      setTextInput({ x: p.x, y: p.y, value: '' });
      return;
    }
    drawStart.current = p;
    if (tool === 'rect') setDraft({ id: 'draft', type: 'rect', x: p.x, y: p.y, width: 0, height: 0, ...style });
    if (tool === 'ellipse') setDraft({ id: 'draft', type: 'ellipse', cx: p.x, cy: p.y, rx: 0, ry: 0, ...style });
    if (tool === 'line') setDraft({ id: 'draft', type: 'line', x1: p.x, y1: p.y, x2: p.x, y2: p.y, ...style });
    if (tool === 'pen') {
      penPoints.current = [p];
      setDraft({ id: 'draft', type: 'path', d: `M ${p.x} ${p.y}`, ...style });
    }
  }

  function onCanvasPointerMove(e) {
    if (dragInfo.current) {
      const p = getPoint(e);
      const dx = p.x - dragInfo.current.startX;
      const dy = p.y - dragInfo.current.startY;
      setShapes((prev) => prev.map((s) => (s.id === dragInfo.current.id ? moveShape(dragInfo.current.origShape, dx, dy) : s)));
      return;
    }
    if (!drawStart.current || !draft) return;
    const p = getPoint(e);
    const start = drawStart.current;
    if (tool === 'rect') {
      setDraft({ ...draft, x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), width: Math.abs(p.x - start.x), height: Math.abs(p.y - start.y) });
    } else if (tool === 'ellipse') {
      setDraft({ ...draft, cx: (start.x + p.x) / 2, cy: (start.y + p.y) / 2, rx: Math.abs(p.x - start.x) / 2, ry: Math.abs(p.y - start.y) / 2 });
    } else if (tool === 'line') {
      setDraft({ ...draft, x2: p.x, y2: p.y });
    } else if (tool === 'pen') {
      penPoints.current.push(p);
      setDraft({ ...draft, d: penPoints.current.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ') });
    }
  }

  function onCanvasPointerUp() {
    if (dragInfo.current) {
      dragInfo.current = null;
      return;
    }
    if (!draft) return;
    let finalShape = { ...draft, id: newId() };
    const tooSmall =
      (finalShape.type === 'rect' && finalShape.width < 3 && finalShape.height < 3) ||
      (finalShape.type === 'ellipse' && finalShape.rx < 3 && finalShape.ry < 3) ||
      (finalShape.type === 'line' && Math.hypot(finalShape.x2 - finalShape.x1, finalShape.y2 - finalShape.y1) < 3) ||
      (finalShape.type === 'path' && penPoints.current.length < 2);

    if (!tooSmall) {
      setShapes((prev) => [...prev, finalShape]);
      setSelectedId(finalShape.id);
    }
    setDraft(null);
    drawStart.current = null;
    penPoints.current = [];
  }

  // ---- select & drag existing shapes ----
  function onShapePointerDown(e, shape) {
    e.stopPropagation();
    if (tool !== 'select') return;
    setSelectedId(shape.id);
    const p = getPoint(e);
    dragInfo.current = { id: shape.id, startX: p.x, startY: p.y, origShape: shape };
  }

  // ---- text placement ----
  function commitTextInput() {
    if (textInput && textInput.value.trim()) {
      const shape = { id: newId(), type: 'text', x: textInput.x, y: textInput.y, text: textInput.value, fontSize: 28, fill: style.fill, stroke: 'none', strokeWidth: 0 };
      setShapes((prev) => [...prev, shape]);
      setSelectedId(shape.id);
    }
    setTextInput(null);
  }

  // ---- properties panel edits ----
  function updateSelected(patch) {
    if (!selectedId) {
      setStyle((s) => ({ ...s, ...patch }));
      return;
    }
    setShapes((prev) => prev.map((s) => (s.id === selectedId ? { ...s, ...patch } : s)));
  }
  function deleteSelected() {
    if (!selectedId) return;
    setShapes((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  }
  function duplicateSelected() {
    if (!selectedShape) return;
    const copy = moveShape(selectedShape, 16, 16);
    copy.id = newId();
    setShapes((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  }
  function reorderSelected(dir) {
    if (!selectedId) return;
    setShapes((prev) => {
      const idx = prev.findIndex((s) => s.id === selectedId);
      if (idx === -1) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(dir === 'front' ? next.length : 0, 0, item);
      return next;
    });
  }
  function clearCanvas() {
    setShapes([]);
    setSelectedId(null);
  }

  // ---- import / export ----
  function handleImport(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { shapes: imported, width, height } = parseSvgImport(reader.result);
        setShapes(imported);
        setCanvasSize({ width, height });
        setSelectedId(null);
      } catch (err) {
        console.error(err);
        window.alert(t('import_error'));
      }
    };
    reader.readAsText(file);
  }
  function exportSvg() {
    const svgText = buildSvgDocument(shapes, canvasSize.width, canvasSize.height, '#FFFFFF');
    downloadText(svgText, 'itdocsy-drawing.svg', 'image/svg+xml');
  }
  async function exportPng() {
    try {
      const blob = await svgToPngBlob(shapes, canvasSize.width, canvasSize.height, '#FFFFFF');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'itdocsy-drawing.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error(err);
    }
  }

  // delete key removes the selected shape, unless typing in a field
  useEffect(() => {
    function onKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteSelected();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, shapes]);

  const activeStyle = selectedShape || style;

  return (
    <>
      <section className="hero" id="tool">
        <div className="wrap" style={{ width: '100%' }}>
          <div className="format-chip" style={{ marginBottom: 20 }}>
            <span className="swap" />
            <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>{t('hero_eyebrow')}</span>
          </div>
          <h1>
            <span>{t('hero_title_a')}</span>
            <br />
            <span className="accent">{t('hero_title_b')}</span>
          </h1>
          <p className="lead" style={{ marginTop: 20, maxWidth: 620 }}>{t('hero_lead')}</p>
        </div>
      </section>

      <section className="wrap" style={{ marginBottom: 60 }}>
        <div className="ve-toolbar">
          <div className="ve-tool-group">
            {TOOLS.map((tl) => (
              <button
                key={tl}
                type="button"
                className={`ve-tool-btn${tool === tl ? ' active' : ''}`}
                title={t(`tool_${tl}`)}
                onClick={() => { setTool(tl); setSelectedId(null); }}
              >
                {t(`tool_${tl}`)}
              </button>
            ))}
          </div>
          <div className="ve-tool-group">
            <button type="button" className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>{t('import_btn')}</button>
            <input ref={fileInputRef} type="file" accept=".svg,image/svg+xml" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && handleImport(e.target.files[0])} />
            <button type="button" className="btn btn-ghost" onClick={clearCanvas}>{t('clear_btn')}</button>
            <button type="button" className="btn btn-ink" onClick={exportSvg}>{t('export_svg_btn')}</button>
            <button type="button" className="btn btn-signal" onClick={exportPng}>{t('export_png_btn')}</button>
          </div>
        </div>

        <div className="ve-layout">
          <div className="ve-canvas-wrap">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
              className="ve-canvas"
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onCanvasPointerMove}
              onPointerUp={onCanvasPointerUp}
              onPointerLeave={onCanvasPointerUp}
            >
              <rect x="0" y="0" width={canvasSize.width} height={canvasSize.height} fill="#FFFFFF" />
              {shapes.map((s) => (
                <ShapeEl key={s.id} shape={s} selected={s.id === selectedId} onPointerDown={(e) => onShapePointerDown(e, s)} />
              ))}
              {draft && <ShapeEl shape={draft} selected={false} onPointerDown={() => {}} />}
            </svg>

            {textInput && (
              <input
                autoFocus
                className="ve-text-input"
                style={{
                  left: `calc(${(textInput.x / canvasSize.width) * 100}% )`,
                  top: `calc(${(textInput.y / canvasSize.height) * 100}% - 18px)`,
                }}
                value={textInput.value}
                placeholder={t('text_placeholder')}
                onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
                onBlur={commitTextInput}
                onKeyDown={(e) => { if (e.key === 'Enter') commitTextInput(); if (e.key === 'Escape') setTextInput(null); }}
              />
            )}
          </div>

          <div className="ve-props">
            <p className="ve-props-title">{selectedShape ? t('props_selected') : t('props_default')}</p>

            {(!selectedShape || selectedShape.type !== 'line') && (!selectedShape || selectedShape.type !== 'path') && (
              <div className="field">
                <label>{t('fill_label')}</label>
                <input type="color" value={activeStyle.fill} onChange={(e) => updateSelected({ fill: e.target.value })} />
              </div>
            )}
            {(!selectedShape || selectedShape.type !== 'text') && (
              <>
                <div className="field">
                  <label>{t('stroke_label')}</label>
                  <input type="color" value={activeStyle.stroke} onChange={(e) => updateSelected({ stroke: e.target.value })} />
                </div>
                <div className="field">
                  <label>{t('stroke_width_label')} — {activeStyle.strokeWidth}px</label>
                  <input type="range" min="1" max="20" value={activeStyle.strokeWidth} onChange={(e) => updateSelected({ strokeWidth: Number(e.target.value) })} />
                </div>
              </>
            )}
            {selectedShape?.type === 'text' && (
              <>
                <div className="field">
                  <label>{t('text_content_label')}</label>
                  <input type="text" value={selectedShape.text} onChange={(e) => updateSelected({ text: e.target.value })} />
                </div>
                <div className="field">
                  <label>{t('font_size_label')} — {selectedShape.fontSize}px</label>
                  <input type="range" min="10" max="96" value={selectedShape.fontSize} onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })} />
                </div>
              </>
            )}

            {selectedShape && (
              <div className="ve-props-actions">
                <button type="button" className="btn btn-ghost" onClick={duplicateSelected}>{t('duplicate_btn')}</button>
                <button type="button" className="btn btn-ghost" onClick={() => reorderSelected('front')}>{t('bring_front_btn')}</button>
                <button type="button" className="btn btn-ghost" onClick={() => reorderSelected('back')}>{t('send_back_btn')}</button>
                <button type="button" className="btn btn-ink" onClick={deleteSelected}>{t('delete_btn')}</button>
              </div>
            )}

            <p className="footnote" style={{ padding: '14px 0 0' }}>{t('footnote')}</p>
          </div>
        </div>
      </section>
    </>
  );
}

function ShapeEl({ shape, selected, onPointerDown }) {
  const fill = shape.type === 'line' || shape.type === 'path' ? 'none' : shape.fill;
  const commonProps = {
    fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    onPointerDown,
    className: selected ? 've-shape selected' : 've-shape',
  };
  switch (shape.type) {
    case 'rect':
      return <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} {...commonProps} />;
    case 'ellipse':
      return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...commonProps} />;
    case 'line':
      return <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} {...commonProps} />;
    case 'path':
      return <path d={shape.d} {...commonProps} />;
    case 'text':
      return (
        <text x={shape.x} y={shape.y} fontSize={shape.fontSize} fontFamily="Inter, sans-serif" fill={shape.fill} onPointerDown={onPointerDown} className={selected ? 've-shape selected' : 've-shape'}>
          {shape.text}
        </text>
      );
    default:
      return null;
  }
}

function moveShape(shape, dx, dy) {
  switch (shape.type) {
    case 'rect':
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
    case 'ellipse':
      return { ...shape, cx: shape.cx + dx, cy: shape.cy + dy };
    case 'line':
      return { ...shape, x1: shape.x1 + dx, y1: shape.y1 + dy, x2: shape.x2 + dx, y2: shape.y2 + dy };
    case 'text':
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
    case 'path':
      return { ...shape, d: translatePathD(shape.d, dx, dy) };
    default:
      return shape;
  }
}

function translatePathD(d, dx, dy) {
  return d.replace(/([ML])\s*(-?\d*\.?\d+)[,\s]+(-?\d*\.?\d+)/g, (match, cmd, x, y) => {
    return `${cmd} ${parseFloat(x) + dx} ${parseFloat(y) + dy}`;
  });
}
