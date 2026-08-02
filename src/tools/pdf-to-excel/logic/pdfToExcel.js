// Runs entirely in the browser — no file is ever uploaded to a server.
// pdf.js (window.pdfjsLib) extracts each page's positioned text, which we
// regroup into rows/columns by clustering on Y (line) then X (cell) gaps.
// SheetJS (window.XLSX) then writes the result as a real .xlsx workbook —
// one sheet per PDF page. This is a best-effort reconstruction of tabular
// layout, not OCR: it works well for text that pdf.js can already extract
// (invoices, statements, exported reports), not for scanned/image PDFs.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Any horizontal gap between two text items bigger than this many PDF points
// is treated as a column boundary rather than just a space within a cell.
const COLUMN_GAP_THRESHOLD = 10;

/**
 * Groups a page's raw text items into rows (by Y) and, within each row,
 * into cells (by X gaps).
 */
function itemsToRows(items) {
  const lines = [];
  let currentY = null;
  let currentLine = [];

  items.forEach((item) => {
    const y = Math.round(item.transform[5]);
    const x = item.transform[4];
    if (currentY === null || Math.abs(y - currentY) > 3) {
      if (currentLine.length) lines.push(currentLine);
      currentLine = [{ x, str: item.str, width: item.width || 0 }];
      currentY = y;
    } else {
      currentLine.push({ x, str: item.str, width: item.width || 0 });
    }
  });
  if (currentLine.length) lines.push(currentLine);

  return lines.map((line) => {
    line.sort((a, b) => a.x - b.x);
    const cells = [];
    let cell = '';
    let lastEnd = null;
    for (const piece of line) {
      if (lastEnd !== null && piece.x - lastEnd > COLUMN_GAP_THRESHOLD) {
        cells.push(cell.trim());
        cell = piece.str;
      } else {
        cell += (cell && !cell.endsWith(' ') ? ' ' : '') + piece.str;
      }
      lastEnd = piece.x + piece.width;
    }
    if (cell) cells.push(cell.trim());
    return cells.filter((c) => c.length);
  }).filter((row) => row.length);
}

/**
 * Converts a PDF File into an .xlsx Blob, entirely client-side.
 * @param {File} file
 * @param {(current: number, total: number) => void} onProgress
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function convertPdfToExcel(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const wb = window.XLSX.utils.book_new();
  let sheetsAdded = 0;

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(i, numPages);

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const rows = itemsToRows(textContent.items);

    if (rows.length) {
      const ws = window.XLSX.utils.aoa_to_sheet(rows);
      window.XLSX.utils.book_append_sheet(wb, ws, `Page ${i}`);
      sheetsAdded++;
    }
  }

  // A workbook needs at least one sheet — guard against a fully blank/
  // image-only PDF producing no extractable rows at all.
  if (sheetsAdded === 0) {
    const ws = window.XLSX.utils.aoa_to_sheet([['No text could be extracted from this PDF.']]);
    window.XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  }

  const out = window.XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = file.name.replace(/\.pdf$/i, '') + '.xlsx';
  return { blob, fileName };
}
