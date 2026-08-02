// Runs entirely in the browser: pdf.js (loaded globally, see index.html)
// rasterizes each page to a canvas, then each canvas is exported as a PNG.
// Unlike JPG, PNG supports transparency, so — unlike pdfToJpg — we do not
// paint a white background first; any transparent regions in the source
// page are preserved. A single-page PDF downloads as one .png; a
// multi-page PDF is zipped (jszip) into one .png per page. No file ever
// leaves the browser.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// PNG is lossless, so "quality" only controls the render resolution (scale)
// — there is no compression-quality knob like JPG's.
const SCALE = {
  low: 1.25,
  medium: 2,
  high: 3,
};

/**
 * @param {File} file
 * @param {"low"|"medium"|"high"} level  resolution (high = largest, sharpest)
 * @param {(current: number, total: number) => void} onProgress
 * @returns {Promise<{ blob: Blob, fileName: string, pageCount: number }>}
 */
export async function pdfToPng(file, level, onProgress) {
  const scale = SCALE[level] || SCALE.medium;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const baseName = file.name.replace(/\.pdf$/i, "");

  const pages = [];
  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(i, numPages);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    // No background fill here on purpose — transparent areas of the PDF
    // page stay transparent in the exported PNG.
    await page.render({ canvasContext: ctx, viewport }).promise;

    const pngDataUrl = canvas.toDataURL("image/png");
    const pngBytes = await (await fetch(pngDataUrl)).arrayBuffer();
    pages.push(pngBytes);
  }

  if (numPages === 1) {
    const blob = new Blob([pages[0]], { type: "image/png" });
    return { blob, fileName: `${baseName}.png`, pageCount: 1 };
  }

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  pages.forEach((bytes, i) => {
    const num = String(i + 1).padStart(String(numPages).length, "0");
    zip.file(`${baseName}-page-${num}.png`, bytes);
  });
  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, fileName: `${baseName}-png.zip`, pageCount: numPages };
}
