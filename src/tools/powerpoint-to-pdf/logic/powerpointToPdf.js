// Runs entirely in the browser (jszip reads the .pptx, pdf-lib writes the
// .pdf) — no file is ever uploaded to a server.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const PAGE_WIDTH = 792; // 11in landscape at 72dpi, matches 16:9-ish slides
const PAGE_HEIGHT = 594;
const MARGIN = 50;
const TITLE_SIZE = 22;
const BODY_SIZE = 13;
const LINE_GAP = 1.35;

function wrapParagraph(text, font, size, maxWidth) {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? current + ' ' + word : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Extracts each slide's paragraphs of text from its raw XML. A paragraph
 * is a <a:p> element; its text is every <a:t> run inside it, concatenated.
 */
function extractParagraphs(slideXmlText) {
  const doc = new DOMParser().parseFromString(slideXmlText, 'application/xml');
  const paragraphs = Array.from(doc.getElementsByTagName('a:p'));
  return paragraphs
    .map((p) => {
      const runs = Array.from(p.getElementsByTagName('a:t'));
      return runs.map((r) => r.textContent).join('').trim();
    })
    .filter((text) => text.length);
}

/**
 * Converts a .pptx File into a Blob PDF, entirely client-side. One PDF
 * page per slide; the first paragraph on each slide is drawn as a title,
 * the rest as body text. Visual styling, images, and animations do not
 * carry over — this is a text-fidelity conversion.
 *
 * @param {File} file
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function convertPowerpointToPdf(file) {
  const JSZip = (await import('jszip')).default;
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml$/)[1], 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml$/)[1], 10);
      return na - nb;
    });

  if (slideFiles.length === 0) {
    throw new Error('No slides found in this file.');
  }

  const doc = await PDFDocument.create();
  const bodyFont = await doc.embedFont(StandardFonts.Helvetica);
  const titleFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  for (const slidePath of slideFiles) {
    const xmlText = await zip.file(slidePath).async('text');
    const paragraphs = extractParagraphs(xmlText);
    const title = paragraphs[0] || '';
    const body = paragraphs.slice(1);

    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    if (title) {
      const titleLines = wrapParagraph(title, titleFont, TITLE_SIZE, maxWidth);
      titleLines.forEach((line) => {
        page.drawText(line, { x: MARGIN, y: y - TITLE_SIZE, size: TITLE_SIZE, font: titleFont, color: rgb(0.12, 0.15, 0.22) });
        y -= TITLE_SIZE * LINE_GAP;
      });
      y -= TITLE_SIZE * 0.5;
    }

    for (const paragraph of body) {
      const lines = wrapParagraph(paragraph, bodyFont, BODY_SIZE, maxWidth);
      for (const line of lines) {
        if (y - BODY_SIZE * LINE_GAP < MARGIN) break; // slide's text overflows one page; best-effort
        page.drawText(line, { x: MARGIN, y: y - BODY_SIZE, size: BODY_SIZE, font: bodyFont, color: rgb(0.15, 0.15, 0.15) });
        y -= BODY_SIZE * LINE_GAP;
      }
      y -= BODY_SIZE * 0.6;
    }
  }

  const outBytes = await doc.save();
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  const fileName = file.name.replace(/\.pptx?$/i, '') + '.pdf';
  return { blob, fileName };
}
