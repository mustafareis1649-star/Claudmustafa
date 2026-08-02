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

/**
 * Applies the same brightness/contrast adjustment and returns a
 * downloadable blob in the image's original format.
 * @param {File} file
 * @param {number} brightness
 * @param {number} contrast
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function applyAdjust(file, brightness, contrast) {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  const b = 100 + brightness;
  const c = 100 + contrast;
  ctx.filter = `brightness(${b}%) contrast(${c}%)`;
  ctx.drawImage(img, 0, 0);

  const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.92));
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '');
  return { blob, fileName: `${baseName}-adjusted.${ext}` };
}
