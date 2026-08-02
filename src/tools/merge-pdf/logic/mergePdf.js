// Runs entirely in the browser via pdf-lib (WASM-free, pure JS) — no file is
// ever uploaded to a server.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Merges several PDF files into a single PDF, in the given order.
 * @param {File[]} files
 * @param {(current: number, total: number) => void} onProgress
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function mergePdfs(files, onProgress) {
  const { PDFDocument } = await import('pdf-lib');
  const merged = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    if (onProgress) onProgress(i + 1, files.length);
    const bytes = await files[i].arrayBuffer();
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }

  const outBytes = await merged.save();
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  return { blob, fileName: 'merged.pdf' };
}
