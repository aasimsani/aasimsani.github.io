// A wall of pixel blocks spreads out from a corner, runs `swap` while the page
// is covered, then peels away from the same corner. The theme toggle and the
// adventure switch both use it, so every big change looks like one gesture.
import { createTimeline, stagger } from "animejs";

let busy = false;

export function pixelWipe(swap: () => void, from: "top-right" | "bottom-center" = "top-right") {
  if (busy) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    swap();
    return;
  }
  busy = true;
  const cols = 18;
  const rows = Math.ceil((cols * innerHeight) / innerWidth);
  const wall = document.createElement("div");
  wall.className = "pixel-wipe";
  wall.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  wall.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  const cells = Array.from({ length: cols * rows }, () => wall.appendChild(document.createElement("i")));
  document.body.appendChild(wall);
  const origin = from === "top-right" ? cols - 1 : (rows - 1) * cols + Math.floor(cols / 2);
  const delay = stagger(16, { grid: [cols, rows], from: origin });
  createTimeline({
    onComplete: () => {
      wall.remove();
      busy = false;
    },
  })
    .add(cells, { scale: [0, 1], duration: 220, delay, ease: "outQuad" })
    .call(swap)
    .add(cells, { scale: [1, 0], duration: 220, delay, ease: "inQuad" }, "+=60");
}
