// Runs entirely in the browser (pdf.js for rendering/preview, pdf-lib for
// writing the final file) — no file is ever uploaded to a server.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Loads a PDF with pdf.js so pages can be rendered to a canvas for preview.
 * @param {ArrayBuffer} arrayBuffer
 */
export async function loadPdfForPreview(arrayBuffer) {
  // pdf.js detaches/consumes the buffer it's given, so hand it a copy —
  // the caller (and pdf-lib later) still needs the original bytes intact.
  return window.pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
}

/**
 * Renders one page of a pdf.js document onto a canvas element.
 * @param {*} pdf pdf.js document proxy
 * @param {number} pageNumber 1-indexed
 * @param {HTMLCanvasElement} canvas
 * @param {number} scale
 * @returns {Promise<{ width: number, height: number }>} rendered size in CSS px
 */
export async function renderPageToCanvas(pdf, pageNumber, canvas, scale = 1.4) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;
  return { width: viewport.width, height: viewport.height };
}

/**
 * Bakes text annotations into the original PDF and returns a downloadable file.
 * Annotations use ratio coordinates (0-1, origin top-left of the page) so they
 * stay correct regardless of preview zoom/scale.
 *
 * @param {File} file
 * @param {Array<{ page: number, xRatio: number, yRatio: number, text: string, fontSize?: number, color?: [number, number, number] }>} annotations
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function applyEditsToPdf(file, annotations) {
  const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  for (const note of annotations) {
    if (!note.text?.trim()) continue;
    const page = pages[note.page - 1];
    if (!page) continue;
    const { width, height } = page.getSize();
    const fontSize = note.fontSize || 16;
    const [r, g, b] = note.color || [0.1, 0.1, 0.1];
    page.drawText(note.text, {
      x: note.xRatio * width,
      // Ratio is measured from the top of the page; PDF coordinates start
      // at the bottom, and drawText anchors at the text baseline.
      y: height - note.yRatio * height - fontSize,
      size: fontSize,
      font,
      color: rgb(r, g, b),
    });
  }

  const outBytes = await doc.save();
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  return { blob, fileName: file.name.replace(/\.pdf$/i, '') + '-edited.pdf' };
}
