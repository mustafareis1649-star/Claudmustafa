// Runs entirely in the browser via pdf-lib — no file is ever uploaded.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const POSITIONS = {
  'bottom-center': (w, h, tw) => ({ x: (w - tw) / 2, y: 24 }),
  'bottom-right': (w, h, tw) => ({ x: w - tw - 32, y: 24 }),
  'bottom-left': (w, h, tw) => ({ x: 32, y: 24 }),
  'top-center': (w, h, tw) => ({ x: (w - tw) / 2, y: h - 40 }),
  'top-right': (w, h, tw) => ({ x: w - tw - 32, y: h - 40 }),
  'top-left': (w, h, tw) => ({ x: 32, y: h - 40 }),
};

/**
 * @param {File} file
 * @param {object} opts
 * @param {keyof POSITIONS} opts.position
 * @param {number} opts.startAt   first page number to use
 * @param {string} opts.format    template, {n} = number, {total} = page count
 * @param {number} opts.fontSize
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function addPageNumbers(file, opts) {
  const { position = 'bottom-center', startAt = 1, format = '{n}', fontSize = 11 } = opts;
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const placer = POSITIONS[position] || POSITIONS['bottom-center'];

  pages.forEach((page, i) => {
    const label = format
      .replace('{n}', String(startAt + i))
      .replace('{total}', String(pages.length));
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(label, fontSize);
    const { x, y } = placer(width, height, textWidth);
    page.drawText(label, { x, y, size: fontSize, font, color: rgb(0.35, 0.35, 0.4) });
  });

  const outBytes = await doc.save();
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  return { blob, fileName: file.name.replace(/\.pdf$/i, '') + '-numbered.pdf' };
}
