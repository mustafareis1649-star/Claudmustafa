// Runs entirely in the browser via pdf-lib — no file is ever uploaded to a
// server. Each image becomes its own page, sized to the image itself (in
// points, 1 image px = 1 pt) so nothing gets cropped or stretched.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function readAsArrayBuffer(file) {
  return file.arrayBuffer();
}

function loadImageSize(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

// A4 at 72dpi, used as a ceiling so a huge camera photo does not produce an
// absurdly large PDF page — images are scaled down (never up) to fit.
const MAX_W = 842;
const MAX_H = 1191;

/**
 * @param {File[]} files  JPG and/or PNG images, in the desired page order
 * @param {(current: number, total: number) => void} onProgress
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function jpgToPdf(files, onProgress) {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    if (onProgress) onProgress(i + 1, files.length);
    const file = files[i];
    const bytes = await readAsArrayBuffer(file);
    const isPng = file.type === "image/png" || /\.png$/i.test(file.name);
    const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);

    const { width, height } = await loadImageSize(file);
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
