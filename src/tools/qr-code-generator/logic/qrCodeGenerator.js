// Runs entirely in the browser via the `qrcode` package (pure JS, bundled
// into the app — no request is ever sent anywhere to generate the code).

/**
 * @param {string} text          content to encode (URL, wifi string, plain text, etc.)
 * @param {object} opts
 * @param {number} opts.size     output size in px (square)
 * @param {string} opts.dark     foreground color, hex
 * @param {string} opts.light    background color, hex
 * @param {'L'|'M'|'Q'|'H'} opts.errorCorrection
 * @returns {Promise<{ blob: Blob, fileName: string, dataUrl: string }>}
 */
export async function generateQrCode(text, opts = {}) {
  const { size = 512, dark = '#111111', light = '#ffffff', errorCorrection = 'M' } = opts;
  if (!text || !text.trim()) throw new Error('empty_text');

  const QRCode = (await import('qrcode')).default;

  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 2,
    errorCorrectionLevel: errorCorrection,
    color: { dark, light },
  });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const dataUrl = canvas.toDataURL('image/png');
  return { blob, fileName: 'qr-code.png', dataUrl };
}
