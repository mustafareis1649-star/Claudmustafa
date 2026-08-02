// Runs entirely in the browser via pdf-lib — no file is ever uploaded to a
// server.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * @param {File} file
 * @returns {Promise<number>} page count
 */
export async function getPageCount(file) {
  const { PDFDocument } = await import('pdf-lib');
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

/**
 * Rebuilds a PDF with its pages in a new order.
 * @param {File} file
 * @param {number[]} order  zero-based indices of the ORIGINAL pages, in the
 *   new desired order (e.g. [2, 0, 1] puts the original 3rd page first).
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function reorderPdfPages(file, order) {
  const { PDFDocument } = await import('pdf-lib');
  const bytes = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  const outDoc = await PDFDocument.create();
  const copiedPages = await outDoc.copyPages(srcDoc, order);
  copiedPages.forEach((page) => outDoc.addPage(page));

  const outBytes = await outDoc.save();
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  return { blob, fileName: file.name.replace(/\.pdf$/i, '') + '-reordered.pdf' };
}
