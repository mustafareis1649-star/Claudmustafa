// Runs entirely in the browser (mammoth.js to read the .docx, pdf-lib to
// write the .pdf) — no file is ever uploaded to a server.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const PAGE_WIDTH = 595.28; // A4 at 72dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const BODY_SIZE = 11;
const HEADING_SIZE = 15;
const LINE_GAP = 1.35;

/**
 * Wraps a single paragraph's text into lines that fit maxWidth, using the
 * given pdf-lib font/size to measure.
 */
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
 * Converts a .docx File into a Blob PDF, entirely client-side.
 * Text and paragraph/heading structure carry over; visual styling
 * (colors, exact fonts, images) does not — this is a text-fidelity
 * conversion, not a pixel-perfect one.
 *
 * @param {File} file
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function convertWordToPdf(file) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const arrayBuffer = await file.arrayBuffer();

  // mammoth's browser build attaches itself to window.mammoth (see index.html).
  const { value: html } = await window.mammoth.convertToHtml({ arrayBuffer });

  // Parse the (simple, mammoth-generated) HTML into an ordered list of
  // blocks we can lay out: headings, paragraphs, and list items.
  const container = document.createElement('div');
  container.innerHTML = html;
  const blocks = [];
  container.childNodes.forEach((node) => {
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    const text = node.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    if (/^h[1-6]$/.test(tag)) blocks.push({ type: 'heading', text });
    else if (tag === 'li') blocks.push({ type: 'listitem', text });
    else blocks.push({ type: 'paragraph', text });
  });
  if (blocks.length === 0) {
    const raw = container.textContent.replace(/\s+/g, ' ').trim();
    if (raw) blocks.push({ type: 'paragraph', text: raw });
  }

  const doc = await PDFDocument.create();
  const bodyFont = await doc.embedFont(StandardFonts.Helvetica);
  const headingFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function newPage() {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  }

  function drawLine(text, font, size, indent = 0) {
    const lineHeight = size * LINE_GAP;
    if (y - lineHeight < MARGIN) newPage();
    page.drawText(text, { x: MARGIN + indent, y: y - size, size, font, color: rgb(0.1, 0.1, 0.1) });
    y -= lineHeight;
  }

  for (const block of blocks) {
    if (block.type === 'heading') {
      y -= HEADING_SIZE * 0.4;
      const lines = wrapParagraph(block.text, headingFont, HEADING_SIZE, maxWidth);
      lines.forEach((line) => drawLine(line, headingFont, HEADING_SIZE));
      y -= HEADING_SIZE * 0.3;
    } else if (block.type === 'listitem') {
      const lines = wrapParagraph('• ' + block.text, bodyFont, BODY_SIZE, maxWidth - 14);
      lines.forEach((line, i) => drawLine(line, bodyFont, BODY_SIZE, i === 0 ? 0 : 14));
    } else {
      const lines = wrapParagraph(block.text, bodyFont, BODY_SIZE, maxWidth);
      lines.forEach((line) => drawLine(line, bodyFont, BODY_SIZE));
      y -= BODY_SIZE * 0.6;
    }
  }

  const outBytes = await doc.save();
  const blob = new Blob([outBytes], { type: 'application/pdf' });
  return { blob, fileName: file.name.replace(/\.docx?$/i, '') + '.pdf' };
}
