// Runs entirely in the browser via pdf-lib — no file is ever uploaded.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Inserts one or more blank pages into a PDF.
 * @param {File} file
 * @param {{ position: 'start'|'end'|'after', afterPage?: number, count?: number }} options
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function addBlankPage(file, options = {}) {
  const { PDFDocument } = await import('pdf-lib');
  const { position = 'end', afterPage = 1, count = 1 } = options;

  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  const pageCount = doc.getPageCount();
  // Use the size of an existing page so the blank page matches the document.
  const refPage = doc.getPage(Math.min(Math.max(afterPage - 1, 0), pageCount - 1));
  const { width, height } = refPage.getSize();

  let insertAt;
  if (position === 'start') insertAt = 0;
  else if (position === 'end') insertAt = pageCount;
  else insertAt = Math.min(Math.max(afterPage, 0), pageCount);

  for (let i = 0; i < count; i++) {
    doc.insertPage(insertAt + i, [width, height]);
  }

  const outBytes = await doc.save();
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  return { blob, fileName: file.name.replace(/\.pdf$/i, '') + '-with-blank-page.pdf' };
}

/**
 * @param {File} file
 * @returns {Promise<number>} page count, so the UI can offer a valid "after page N" range
 */
export async function getPageCount(file) {
  const { PDFDocument } = await import('pdf-lib');
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}
