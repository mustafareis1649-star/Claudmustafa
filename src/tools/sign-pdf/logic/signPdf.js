// Runs entirely in the browser (pdf.js for rendering/preview, pdf-lib for
// writing the final file) — no file is ever uploaded to a server. The
// signature itself (drawn or typed) never leaves the canvas until it is
// baked into the PDF locally.

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
 * Bakes one or more signature images into the original PDF and returns a
 * downloadable file. Placements use ratio coordinates (0-1, origin top-left
 * of the page) so they stay correct regardless of preview zoom/scale.
 *
 * @param {File} file
 * @param {Array<{ page: number, xRatio: number, yRatio: number, widthRatio: number, aspectRatio: number, dataUrl: string }>} placements
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function applySignaturesToPdf(file, placements) {
  const { PDFDocument } = await import('pdf-lib');
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();

  // Cache embedded images per unique dataUrl, since the same signature is
  // often stamped on multiple pages/spots.
  const embedCache = new Map();

  for (const p of placements) {
    const page = pages[p.page - 1];
    if (!page) continue;
    const { width, height } = page.getSize();

    let pngImage = embedCache.get(p.dataUrl);
    if (!pngImage) {
      const pngBytes = await (await fetch(p.dataUrl)).arrayBuffer();
      pngImage = await doc.embedPng(pngBytes);
      embedCache.set(p.dataUrl, pngImage);
    }

    const drawWidth = p.widthRatio * width;
    const drawHeight = drawWidth / (p.aspectRatio || pngImage.width / pngImage.height);

    page.drawImage(pngImage, {
      x: p.xRatio * width,
      // Ratio is measured from the top of the page; PDF coordinates start
      // at the bottom-left, so flip and account for the image's height.
      y: height - p.yRatio * height - drawHeight,
      width: drawWidth,
      height: drawHeight,
    });
  }

  const outBytes = await doc.save();
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  return { blob, fileName: file.name.replace(/\.pdf$/i, '') + '-signed.pdf' };
}
