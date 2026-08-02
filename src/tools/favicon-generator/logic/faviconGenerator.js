// Runs entirely in the browser — the source image is never uploaded anywhere.
// Renders a full favicon set (PNG at every standard size + a site.webmanifest)
// and bundles everything into a single .zip using jszip, which is already a
// dependency of this app.

const SIZES = [
  { size: 16, fileName: 'favicon-16x16.png' },
  { size: 32, fileName: 'favicon-32x32.png' },
  { size: 48, fileName: 'favicon-48x48.png' },
  { size: 180, fileName: 'apple-touch-icon.png' },
  { size: 192, fileName: 'android-chrome-192x192.png' },
  { size: 512, fileName: 'android-chrome-512x512.png' },
];

/**
 * @param {File} file source image (any raster format the browser can decode)
 * @returns {Promise<{ previews: {size:number,fileName:string,dataUrl:string}[], zipBlob: Blob }>}
 */
export async function generateFavicons(file) {
  const { img, url } = await loadImage(file);
  try {
    const previews = SIZES.map(({ size, fileName }) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      drawCover(ctx, img, size);
      return { size, fileName, dataUrl: canvas.toDataURL('image/png') };
    });

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    for (const p of previews) {
      zip.file(p.fileName, p.dataUrl.split(',')[1], { base64: true });
    }
    zip.file(
      'site.webmanifest',
      JSON.stringify(
        {
          name: '',
          icons: [
            { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
        },
        null,
        2
      )
    );

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return { previews, zipBlob };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image_load_failed'));
    };
    img.src = url;
  });
}

// Draws the source image cropped to a centered square ("cover" fit) so
// non-square source images (banners, screenshots, etc.) still produce a
// clean square favicon instead of a squished one.
function drawCover(ctx, img, size) {
  const srcSize = Math.min(img.width, img.height);
  const sx = (img.width - srcSize) / 2;
  const sy = (img.height - srcSize) / 2;
  ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, size, size);
}
