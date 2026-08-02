// Runs entirely in the browser via pdf-lib — no file is ever uploaded to a
// server.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// The PDF version lives in the raw file header ("%PDF-1.7"), which pdf-lib
// does not expose directly — read it straight from the first bytes.
function readVersion(headerBytes) {
  const text = new TextDecoder("latin1").decode(headerBytes.slice(0, 16));
  const match = text.match(/%PDF-(\d\.\d)/);
  return match ? match[1] : "";
}

function formatDate(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Points -> millimeters, rounded to whole mm (1 pt = 25.4 / 72 mm).
function ptToMm(pt) {
  return Math.round(pt * (25.4 / 72));
}

/**
 * @param {File} file
 * @returns {Promise<{
 *   fileName: string, fileSize: number, version: string, pageCount: number,
 *   pageWidthPt: number, pageHeightPt: number, pageWidthMm: number, pageHeightMm: number,
 *   title: string, author: string, subject: string, keywords: string,
 *   creator: string, producer: string,
 *   creationDate: string, modificationDate: string, encrypted: boolean,
 * }>}
 */
export async function getPdfInfo(file) {
  const { PDFDocument } = await import("pdf-lib");
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  const firstPage = doc.getPageCount() > 0 ? doc.getPage(0) : null;
  const size = firstPage ? firstPage.getSize() : { width: 0, height: 0 };

  return {
    fileName: file.name,
    fileSize: file.size,
    version: readVersion(new Uint8Array(bytes)),
    pageCount: doc.getPageCount(),
    pageWidthPt: Math.round(size.width),
    pageHeightPt: Math.round(size.height),
    pageWidthMm: ptToMm(size.width),
    pageHeightMm: ptToMm(size.height),
    title: doc.getTitle() || "",
    author: doc.getAuthor() || "",
    subject: doc.getSubject() || "",
    keywords: (doc.getKeywords() || "").toString(),
    creator: doc.getCreator() || "",
    producer: doc.getProducer() || "",
    creationDate: formatDate(doc.getCreationDate()),
    modificationDate: formatDate(doc.getModificationDate()),
    encrypted: !!doc.isEncrypted,
  };
}
