// Framework-free helpers for the vector editor: shape data model,
// SVG (de)serialization, and export to .svg / .png — all client-side,
// same pattern as the other tools' logic/ files.

let nextId = 1;
export function newId() {
  return `shape_${nextId++}_${Date.now().toString(36)}`;
}

export const DEFAULT_STYLE = { fill: '#0EA5A0', stroke: '#12203D', strokeWidth: 2 };

/**
 * Builds the inner SVG markup (just the shape elements, no <svg> wrapper)
 * for a list of shapes.
 */
export function shapesToMarkup(shapes) {
  return shapes
    .map((s) => shapeToElementString(s))
    .join('\n');
}

function esc(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function shapeToElementString(s) {
  const fill = s.type === 'line' || s.type === 'path' ? 'none' : s.fill;
  const common = `fill="${fill}" stroke="${s.stroke}" stroke-width="${s.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`;
  switch (s.type) {
    case 'rect':
      return `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" ${common} />`;
    case 'ellipse':
      return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" ${common} />`;
    case 'line':
      return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" ${common} />`;
    case 'path':
      return `<path d="${s.d}" ${common} />`;
    case 'text':
      return `<text x="${s.x}" y="${s.y}" font-size="${s.fontSize}" font-family="Inter, sans-serif" fill="${s.fill}">${esc(s.text)}</text>`;
    default:
      return '';
  }
}

/**
 * Full standalone SVG document string, ready to save as a .svg file.
 */
export function buildSvgDocument(shapes, width, height, background) {
  const bg = background ? `<rect x="0" y="0" width="${width}" height="${height}" fill="${background}" />` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n${bg}\n${shapesToMarkup(shapes)}\n</svg>`;
}

export function downloadText(text, fileName, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Rasterizes the current canvas to a PNG blob for download.
 */
export function svgToPngBlob(shapes, width, height, background) {
  return new Promise((resolve, reject) => {
    const svgText = buildSvgDocument(shapes, width, height, background || '#FFFFFF');
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Export failed.'))), 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not render the canvas.'));
    };
    img.src = url;
  });
}

/**
 * Best-effort import: reads a .svg file's top-level rect/ellipse/circle/
 * line/path/text elements into this editor's shape model. Elements it
 * doesn't recognize are skipped rather than crashing the import.
 */
export function parseSvgImport(svgText) {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid SVG file.');
  const root = doc.querySelector('svg');
  const shapes = [];

  const num = (el, name, fallback = 0) => {
    const v = parseFloat(el.getAttribute(name));
    return Number.isFinite(v) ? v : fallback;
  };
  const styleOf = (el) => ({
    fill: el.getAttribute('fill') || DEFAULT_STYLE.fill,
    stroke: el.getAttribute('stroke') || DEFAULT_STYLE.stroke,
    strokeWidth: num(el, 'stroke-width', DEFAULT_STYLE.strokeWidth),
  });

  root?.querySelectorAll(':scope > rect, :scope > ellipse, :scope > circle, :scope > line, :scope > path, :scope > text').forEach((el) => {
    const style = styleOf(el);
    const tag = el.tagName.toLowerCase();
    if (tag === 'rect') {
      shapes.push({ id: newId(), type: 'rect', x: num(el, 'x'), y: num(el, 'y'), width: num(el, 'width', 10), height: num(el, 'height', 10), ...style });
    } else if (tag === 'ellipse') {
      shapes.push({ id: newId(), type: 'ellipse', cx: num(el, 'cx'), cy: num(el, 'cy'), rx: num(el, 'rx', 10), ry: num(el, 'ry', 10), ...style });
    } else if (tag === 'circle') {
      const r = num(el, 'r', 10);
      shapes.push({ id: newId(), type: 'ellipse', cx: num(el, 'cx'), cy: num(el, 'cy'), rx: r, ry: r, ...style });
    } else if (tag === 'line') {
      shapes.push({ id: newId(), type: 'line', x1: num(el, 'x1'), y1: num(el, 'y1'), x2: num(el, 'x2'), y2: num(el, 'y2'), ...style });
    } else if (tag === 'path') {
      shapes.push({ id: newId(), type: 'path', d: el.getAttribute('d') || '', ...style });
    } else if (tag === 'text') {
      shapes.push({ id: newId(), type: 'text', x: num(el, 'x'), y: num(el, 'y'), text: el.textContent || '', fontSize: num(el, 'font-size', 24), fill: style.fill, stroke: 'none', strokeWidth: 0 });
    }
  });

  const width = root ? num(root, 'width', 800) || 800 : 800;
  const height = root ? num(root, 'height', 500) || 500 : 500;
  return { shapes, width, height };
}
