// Runs entirely in the browser (pdf.js for text extraction, plain JS for the
// diff) — neither file is ever uploaded to a server.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Pulls each page's text out of a PDF as an array of lines.
 * @param {File} file
 * @returns {Promise<string[][]>} one array of lines per page
 */
async function extractPagesLines(file) {
  const buf = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buf.slice(0) }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // pdf.js gives individual text runs with y-position — group runs that
    // share a line (same rounded y) so the diff works on real lines, not
    // on every tiny text fragment pdf.js happens to split a line into.
    const rows = new Map();
    for (const item of content.items) {
      const y = Math.round(item.transform[5]);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push(item.str);
    }
    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0]) // top of page first
      .map(([, parts]) => parts.join('').trim())
      .filter((l) => l.length > 0);
    pages.push(lines);
  }
  return pages;
}

/**
 * Classic LCS-based line diff. Returns an ordered list of
 * { type: 'equal'|'add'|'remove', text } covering both inputs.
 * @param {string[]} a
 * @param {string[]} b
 */
function diffLines(a, b) {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: 'equal', text: a[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'remove', text: a[i] });
      i++;
    } else {
      out.push({ type: 'add', text: b[j] });
      j++;
    }
  }
  while (i < n) { out.push({ type: 'remove', text: a[i] }); i++; }
  while (j < m) { out.push({ type: 'add', text: b[j] }); j++; }
  return out;
}

/**
 * Compares two PDFs page by page.
 * @param {File} fileA
 * @param {File} fileB
 * @returns {Promise<{ pages: Array<{page:number, diff: Array<{type:string,text:string}>, additions:number, removals:number}>, numPagesA:number, numPagesB:number, totalAdditions:number, totalRemovals:number, identical:boolean }>}
 */
export async function comparePdfs(fileA, fileB) {
  const [linesA, linesB] = await Promise.all([extractPagesLines(fileA), extractPagesLines(fileB)]);
  const totalPages = Math.max(linesA.length, linesB.length);

  const pages = [];
  let totalAdditions = 0;
  let totalRemovals = 0;

  for (let p = 0; p < totalPages; p++) {
    const a = linesA[p] || [];
    const b = linesB[p] || [];
    const diff = diffLines(a, b);
    const additions = diff.filter((d) => d.type === 'add').length;
    const removals = diff.filter((d) => d.type === 'remove').length;
    totalAdditions += additions;
    totalRemovals += removals;
    pages.push({ page: p + 1, diff, additions, removals });
  }

  return {
    pages,
    numPagesA: linesA.length,
    numPagesB: linesB.length,
    totalAdditions,
    totalRemovals,
    identical: totalAdditions === 0 && totalRemovals === 0,
  };
}
