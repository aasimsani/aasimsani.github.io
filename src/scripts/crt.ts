// Switching between Serious and After hours plays an old TV switching off and on: the picture squeezes into
// a glowing line, then a dot, the screen goes dark, and the other mode powers on behind a warm-up glow. The
// swap happens while the screen is dark. Reduced motion just swaps.
import { Layer } from "./companion/effects";
import * as crtOff from "./pixelfx/fx/transitions/crt-off.js";
import { createFx } from "./pixelfx/core/index.js";

// crt-off is dark from 0.56 s (the dot) to 1.06 s (switching back on), so the swap lands in the middle.
const SWAP_AT = 0.95;
let busy = false;

export function crtSwitch(swap: () => void) {
  if (busy) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return swap();
  busy = true;
  // The effect is a 320 x 180 screen, stretched over the viewport the way a transition should be.
  const layer = new Layer();
  layer.resize(320, 180);
  const el = layer.canvas;
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", zIndex: "90", pointerEvents: "none", imageRendering: "pixelated" });
  document.body.appendChild(el);
  const color = getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim() || "#0d1024";
  const fx = createFx(crtOff, { color });
  let swapped = false, last = performance.now();
  const frame = (now: number) => {
    fx.update(Math.min(0.05, (now - last) / 1000));
    last = now;
    if (!swapped && fx.t >= SWAP_AT) {
      swapped = true;
      swap();
    }
    layer.clear();
    layer.draw(fx, 0, 0);
    layer.flush();
    if (!fx.done()) return requestAnimationFrame(frame);
    if (!swapped) swap();
    el.remove();
    busy = false;
  };
  requestAnimationFrame(frame);
}
