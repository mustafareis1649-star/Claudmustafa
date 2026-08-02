// Runs entirely in the browser via pdf-lib — no file is ever uploaded to a
// server. This is the inverse of delete-pdf-pages: instead of removing the
// listed pages, only the listed pages are kept, copied into a brand-new
// document in ascending order.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/**
 * Parses a page-range string like "1,3,5-7" into a Set of zero-based page
 * indices. Throws with a descriptive message on malformed or out-of-range
 * input so the UI can surface it directly.
 * @param {string} input
 * @param {number} pageCount
 * @returns {Set<number>}
 */
export function parsePageSelection(input, pageCount) {
  const indices = new Set();
  const parts = input.split(",").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) throw new Error("format");

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      let a = parseInt(rangeMatch[1], 10);
      let b = parseInt(rangeMatch[2], 10);
      if (a > b) [a, b] = [b, a];
      for (let n = a; n <= b; n++) {
        if (n < 1 || n > pageCount) throw new Error("range");
        indices.add(n - 1);
      }
      continue;
    }
    if (/^\d+$/.test(part)) {
      const n = parseInt(part, 10);
      if (n < 1 || n > pageCount) throw new Error("range");
      indices.add(n - 1);
      continue;
    }
    throw new Error("format");
  }

  return indices;
}

/**
 * @param {File} file
 * @param {Set<number>} pageIndices  zero-based indices of pages to keep
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function extractPdfPages(file, pageIndices) {
  const { PDFDocument } = await import("pdf-lib");
  const bytes = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  const sortedIndices = Array.from(pageIndices).sort((a, b) => a - b);
  const outDoc = await PDFDocument.create();
  const copiedPages = await outDoc.copyPages(srcDoc, sortedIndices);
  copiedPages.forEach((page) => outDoc.addPage(page));

  const outBytes = await outDoc.save();
  const blob = new Blob([outBytes], { type: "application/pdf" });
  return { blob, fileName: file.name.replace(/\.pdf$/i, "") + "-extracted.pdf" };
}
