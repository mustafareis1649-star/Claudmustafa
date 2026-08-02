// Runs entirely in the browser — the photo is never uploaded anywhere.
// Browsers can't decode HEIC/HEIF natively (except Safari, inconsistently),
// so this delegates the actual decode+encode to heic2any, a WASM build of
// libheif. It's a large dependency, so it's dynamically imported here —
// only visitors who actually use this tool pay for downloading it.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * @param {File} file
 * @param {number} quality 0.1–1.0
 * @returns {Promise<{ blob: Blob, fileName: string, originalSize: number, newSize: number }>}
 */
export async function convertHeicToJpg(file, quality = 0.85) {
  const { default: heic2any } = await import('heic2any');

  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality });
  // A HEIC "burst" file can contain multiple images; heic2any then returns
  // an array. We only ever show/download the first frame.
  const blob = Array.isArray(converted) ? converted[0] : converted;

  const fileName = file.name.replace(/\.[^.]+$/i, '') + '.jpg';
  return { blob, fileName, originalSize: file.size, newSize: blob.size };
}
