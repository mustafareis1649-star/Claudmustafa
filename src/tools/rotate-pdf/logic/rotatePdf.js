// Runs entirely in the browser via pdf-lib — no file is ever uploaded.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * @param {File} file
 * @param {number} degrees  90, 180, or 270 (clockwise)
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function rotatePdf(file, degrees) {
  const { PDFDocument, degrees: pdfDegrees } = await import('pdf-lib');
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  doc.getPages().forEach((page) => {
    const current = page.getRotation().angle;
    page.setRotation(pdfDegrees((current + degrees) % 360));
  });

  const outBytes = await doc.save();
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  return { blob, fileName: file.name.replace(/\.pdf$/i, '') + '-rotated.pdf' };
}
