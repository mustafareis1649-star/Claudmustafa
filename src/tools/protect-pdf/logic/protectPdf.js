// Runs entirely in the browser. Two npm packages built specifically for
// browser-side PDF password protection do the actual crypto:
//   - @pdfsmaller/pdf-encrypt-lite  (add a password — "Protect")
//   - @pdfsmaller/pdf-decrypt       (remove a password you already know — "Unlock")
// No file is ever uploaded to a server.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Adds a password to a PDF.
 * @param {File} file
 * @param {string} userPassword    required to open the file
 * @param {string} [ownerPassword] required to change permissions; defaults to userPassword
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function protectPdf(file, userPassword, ownerPassword) {
  const { encryptPDF } = await import('@pdfsmaller/pdf-encrypt-lite');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const encrypted = await encryptPDF(bytes, userPassword, ownerPassword || userPassword);
  const blob = new Blob([encrypted], { type: 'application/pdf' });
  return { blob, fileName: file.name.replace(/\.pdf$/i, '') + '-protected.pdf' };
}

/**
 * Removes a password from a PDF, given the correct password.
 * @param {File} file
 * @param {string} password
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function unlockPdf(file, password) {
  const { decryptPDF } = await import('@pdfsmaller/pdf-decrypt');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const decrypted = await decryptPDF(bytes, password);
  const blob = new Blob([decrypted], { type: 'application/pdf' });
  return { blob, fileName: file.name.replace(/\.pdf$/i, '') + '-unlocked.pdf' };
}
