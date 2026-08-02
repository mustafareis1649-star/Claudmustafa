// Runs entirely in the browser (pdf.js via window.pdfjsLib) — no file is
// ever uploaded to a server.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Converts a PDF File into a plain .txt Blob, entirely client-side.
 * Groups each page's positioned text items into lines by Y-coordinate,
 * same clustering approach as the PDF to Word tool.
 *
 * @param {File} file
 * @param {(current: number, total: number) => void} onProgress
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function convertPdfToText(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const pageTexts = [];

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(i, numPages);

    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    const lines = [];
    let currentY = null;
    let currentLine = [];
    textContent.items.forEach((item) => {
      const y = Math.round(item.transform[5]);
      if (currentY === null || Math.abs(y - currentY) > 3) {
        if (currentLine.length) lines.push(currentLine.join(' '));
        currentLine = [item.str];
        currentY = y;
      } else {
        currentLine.push(item.str);
      }
    });
    if (currentLine.length) lines.push(currentLine.join(' '));

    pageTexts.push(lines.join('\n'));
  }

  const fullText = pageTexts.join('\n\n');
  const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  const fileName = file.name.replace(/\.pdf$/i, '') + '.txt';
  return { blob, fileName };
}
