// The bridge between the engine and PixelFX. An effect draws into a PixelFX frame (a color buffer and an
// additive light buffer). A Layer composites that frame into an offscreen canvas, and the engine draws the
// canvas over the world: the 2x layer for hits and deaths, the world-grid layer for weather.
import { actorAlphaOf, clearFrame, composite, createFrame, createFx, hex, sparkle } from "../pixelfx/core/index.js";
import type { Frame } from "./sprites";

export type Fx = ReturnType<typeof createFx>;
export { actorAlphaOf, createFx };

export class Layer {
  canvas = document.createElement("canvas");
  ctx = this.canvas.getContext("2d")!;
  frame = createFrame(1, 1);
  img = new ImageData(1, 1);

  resize(w: number, h: number) {
    if (this.canvas.width === w && this.canvas.height === h) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.frame = createFrame(w, h);
    this.img = new ImageData(w, h);
  }

  clear() {
    clearFrame(this.frame);
  }

  /** Draw an effect with its origin at (x, y) in this layer's pixels. */
  draw(fx: Fx, x: number, y: number, layer?: "back" | "front") {
    fx.options.x = x;
    fx.options.y = y;
    fx.draw(this.frame, layer);
  }

  /** Composite over transparency, so the engine can drawImage the result over the world. */
  flush() {
    composite(this.frame, this.img.data, null);
    this.ctx.putImageData(this.img, 0, 0);
    return this.canvas;
  }
}

/** A sprite as a PixelFX actor: its silhouette and colors, feet at (0, 0), for effects that wrap a body. */
export function actorOf(rows: Frame, pal: Record<string, string>, dy = 0) {
  const h = rows.length, w = rows[0].length;
  const data = new Uint8Array(w * h), pixels = new Uint32Array(w * h);
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === "." || !pal[ch]) return;
    data[y * w + x] = 1;
    pixels[y * w + x] = hex(pal[ch]);
  }));
  const x0 = -Math.floor(w / 2), y0 = -h - dy;
  return { mask: { w, h, data }, pixels, x: x0, y: y0, w, h, k: 2, head: [0, y0], chest: [0, Math.round(y0 * 0.55)] };
}

// Site palettes for effects, dark to bright.
export const TEAL = ["#0c2a33", "#0f4f47", "#17675d", "#2fa596", "#5fd8c6", "#8fe6d8", "#d8fff8", "#ffffff"];
export const EMBER = ["#3d1012", "#701a14", "#a8301a", "#e0561e", "#ff9a3c", "#ffbe73", "#ffe2b0", "#fff6e6", "#ffffff"];
export const SLOP = ["#0a0c18", "#2a1f66", "#4f3cc0", "#7b5cff", "#b9a6ff", "#ff6bd0", "#ffe66b", "#fffbe0"];
export const GOLD = ["#2a1c08", "#5a3e10", "#9a6c18", "#d8a428", "#ffd84a", "#fff09a", "#ffffff"];

type P = { disc: (x: number, y: number, r: number, c: number, a: number) => void; glow: (x: number, y: number, r: number, c: number, k: number) => void };

/**
 * A minion's poof, sized for a 20 px slime, because the stock poof is sized for a full character: six lit
 * puffs that swell and thin, a white pop, and two glints.
 */
export const pocketPoof = {
  meta: { name: "Pocket poof", duration: 0.9, loop: false, size: [48, 40], origin: [24, 32], options: {} },
  draw(p: P, t: number) {
    const e = t / 0.9, k = 1 - e;
    const puffs = [[-5, -4, 4], [4, -5, 4], [0, -9, 5], [-7, -9, 3], [7, -10, 3], [0, -3, 4]];
    for (const [px, py, r] of puffs) {
      const g = 1 - Math.pow(1 - Math.min(1, e * 2.2), 3);
      const cx = px * (0.6 + g * 0.7), cy = py * (0.7 + g * 0.6) - e * 4, rr = r * (0.6 + g * 0.6);
      p.disc(cx, cy, rr, hex("#6b6585"), 0.75 * k);
      p.disc(cx - 1, cy - 1, rr * 0.7, hex("#cfcbe6"), 0.8 * k);
    }
    if (t < 0.12) sparkle(p, 0, -6, 5 * (1 - t / 0.12), hex("#ffffff"), hex("#5fd8c6"));
    if (t > 0.25 && t < 0.6) sparkle(p, 8, -14, 2, hex("#fff6c9"), hex("#ff9a3c"));
    if (t > 0.35 && t < 0.7) sparkle(p, -8, -13, 2, hex("#fff6c9"), hex("#ff9a3c"));
    p.glow(0, -6, 10, hex("#5fd8c6"), 0.35 * k);
  },
};

/** One frame of the engine's 30 fps clock, in seconds, for stepping effects. */
export const TICK = 1 / 30;
