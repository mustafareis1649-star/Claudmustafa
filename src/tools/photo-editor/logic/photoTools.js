// Runs entirely in the browser via <canvas> — no file is ever uploaded to a
// server. Framework-free, same as tools/pdf-tools/logic/pdfToWord.js.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export const OUTPUT_FORMATS = [
  { mime: 'image/png', ext: 'png', label: 'PNG', lossy: false },
  { mime: 'image/jpeg', ext: 'jpg', label: 'JPG', lossy: true },
  { mime: 'image/webp', ext: 'webp', label: 'WEBP', lossy: true },
];

/**
 * Loads a File into an HTMLImageElement plus its natural size.
 * @param {File} file
 * @returns {Promise<{ img: HTMLImageElement, url: string, width: number, height: number }>}
 */
export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Could not read this image.'));
    img.src = url;
  });
}

/**
 * Draws `img` resized to width x height onto a new canvas.
 * @param {HTMLImageElement} img
 * @param {number} width
 * @param {number} height
 */
export function resizeToCanvas(img, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Crops `img` to a rectangle given in the image's own natural pixel
 * coordinates (i.e. already un-scaled from whatever preview size was shown
 * on screen).
 * @param {HTMLImageElement} img
 * @param {{ x: number, y: number, width: number, height: number }} rect
 */
export function cropToCanvas(img, rect) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(rect.width));
  canvas.height = Math.max(1, Math.round(rect.height));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    img,
    Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height),
    0, 0, canvas.width, canvas.height
  );
  return canvas;
}

/**
 * Redraws `img` at its natural size onto a canvas — used just before format
 * conversion when no resize/crop was applied.
 */
export function toCanvas(img) {
  return resizeToCanvas(img, img.naturalWidth, img.naturalHeight);
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} mime e.g. 'image/png'
 * @param {number} [quality] 0..1, only used for lossy formats
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Export failed.'))),
      mime,
      quality
    );
  });
}

export function suggestedFileName(originalName, ext) {
  const base = originalName.replace(/\.[^.]+$/, '');
  return `${base}.${ext}`;
}
