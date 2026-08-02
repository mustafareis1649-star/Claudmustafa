// Runs entirely in the browser via the Canvas API — the image is never
// uploaded anywhere. We re-encode as JPEG/WebP at a chosen quality and
// (optionally) cap the longest side, then hand back a single blob.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * @param {File} file
 * @param {number} quality       0.1–1.0
 * @param {number} maxDimension  longest side in px, 0 = keep original size
 * @param {'image/jpeg'|'image/webp'} mimeType
 * @returns {Promise<{ blob: Blob, fileName: string, originalSize: number, newSize: number }>}
 */
export async function compressImage(file, quality, maxDimension, mimeType = 'image/jpeg') {
  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;
  if (maxDimension && Math.max(width, height) > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // JPEG/WebP have no alpha-safe transparent background, so flatten onto
  // white first — otherwise transparent PNGs turn black on export.
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
  const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
  const fileName = file.name.replace(/\.[^.]+$/, '') + `-compressed.${ext}`;

  return { blob, fileName, originalSize: file.size, newSize: blob.size };
}
