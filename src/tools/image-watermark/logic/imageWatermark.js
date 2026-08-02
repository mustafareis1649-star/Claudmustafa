// Runs entirely in the browser via Canvas — no file is ever uploaded to a
// server.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function loadImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const POSITIONS = {
  'top-left': (w, h, tw, th, pad) => [pad, pad + th],
  'top-right': (w, h, tw, th, pad) => [w - tw - pad, pad + th],
  center: (w, h, tw, th) => [(w - tw) / 2, (h + th) / 2],
  'bottom-left': (w, h, tw, th, pad) => [pad, h - pad],
  'bottom-right': (w, h, tw, th, pad) => [w - tw - pad, h - pad],
};

/**
 * Draws a text watermark onto an image and returns a preview data URL.
 * @param {File} file
 * @param {{ text: string, position: keyof typeof POSITIONS, opacity: number, fontSize: number }} opts
 * @returns {Promise<string>}
 */
export async function previewWatermark(file, opts) {
  const canvas = await renderCanvas(file, opts);
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Draws a text watermark onto an image and returns a downloadable blob.
 * @param {File} file
 * @param {{ text: string, position: keyof typeof POSITIONS, opacity: number, fontSize: number }} opts
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function applyWatermark(file, opts) {
  const canvas = await renderCanvas(file, opts);
  const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.92));
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return { blob, fileName: `${baseName}-watermarked.${ext}` };
}

async function renderCanvas(file, { text, position, opacity, fontSize }) {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const size = Math.max(12, Math.round((fontSize / 100) * img.width));
  ctx.font = `600 ${size}px Inter, sans-serif`;
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 0.6})`;
  ctx.lineWidth = Math.max(1, size / 16);
  const metrics = ctx.measureText(text || '');
  const tw = metrics.width;
  const th = size;
  const pad = Math.round(img.width * 0.03);
  const place = POSITIONS[position] || POSITIONS.center;
  const [x, y] = place(img.width, img.height, tw, th, pad);

  ctx.strokeText(text || '', x, y);
  ctx.fillText(text || '', x, y);
  return canvas;
}
