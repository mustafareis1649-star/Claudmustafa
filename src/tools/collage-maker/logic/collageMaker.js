// Runs entirely in the browser via Canvas — no file is ever uploaded to a
// server.

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function loadImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Draws a cover-fit image into a cell of the collage grid, cropping any
 * overflow so every cell fills its rectangle with no letterboxing.
 */
function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * Arranges up to `cols * rows` images into an even grid collage.
 * @param {File[]} files
 * @param {number} cols
 * @param {number} rows
 * @param {number} gap  pixels of white space between cells and around the edge
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function buildCollage(files, cols, rows, gap = 8) {
  const cellSize = 600;
  const width = cols * cellSize + gap * (cols + 1);
  const height = rows * cellSize + gap * (rows + 1);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const slots = cols * rows;
  const images = await Promise.all(files.slice(0, slots).map(loadImage));

  images.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = gap + col * (cellSize + gap);
    const y = gap + row * (cellSize + gap);
    drawCover(ctx, img, x, y, cellSize, cellSize);
  });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  return { blob, fileName: 'collage.jpg' };
}
