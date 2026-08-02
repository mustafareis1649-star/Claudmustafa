// Runs entirely in the browser via pdf-lib + jszip — no file is ever
// uploaded to a server.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Splits a PDF into one file per page and returns them zipped.
 * @param {File} file
 * @param {(current: number, total: number) => void} onProgress
 * @returns {Promise<{ blob: Blob, fileName: string, pageCount: number }>}
 */
export async function splitPdf(file, onProgress) {
  const { PDFDocument } = await import('pdf-lib');
  const JSZip = (await import('jszip')).default;

  const bytes = await file.arrayBuffer();
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pageCount = src.getPageCount();
  const zip = new JSZip();
  const baseName = file.name.replace(/\.pdf$/i, '');

  for (let i = 0; i < pageCount; i++) {
    if (onProgress) onProgress(i + 1, pageCount);
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(src, [i]);
    doc.addPage(page);
    const outBytes = await doc.save();
    const num = String(i + 1).padStart(String(pageCount).length, '0');
    zip.file(`${baseName}-page-${num}.pdf`, outBytes);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, fileName: `${baseName}-split.zip`, pageCount };
}
