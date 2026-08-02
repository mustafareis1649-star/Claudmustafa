// Runs entirely in the browser: pdf.js (loaded globally, see index.html)
// rasterizes each page to a canvas, a grayscale filter is applied pixel by
// pixel, then pdf-lib rebuilds a new PDF from the resulting images — sized
// to match each original page's point dimensions so nothing shifts or
// crops. No file ever leaves the browser.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Render resolution relative to the PDF's own point size — higher looks
// sharper but produces a larger file.
const SCALE = {
  low: 1.25,
  medium: 2,
  high: 3,
};

function toGrayscale(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Luminosity-weighted grayscale (matches how the eye perceives
    // brightness better than a flat average).
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * @param {File} file
 * @param {"low"|"medium"|"high"} level
 * @param {(current: number, total: number) => void} onProgress
 * @returns {Promise<{ blob: Blob, fileName: string, pageCount: number }>}
 */
export async function grayscalePdf(file, level, onProgress) {
  const scale = SCALE[level] || SCALE.medium;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  const numPages = pdf.numPages;

  const { PDFDocument } = await import("pdf-lib");
  const outDoc = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(i, numPages);
    const page = await pdf.getPage(i);

    // Original page size in PDF points, used for the output page so the
    // grayscale file matches the source's dimensions exactly.
    const pointViewport = page.getViewport({ scale: 1 });
    const renderViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(renderViewport.width);
    canvas.height = Math.round(renderViewport.height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
    toGrayscale(ctx, canvas.width, canvas.height);

    const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const jpegBytes = await (await fetch(jpegDataUrl)).arrayBuffer();
    const image = await outDoc.embedJpg(jpegBytes);

    const outPage = outDoc.addPage([pointViewport.width, pointViewport.height]);
    outPage.drawImage(image, { x: 0, y: 0, width: pointViewport.width, height: pointViewport.height });
  }

  const outBytes = await outDoc.save();
  const blob = new Blob([outBytes], { type: "application/pdf" });
  const fileName = file.name.replace(/\.pdf$/i, "") + "-grayscale.pdf";
  return { blob, fileName, pageCount: numPages };
}
