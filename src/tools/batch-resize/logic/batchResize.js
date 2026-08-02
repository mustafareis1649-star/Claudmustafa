// Runs entirely in the browser (Canvas API) — no file is ever uploaded to a
// server. Multiple resized images are packed into a single .zip so the
// visitor still only downloads one file, same rule as every other tool here.

import JSZip from 'jszip';

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Resizes every given image file to targetWidth x targetHeight and returns
 * a single .zip blob containing all of them.
 * @param {File[]} files
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {(current: number, total: number) => void} onProgress
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function batchResize(files, targetWidth, targetHeight, onProgress) {
  const zip = new JSZip();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (onProgress) onProgress(i + 1, files.length);

    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    const outName = file.name.replace(/\.[^.]+$/, '') + `-${targetWidth}x${targetHeight}.jpg`;
    zip.file(outName, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return { blob: zipBlob, fileName: `resized-${targetWidth}x${targetHeight}.zip` };
}
