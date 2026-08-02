// Runs entirely in the browser via pdf-lib — no file is ever uploaded to a
// server. Each image becomes its own page, sized to the image itself (in
// points, 1 image px = 1 pt) so nothing gets cropped or stretched.
//
// This extends jpg-to-pdf's logic with WebP support: pdf-lib can only embed
// JPG and PNG directly, so a WebP source is first decoded onto a canvas and
// re-encoded as PNG bytes before being embedded.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function isWebp(file) {
  return file.type === "image/webp" || /\.webp$/i.test(file.name);
}

function isPng(file) {
  return file.type === "image/png" || /\.png$/i.test(file.name);
}

function loadImageEl(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

// Re-encodes a WebP file as PNG bytes via a canvas, since pdf-lib has no
// native WebP embedder.
async function webpToPngBytes(file) {
  const img = await loadImageEl(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  return {
    bytes: await (await fetch(dataUrl)).arrayBuffer(),
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

// A4 at 72dpi, used as a ceiling so a huge camera photo does not produce an
// absurdly large PDF page — images are scaled down (never up) to fit.
const MAX_W = 842;
const MAX_H = 1191;

/**
 * @param {File[]} files  JPG, PNG, and/or WebP images, in the desired page order
 * @param {(current: number, total: number) => void} onProgress
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function imageToPdf(files, onProgress) {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    if (onProgress) onProgress(i + 1, files.length);
    const file = files[i];

    let image, width, height;
    if (isWebp(file)) {
      const { bytes, width: w, height: h } = await webpToPngBytes(file);
      image = await doc.embedPng(bytes);
      width = w;
      height = h;
    } else {
      const bytes = await file.arrayBuffer();
      image = isPng(file) ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      const el = await loadImageEl(file);
      width = el.naturalWidth;
      height = el.naturalHeight;
    }

    const scale = Math.min(1, MAX_W / width, MAX_H / height);
    const pageW = width * scale;
    const pageH = height * scale;

    const page = doc.addPage([pageW, pageH]);
    page.drawImage(image, { x: 0, y: 0, width: pageW, height: pageH });
  }

  const outBytes = await doc.save();
  const blob = new Blob([outBytes], { type: "application/pdf" });
  return { blob, fileName: "images.pdf" };
}
