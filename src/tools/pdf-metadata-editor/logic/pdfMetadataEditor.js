// Runs entirely in the browser via pdf-lib — no file is ever uploaded to a
// server.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/**
 * @param {File} file
 * @returns {Promise<{
 *   title: string, author: string, subject: string, keywords: string,
 *   creator: string, producer: string,
 *   creationDate: string, modificationDate: string, pageCount: number,
 * }>}
 */
export async function readMetadata(file) {
  const { PDFDocument } = await import("pdf-lib");
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  return {
    title: doc.getTitle() || "",
    author: doc.getAuthor() || "",
    subject: doc.getSubject() || "",
    keywords: (doc.getKeywords() || "").toString(),
    creator: doc.getCreator() || "",
    producer: doc.getProducer() || "",
    creationDate: formatDate(doc.getCreationDate()),
    modificationDate: formatDate(doc.getModificationDate()),
    pageCount: doc.getPageCount(),
  };
}

function formatDate(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * @param {File} file
 * @param {{ title: string, author: string, subject: string, keywords: string, creator: string }} fields
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function writeMetadata(file, fields) {
  const { PDFDocument } = await import("pdf-lib");
  const bytes = await file.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  doc.setTitle(fields.title || "");
  doc.setAuthor(fields.author || "");
  doc.setSubject(fields.subject || "");
  const keywordList = (fields.keywords || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  doc.setKeywords(keywordList);
  doc.setCreator(fields.creator || "");
  doc.setModificationDate(new Date());

  const outBytes = await doc.save();
  const blob = new Blob([outBytes], { type: "application/pdf" });
  return { blob, fileName: file.name.replace(/\.pdf$/i, "") + "-metadata.pdf" };
}
