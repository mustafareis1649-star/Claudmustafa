// Runs entirely in the browser: pdf.js (loaded globally, see index.html)
// rasterizes each page to a canvas, then pdf-lib rebuilds a new PDF from the
// re-encoded, lower-quality JPEGs. This is a lossy, image-based compression —
// the same trade-off most "quick" PDF compressors make — so a footnote in
// the UI says as much. No file ever leaves the browser.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const LEVELS = {
  low: { scale: 1.5, quality: 0.85 },
  medium: { scale: 1.15, quality: 0.65 },
  high: { scale: 0.9, quality: 0.45 },
};

/**
 * @param {File} file
 * @param {'low'|'medium'|'high'} level  compression strength (high = smallest file)
 * @param {(current: number, total: number) => void} onProgress
 * @returns {Promise<{ blob: Blob, fileName: string, originalSize: number, newSize: number }>}
 */
export async function compressPdf(file, level, onProgress) {
  const { scale, quality } = LEVELS[level] || LEVELS.medium;
  const { PDFDocument } = await import('pdf-lib');

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const outDoc = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(i, numPages);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
    const jpegBytes = await (await fetch(jpegDataUrl)).arrayBuffer();
    const jpegImage = await outDoc.embedJpg(jpegBytes);

    const outPage = outDoc.addPage([viewport.width, viewport.height]);
    outPage.drawImage(jpegImage, { x: 0, y: 0, width: viewport.width, height: viewport.height });
  }

  const outBytes = await outDoc.save();
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  return { blob, fileName: file.name.replace(/\.pdf$/i, '') + '-compressed.pdf', originalSize: file.size, newSize: blob.size };
}
