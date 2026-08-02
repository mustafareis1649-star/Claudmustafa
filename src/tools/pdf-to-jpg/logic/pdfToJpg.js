// Runs entirely in the browser: pdf.js (loaded globally, see index.html)
// rasterizes each page to a canvas, then each canvas is exported as a JPG.
// A single-page PDF downloads as one .jpg; a multi-page PDF is zipped
// (jszip) into one .jpg per page. No file ever leaves the browser.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const QUALITY = {
  low: { scale: 1.25, quality: 0.75 },
  medium: { scale: 2, quality: 0.9 },
  high: { scale: 3, quality: 0.95 },
};

/**
 * @param {File} file
 * @param {"low"|"medium"|"high"} level  image quality (high = largest, sharpest)
 * @param {(current: number, total: number) => void} onProgress
 * @returns {Promise<{ blob: Blob, fileName: string, pageCount: number }>}
 */
export async function pdfToJpg(file, level, onProgress) {
  const { scale, quality } = QUALITY[level] || QUALITY.medium;
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
    // JPG has no transparency — fill white first so scanned/transparent
    // PDFs do not turn black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);
    const jpegBytes = await (await fetch(jpegDataUrl)).arrayBuffer();
    pages.push(jpegBytes);
  }

  if (numPages === 1) {
    const blob = new Blob([pages[0]], { type: "image/jpeg" });
    return { blob, fileName: `${baseName}.jpg`, pageCount: 1 };
  }

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  pages.forEach((bytes, i) => {
    const num = String(i + 1).padStart(String(numPages).length, "0");
    zip.file(`${baseName}-page-${num}.jpg`, bytes);
  });
  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, fileName: `${baseName}-jpg.zip`, pageCount: numPages };
}
