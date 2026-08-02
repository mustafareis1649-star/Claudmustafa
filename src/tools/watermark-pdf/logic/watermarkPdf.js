// Runs entirely in the browser via pdf-lib — no file is ever uploaded.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * @param {File} file
 * @param {string} text
 * @param {{ opacity?: number, fontSize?: number, color?: [number, number, number] }} [options]
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function watermarkPdf(file, text, options = {}) {
  const { PDFDocument, rgb, StandardFonts, degrees } = await import('pdf-lib');
  const { opacity = 0.25, fontSize = 48, color = [0.5, 0.5, 0.5] } = options;

  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(color[0], color[1], color[2]),
      opacity,
      rotate: degrees(45),
    });
  });

  const outBytes = await doc.save();
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  return { blob, fileName: file.name.replace(/\.pdf$/i, '') + '-watermarked.pdf' };
}
