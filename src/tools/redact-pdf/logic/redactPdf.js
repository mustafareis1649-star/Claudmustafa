// Runs entirely in the browser (pdf.js for rendering, pdf-lib for writing) —
// no file is ever uploaded to a server.
//
// A black rectangle drawn *on top of* the original vector/text content is
// not real redaction — the text underneath is still selectable/extractable.
// So instead: every page is rasterized to a canvas at high scale, the
// selected areas are painted solid black on that canvas, and the canvas
// becomes the page in a brand-new PDF. The original text layer never makes
// it into the output file.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * @param {ArrayBuffer} arrayBuffer
 */
export async function loadPdfForPreview(arrayBuffer) {
  // pdf.js detaches/consumes the buffer it's given, so hand it a copy.
  return window.pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
}

/**
 * @param {*} pdf pdf.js document proxy
 * @param {number} pageNumber 1-indexed
 * @param {HTMLCanvasElement} canvas
 * @param {number} scale
 * @returns {Promise<{ width: number, height: number }>}
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
 * Rasterizes every page, paints the redaction boxes solid black, and
 * assembles the result into a new PDF.
 *
 * @param {File} file
 * @param {Array<{ page: number, xRatio: number, yRatio: number, widthRatio: number, heightRatio: number }>} boxes
 * @param {number} totalPages
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function applyRedactions(file, boxes, totalPages) {
  const bytes = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: bytes.slice(0) }).promise;
  const { PDFDocument } = await import('pdf-lib');
  const outDoc = await PDFDocument.create();

  const RENDER_SCALE = 2; // rasterize at 2x so the flattened output stays crisp

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const renderViewport = page.getViewport({ scale: RENDER_SCALE });
    const pageViewport = page.getViewport({ scale: 1 });

    const canvas = document.createElement('canvas');
    canvas.width = renderViewport.width;
    canvas.height = renderViewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;

    ctx.fillStyle = '#000000';
    for (const b of boxes.filter((x) => x.page === pageNumber)) {
      ctx.fillRect(
        b.xRatio * canvas.width,
        b.yRatio * canvas.height,
        b.widthRatio * canvas.width,
        b.heightRatio * canvas.height
      );
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const jpgBytes = await (await fetch(dataUrl)).arrayBuffer();
    const jpgImage = await outDoc.embedJpg(jpgBytes);

    const outPage = outDoc.addPage([pageViewport.width, pageViewport.height]);
    outPage.drawImage(jpgImage, { x: 0, y: 0, width: pageViewport.width, height: pageViewport.height });
  }

  const outBytes = await outDoc.save();
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  return { blob, fileName: file.name.replace(/\.pdf$/i, '') + '-redacted.pdf' };
}
