// Runs entirely in the browser (SheetJS to read the .xlsx, pdf-lib to write
// the .pdf) — no file is ever uploaded to a server. Each worksheet is drawn
// as a simple ruled table, one or more PDF pages per sheet as needed. This
// is a data-fidelity conversion (values + grid), not a pixel-perfect replica
// of Excel's own formatting, colors, or charts.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const PAGE_WIDTH = 841.89; // A4 landscape at 72dpi — wider tables fit better
const PAGE_HEIGHT = 595.28;
const MARGIN = 40;
const HEADER_SIZE = 9;
const CELL_SIZE = 8.5;
const ROW_HEIGHT = 20;
const MAX_COLS = 10; // beyond this, columns get clipped rather than shrunk to illegibility

function truncateToWidth(text, font, size, maxWidth) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = text.slice(0, mid) + '…';
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? text.slice(0, lo) + '…' : '';
}

/**
 * Converts an .xlsx/.xls File into a Blob PDF, entirely client-side.
 * @param {File} file
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function convertExcelToPdf(file) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const arrayBuffer = await file.arrayBuffer();

  const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const usableWidth = PAGE_WIDTH - MARGIN * 2;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    if (!rows.length) continue;

    const colCount = Math.min(MAX_COLS, Math.max(...rows.map((r) => r.length)) || 1);
    const colWidth = usableWidth / colCount;

    let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    // Sheet title
    page.drawText(sheetName, { x: MARGIN, y: y - HEADER_SIZE, size: 13, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    y -= HEADER_SIZE + 16;

    function newPage() {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }

    rows.forEach((row, rowIndex) => {
      if (y - ROW_HEIGHT < MARGIN) newPage();

      const isHeaderRow = rowIndex === 0;
      const rowFont = isHeaderRow ? boldFont : font;
      const size = isHeaderRow ? HEADER_SIZE : CELL_SIZE;

      // Row separator line
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: MARGIN + colWidth * colCount, y },
        thickness: 0.5,
        color: rgb(0.85, 0.85, 0.85),
      });

      for (let c = 0; c < colCount; c++) {
        const raw = row[c];
        const text = raw === undefined || raw === null ? '' : String(raw);
        const cellX = MARGIN + c * colWidth + 4;
        const truncated = truncateToWidth(text, rowFont, size, colWidth - 8);
        if (truncated) {
          page.drawText(truncated, { x: cellX, y: y - ROW_HEIGHT + 6, size, font: rowFont, color: rgb(0.15, 0.15, 0.15) });
        }
      }

      y -= ROW_HEIGHT;
    });

    // Bottom border of the last row drawn on this page
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + colWidth * colCount, y },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
  }

  if (doc.getPageCount() === 0) doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const outBytes = await doc.save();
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  const fileName = file.name.replace(/\.xlsx?$/i, '') + '.pdf';
  return { blob, fileName };
}
