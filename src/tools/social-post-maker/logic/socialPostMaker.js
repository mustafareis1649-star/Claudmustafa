// Runs entirely in the browser (Canvas API) — no file/text is ever uploaded
// to a server.

export const PRESET_SIZES = {
  instagram_post: { width: 1080, height: 1080, label: 'Instagram Post (1:1)' },
  instagram_story: { width: 1080, height: 1920, label: 'Instagram Story (9:16)' },
  facebook_post: { width: 1200, height: 630, label: 'Facebook Post' },
  twitter_post: { width: 1600, height: 900, label: 'X / Twitter Post' },
};

/**
 * Renders a simple text-on-background template to a canvas and returns a
 * downloadable PNG blob.
 * @param {{ presetKey: string, headline: string, subtext: string, bgColor: string, textColor: string }} opts
 * @returns {Promise<{ blob: Blob, fileName: string }>}
 */
export async function renderSocialPost({ presetKey, headline, subtext, bgColor, textColor }) {
  const preset = PRESET_SIZES[presetKey] || PRESET_SIZES.instagram_post;
  const { width, height } = preset;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // headline
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const headlineSize = Math.round(width * 0.075);
  ctx.font = `700 ${headlineSize}px Space Grotesk, Inter, sans-serif`;
  const headlineLines = wrapText(ctx, headline, width * 0.85, headlineSize * 1.2);
  const subSize = Math.round(width * 0.035);

  const totalHeadlineHeight = headlineLines.length * headlineSize * 1.2;
  const startY = height / 2 - totalHeadlineHeight / 2 - (subtext ? subSize * 2 : 0);

  headlineLines.forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * headlineSize * 1.2);
  });

  if (subtext) {
    ctx.font = `500 ${subSize}px Inter, sans-serif`;
    ctx.globalAlpha = 0.85;
    const subLines = wrapText(ctx, subtext, width * 0.8, subSize * 1.3);
    const subStartY = startY + totalHeadlineHeight + subSize;
    subLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, subStartY + i * subSize * 1.3);
    });
    ctx.globalAlpha = 1;
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return { blob, fileName: `${presetKey}.png` };
}

// Word-wraps text to fit maxWidth, returns an array of lines. ctx.font must
// already be set before calling this.
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
