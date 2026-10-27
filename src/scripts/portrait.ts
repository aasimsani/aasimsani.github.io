// Pure helpers that turn the portrait cutout into something the page can draw:
// home points for Serious mode's woven field, and a pixel sprite for the After
// hours HUD. Both work on raw RGBA arrays, so tests run without a canvas.

export type FaceCell = { x: number; y: number; tone: number };
export type Rgb = [number, number, number];

// Seeded random keeps the dither identical on every load.
const rng = (s: number) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

/**
 * Sample the cutout on a square grid with `rows` rows and return one cell per opaque sample.
 * Coordinates are centred and scaled so the image is one unit tall. Each tone indexes a ramp
 * of `tones` colors after the luminance range is stretched, so the whole ramp goes to the face.
 * The bottom `fade` share of rows thins out at random, so the crop dissolves instead of ending on a line.
 */
export function sampleFace(data: Uint8ClampedArray, w: number, h: number, opts: { rows: number; tones: number; fade: number }): FaceCell[] {
  const step = h / opts.rows;
  const cols = Math.round(w / step);
  const drop = rng(11);
  const raw: { x: number; y: number; l: number }[] = [];
  let lo = 255, hi = 0;
  for (let r = 0; r < opts.rows; r++) {
    const py = Math.min(h - 1, Math.floor(r * step + step / 2));
    const frac = (py + 0.5) / h;
    for (let c = 0; c < cols; c++) {
      const px = Math.min(w - 1, Math.floor(c * step + step / 2));
      const i = (py * w + px) * 4;
      if (data[i + 3] < 140) continue;
      if (opts.fade > 0 && frac > 1 - opts.fade && drop() > (1 - frac) / opts.fade) continue;
      const l = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
      lo = Math.min(lo, l);
      hi = Math.max(hi, l);
      raw.push({ x: (px + 0.5) / h - w / h / 2, y: frac - 0.5, l });
    }
  }
  return raw.map(({ x, y, l }) => ({ x, y, tone: Math.min(opts.tones - 1, Math.floor(((l - lo) / (hi - lo || 1)) * opts.tones)) }));
}

/** Snap every opaque pixel to the nearest palette color and draw a one-pixel outline around the silhouette, in place. */
export function pixelSprite(data: Uint8ClampedArray, w: number, h: number, palette: Rgb[], outline: Rgb) {
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (data[o + 3] < 200) {
      data[o + 3] = 0;
      continue;
    }
    solid[i] = 1;
    data[o + 3] = 255;
    // Green weighs most in the distance, so the snap follows perceived brightness.
    let best = palette[0], bd = Infinity;
    for (const c of palette) {
      const d = (data[o] - c[0]) ** 2 * 0.3 + (data[o + 1] - c[1]) ** 2 * 0.59 + (data[o + 2] - c[2]) ** 2 * 0.11;
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
    data.set(best, o);
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (solid[i]) continue;
      if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) {
        data.set([...outline, 255], i * 4);
      }
    }
  }
  return data;
}

/** Return how worn the HUD face looks, from 0 to 3, given the times of recent hits. Hits older than 15s have healed. */
export function batteredLevel(hits: number[], now: number) {
  const recent = hits.filter((t) => now - t < 15_000).length;
  return recent >= 7 ? 3 : recent >= 4 ? 2 : recent >= 2 ? 1 : 0;
}

/** Map a rectangle given in cutout pixels onto an n×n sprite grid cut from the square crop `[x, y, size]`. */
export function toGrid(rect: readonly number[], crop: readonly number[], n: number): [number, number, number, number] {
  const k = n / crop[2];
  return [
    Math.round((rect[0] - crop[0]) * k),
    Math.round((rect[1] - crop[1]) * k),
    Math.max(1, Math.round(rect[2] * k)),
    Math.max(1, Math.round(rect[3] * k)),
  ];
}
