// Runs entirely in the browser — the image is decoded onto an off-screen
// canvas and never uploaded anywhere. Uses simple color quantization
// (downsample + bucket + average) rather than a full k-means, which is
// more than accurate enough for a palette of a handful of swatches and
// stays fast even on large photos.

/**
 * @param {File} file
 * @param {number} count number of swatches to return
 * @returns {Promise<{ hex: string, population: number }[]>} sorted by population desc
 */
export async function extractPalette(file, count = 6) {
  const { img, url } = await loadImage(file);
  try {
    const canvas = document.createElement('canvas');
    // Downsample for speed — sampling a couple thousand pixels is plenty to
    // find the dominant colors of any photo, no matter how large the source.
    const SAMPLE = 120;
    const ratio = Math.min(SAMPLE / img.width, SAMPLE / img.height, 1);
    canvas.width = Math.max(1, Math.round(img.width * ratio));
    canvas.height = Math.max(1, Math.round(img.height * ratio));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Bin into coarse buckets (16 levels per channel) then average the real
    // pixels inside each bucket, so the swatch shown is a true average
    // color, not just the bucket's center.
    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 128) continue; // skip transparent pixels
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const key = (r >> 4) + ',' + (g >> 4) + ',' + (b >> 4); // >>4 == /16, floor
      let entry = buckets.get(key);
      if (!entry) {
        entry = { r: 0, g: 0, b: 0, n: 0 };
        buckets.set(key, entry);
      }
      entry.r += r;
      entry.g += g;
      entry.b += b;
      entry.n += 1;
    }

    if (buckets.size === 0) throw new Error('no_visible_pixels');

    const totalPixels = [...buckets.values()].reduce((sum, e) => sum + e.n, 0);
    const top = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, count);

    return top.map((e) => ({
      hex: rgbToHex(Math.round(e.r / e.n), Math.round(e.g / e.n), Math.round(e.b / e.n)),
      population: Math.round((e.n / totalPixels) * 100),
    }));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
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
