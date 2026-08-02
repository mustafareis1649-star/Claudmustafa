// Runs entirely in the browser (WASM via pdf.js) — no file is ever uploaded
// to a server. `pdfjsLib` is loaded globally from the CDN script tag in
// index.html, same as in the original static site.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Converts a PDF File into a Word-openable .doc Blob, entirely client-side.
 * @param {File} file
 * @param {(current: number, total: number) => void} onProgress
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function convertPdfToWord(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  let bodyHtml = '';

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

    const pageHtml = lines
      .filter((l) => l.trim().length)
      .map((l) => `<p style="margin:0 0 10px 0;">${escapeHtml(l)}</p>`)
      .join('\n');

    bodyHtml += pageHtml;
    if (i < numPages) bodyHtml += '<br clear="all" style="page-break-before:always;">';
  }

  const docHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>${file.name}</title></head>
    <body style="font-family:Calibri, Arial, sans-serif; font-size:12pt;">
    ${bodyHtml || '<p></p>'}
    </body></html>`;

  const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
  const fileName = file.name.replace(/\.pdf$/i, '') + '.doc';
  return { blob, fileName };
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
