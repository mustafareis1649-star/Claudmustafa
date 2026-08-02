// Runs entirely in the browser via WASM + an on-device AI segmentation
// model — the photo itself is never uploaded anywhere. The model weights
// (a few tens of MB) are fetched from a CDN the first time this tool is
// used on a given device and then cached by the browser, so only the very
// first run needs a network connection; the image itself never leaves it.
//
// The library is dynamically imported so its (fairly large) code only ever
// ships to visitors who actually open this tool.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * @param {File} file
 * @param {(ratio: number) => void} [onProgress] 0–1
 * @returns {Promise<{ blob: Blob, fileName: string, originalSize: number, newSize: number }>}
 */
export async function removeImageBackground(file, onProgress) {
  const { removeBackground } = await import('@imgly/background-removal');

  const blob = await removeBackground(file, {
    progress: (_key, current, total) => {
      if (onProgress && total) onProgress(current / total);
    },
  });

  const fileName = file.name.replace(/\.[^.]+$/, '') + '-no-bg.png';
  return { blob, fileName, originalSize: file.size, newSize: blob.size };
}
