// Runs entirely in the browser via the Canvas API — the image is never
// uploaded anywhere. We decode the PNG and re-encode it as WebP, which
// keeps transparency (WebP supports alpha, unlike JPEG) while typically
// producing a noticeably smaller file.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * @param {File} file
 * @param {number} quality 0.1–1.0
 * @returns {Promise<{ blob: Blob, fileName: string, originalSize: number, newSize: number }>}
 */
export async function convertPngToWebp(file, quality = 0.85) {
  const bitmap = await createImageBitmap(file);

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob) throw new Error('encode_failed');

  const fileName = file.name.replace(/\.[^.]+$/, '') + '.webp';
  return { blob, fileName, originalSize: file.size, newSize: blob.size };
}
