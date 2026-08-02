// Manual, classic-algorithm background removal — no AI/ML model involved.
// Everything here runs on <canvas> pixel data in the browser:
//   - Magic wand: flood fill by color-distance tolerance (BFS over pixels)
//   - Brush: paint/restore a soft circular mask stroke
//   - Lasso / Polygon: fill an arbitrary closed path into the mask
// The mask is a single off-screen canvas whose alpha channel says what's
// kept (alpha 255) vs removed (alpha 0). Applying it to the source image
// uses 'destination-in' compositing — a plain 2D canvas operation.

/**
 * Creates a fully-opaque mask canvas the same size as the image
 * (everything kept by default — user then erases the background).
 */
export function createFullMask(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  return canvas;
}

export function cloneMask(maskCanvas) {
  const clone = document.createElement('canvas');
  clone.width = maskCanvas.width;
  clone.height = maskCanvas.height;
  clone.getContext('2d').drawImage(maskCanvas, 0, 0);
  return clone;
}

/**
 * Draws a filled circle onto the mask at (x, y) in image pixel coords.
 * mode 'erase' removes (paints black -> alpha 0 once composited),
 * mode 'restore' keeps (paints white -> alpha 255).
 */
export function brushStroke(maskCtx, x, y, radius, mode) {
  maskCtx.globalCompositeOperation = 'source-over';
  maskCtx.fillStyle = mode === 'erase' ? '#000' : '#fff';
  maskCtx.beginPath();
  maskCtx.arc(x, y, radius, 0, Math.PI * 2);
  maskCtx.fill();
}

/**
 * Fills a closed path (array of {x,y} in image pixel coords) into the mask.
 * Used by both the lasso (freehand) and polygon (click-to-place) tools.
 */
export function fillPath(maskCtx, points, mode) {
  if (points.length < 3) return;
  maskCtx.globalCompositeOperation = 'source-over';
  maskCtx.fillStyle = mode === 'erase' ? '#000' : '#fff';
  maskCtx.beginPath();
  maskCtx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) maskCtx.lineTo(points[i].x, points[i].y);
  maskCtx.closePath();
  maskCtx.fill();
}

/**
 * Magic wand: flood-fills outward from (x, y) across pixels within
 * `tolerance` color distance of the seed pixel, painting them into the mask.
 * Classic scanline-free BFS flood fill — no ML involved.
 * @param {CanvasRenderingContext2D} maskCtx
 * @param {ImageData} sourceData source image pixel data (same dimensions as mask)
 * @param {number} x seed x
 * @param {number} y seed y
 * @param {number} tolerance 0-100, color-distance threshold
 * @param {'erase'|'restore'} mode
 * @param {boolean} contiguous if false, selects all matching pixels in the image, not just connected ones
 */
export function magicWandFill(maskCtx, sourceData, x, y, tolerance, mode, contiguous = true) {
  const { width, height, data } = sourceData;
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= width || y >= height) return;

  const idx = (px, py) => (py * width + px) * 4;
  const seedI = idx(x, y);
  const sr = data[seedI], sg = data[seedI + 1], sb = data[seedI + 2];
  const maxDist = (tolerance / 100) * 441.7; // sqrt(255^2*3) is max possible distance

  const matches = (i) => {
    const dr = data[i] - sr, dg = data[i + 1] - sg, db = data[i + 2] - sb;
    return Math.sqrt(dr * dr + dg * dg + db * db) <= maxDist;
  };

  const paint = maskCtx.createImageData(width, height);
  // start fully transparent (paint.data is zero-filled already)

  if (!contiguous) {
    for (let p = 0; p < width * height; p++) {
      const i = p * 4;
      if (matches(i)) {
        paint.data[i] = paint.data[i + 1] = paint.data[i + 2] = 255;
        paint.data[i + 3] = 255;
      }
    }
  } else {
    const visited = new Uint8Array(width * height);
    const stack = [x, y];
    visited[y * width + x] = 1;
    while (stack.length) {
      const py = stack.pop();
      const px = stack.pop();
      const i = idx(px, py);
      if (!matches(i)) continue;
      paint.data[i] = paint.data[i + 1] = paint.data[i + 2] = 255;
      paint.data[i + 3] = 255;
      const neighbors = [[px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const key = ny * width + nx;
        if (visited[key]) continue;
        visited[key] = 1;
        stack.push(nx, ny);
      }
    }
  }

  // Composite the selection into the mask: erase -> subtract selection
  // (set those pixels to alpha 0 / black), restore -> add (white).
  const tmp = document.createElement('canvas');
  tmp.width = width;
  tmp.height = height;
  const tmpCtx = tmp.getContext('2d');
  tmpCtx.putImageData(paint, 0, 0);

  maskCtx.globalCompositeOperation = 'source-over';
  maskCtx.save();
  if (mode === 'erase') {
    // draw black wherever the selection painted white
    maskCtx.globalCompositeOperation = 'source-over';
    const paintCtx = tmp.getContext('2d');
    const imgData = paintCtx.getImageData(0, 0, width, height);
    for (let p = 0; p < imgData.data.length; p += 4) {
      if (imgData.data[p + 3] > 0) {
        imgData.data[p] = 0; imgData.data[p + 1] = 0; imgData.data[p + 2] = 0; imgData.data[p + 3] = 255;
      }
    }
    tmpCtx.putImageData(imgData, 0, 0);
  }
  maskCtx.drawImage(tmp, 0, 0);
  maskCtx.restore();
}

/**
 * Reads the source image into an ImageData object once, for magic-wand
 * color sampling (independent of the mask canvas).
 */
export function getSourceImageData(img, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

/** Inverts the whole mask (kept <-> removed). */
export function invertMask(maskCanvas) {
  const ctx = maskCanvas.getContext('2d');
  const { width, height } = maskCanvas;
  const data = ctx.getImageData(0, 0, width, height);
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = 255 - data.data[i];
    data.data[i + 1] = 255 - data.data[i + 1];
    data.data[i + 2] = 255 - data.data[i + 2];
  }
  ctx.putImageData(data, 0, 0);
}

/**
 * Composites the source image with the mask's luminance as its alpha
 * channel, producing the final transparent-background canvas.
 */
export function applyMask(img, maskCanvas, width, height) {
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const maskCtx = maskCanvas.getContext('2d');
  const maskData = maskCtx.getImageData(0, 0, width, height);
  for (let i = 0; i < imgData.data.length; i += 4) {
    // mask is grayscale white=keep/black=remove; use its red channel as alpha
    imgData.data[i + 3] = maskData.data[i];
  }
  ctx.putImageData(imgData, 0, 0);
  return out;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Export failed.'))), 'image/png');
  });
}
