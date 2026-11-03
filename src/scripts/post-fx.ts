// After hours effects for blog posts: live lantern flames, a moving sky, a "POST CLEARED" banner at the end,
// a share achievement, coins from copy buttons, and a wisp beside the narration. Every effect checks the
// mode each frame, so switching to Serious hides them at once. Reduced motion plays none of them.
import { painterFor, sparkle, hex } from "./pixelfx/core/index.js";
import { EMBER, Layer, TEAL, createFx, type Fx } from "./companion/effects";
import * as shootingStars from "./pixelfx/fx/weather/shooting-stars.js";
import * as fireflies from "./pixelfx/fx/weather/fireflies.js";
import * as quest from "./pixelfx/fx/ui/quest-complete.js";
import * as achievement from "./pixelfx/fx/ui/achievement.js";
import * as firework from "./pixelfx/fx/explosions/firework-burst.js";
import * as coins from "./pixelfx/fx/ui/coin-collect.js";
import * as wisp from "./pixelfx/fx/critters/wisp.js";

const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const afterHours = () => root.dataset.siteMode === "afterhours";
const night = () => root.getAttribute("data-theme") !== "light";

// --- one clock for every effect on the page ----------------------------------------------

type Job = (dt: number) => boolean | void; // return false to stop
const jobs = new Set<Job>();
let last = 0;
function loop(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  for (const job of jobs) if (job(dt) === false) jobs.delete(job);
  if (jobs.size) requestAnimationFrame(loop);
}
function run(job: Job) {
  if (!jobs.size) requestAnimationFrame((t) => ((last = t), loop(t)));
  jobs.add(job);
}

/**
 * Play one-shot effects in a canvas laid over the page at `scale` CSS px per pixel. `place` positions the
 * canvas in document coordinates, so it scrolls with the page. The canvas removes itself when every effect ends.
 */
export function popup(w: number, h: number, scale: number, fxs: { fx: Fx; x: number; y: number }[], place: (el: HTMLCanvasElement) => void) {
  if (reduce || !afterHours()) return;
  const layer = new Layer();
  layer.resize(w, h);
  const el = layer.canvas;
  el.className = "fx-popup afterhours-only";
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, { position: "absolute", width: `${w * scale}px`, height: `${h * scale}px`, pointerEvents: "none", imageRendering: "pixelated", zIndex: "40" });
  document.body.appendChild(el);
  place(el);
  run((dt) => {
    layer.clear();
    for (const f of fxs) {
      f.fx.update(dt);
      layer.draw(f.fx, f.x, f.y);
    }
    layer.flush(28);
    if (fxs.every((f) => f.fx.done())) {
      el.remove();
      return false;
    }
  });
}

/** Position a popup canvas so that canvas pixel (ox, oy) sits on the document point (x, y). */
const pin = (el: HTMLCanvasElement, scale: number, x: number, y: number, ox: number, oy: number) => {
  el.style.left = `${Math.round(x - ox * scale)}px`;
  el.style.top = `${Math.round(y - oy * scale)}px`;
};
const docRect = (node: Element) => {
  const r = node.getBoundingClientRect();
  return { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height };
};

// --- 10: copy buttons pay out ---------------------------------------------------------------

/** A few coins arc out of a button and land back on it. */
export function coinBurst(btn: HTMLElement) {
  const r = docRect(btn);
  popup(90, 60, 2, [{ fx: createFx(coins, { count: 5, from: 8, light: 0.35 }), x: 45, y: 52 }], (el) => pin(el, 2, r.left + r.width / 2, r.top + r.height / 2, 45, 52));
}

// --- 1: lantern flames ------------------------------------------------------------------------

const FLAME = [
  [".y.", "yAy", "AWA", "AWA", "yAy"],
  ["y..", "yAy", "AWA", "AWA", "yAy"],
  ["..y", "yA.", "AWA", "AWA", "yAy"],
  [".y.", ".Ay", "AWA", "yWA", "yAy"],
];
const FLAME_PAL = { y: "#e0561e", A: "#ff9a3c", W: "#fff3c4" };

/**
 * A canvas over each section's lantern holds a four-frame flame in its 3 x 5 glass. The flame lights with a
 * white pop and eight sparks when the section's heading gets data-cleared.
 */
function lanterns() {
  for (const svg of document.querySelectorAll<SVGElement>(".post .section-head .lantern")) {
    const head = svg.closest<HTMLElement>(".section-head")!;
    const wrap = document.createElement("span");
    wrap.className = "lantern-fx afterhours-only";
    svg.replaceWith(wrap);
    wrap.appendChild(svg);
    // The lantern is a 7 x 11 grid at 3 CSS px. The canvas adds a margin for the glow.
    const layer = new Layer();
    layer.resize(13, 15);
    const cv = layer.canvas;
    cv.setAttribute("aria-hidden", "true");
    wrap.appendChild(cv);
    let litAt = head.dataset.cleared !== undefined ? -10 : -1, t = 0, visible = false;
    new MutationObserver(() => {
      if (head.dataset.cleared !== undefined && litAt < 0) litAt = t;
      if (head.dataset.cleared === undefined) litAt = -1;
    }).observe(head, { attributes: true, attributeFilter: ["data-cleared"] });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) run(tick);
    }).observe(wrap);
    const tick: Job = (dt) => {
      if (!visible) return false;
      t += dt;
      layer.clear();
      if (litAt >= 0 && afterHours()) {
        const p = painterFor(layer.frame);
        p.place(0, 0);
        p.sprite(FLAME[Math.floor(t * 8) % 4], FLAME_PAL, 5, 5);
        p.glow(6.5, 7, 7 + Math.sin(t * 9) * 0.5, hex("#ffb347"), 0.5);
        const since = t - litAt;
        if (since < 0.7) {
          if (since < 0.1) sparkle(p, 6.5, 7, 4, hex("#ffffff"), hex("#ffbe73"));
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + 0.3, d = 2 + since * 18;
            p.dot(6.5 + Math.cos(a) * d, 7 + Math.sin(a) * d - since * 6, hex(i % 2 ? "#ffbe73" : "#ffffff"), 1 - since / 0.7);
          }
        }
      }
      layer.flush();
    };
  }
}

// --- 2: the post sky ----------------------------------------------------------------------------

/**
 * The fixed sky gets shooting stars and, in the margins, fireflies, at the world's 4 CSS px. The column
 * stays clear, so nothing moves behind the words. Dawn keeps the plain sky.
 */
function sky() {
  const holder = document.querySelector<HTMLElement>(".post-sky");
  const column = document.querySelector<HTMLElement>("main.post");
  if (!holder || !column) return;
  const layer = new Layer();
  const cv = layer.canvas;
  cv.setAttribute("aria-hidden", "true");
  Object.assign(cv.style, { position: "absolute", inset: "0", width: "100%", height: "100%", imageRendering: "pixelated" });
  holder.appendChild(cv);
  const stars = createFx(shootingStars, { backdrop: false });
  const flies = [createFx(fireflies, { backdrop: false, seed: 2 }), createFx(fireflies, { backdrop: false, seed: 5 })];
  let acc = 0, shown = false;
  run((dt) => {
    // In Serious mode or at dawn the canvas empties once and the loop idles.
    if (!(afterHours() && night())) {
      if (shown) layer.ctx.clearRect(0, 0, cv.width, cv.height);
      shown = false;
      return;
    }
    shown = true;
    acc += dt;
    if (acc < 1 / 30) return; // 30 fps is plenty for a background
    const step = acc;
    acc = 0;
    const W = Math.ceil(innerWidth / 4), H = Math.ceil(innerHeight / 4);
    layer.resize(W, H);
    layer.clear();
    const c = column.getBoundingClientRect(), l = c.left / 4, r = c.right / 4;
    stars.update(step);
    layer.draw(stars, W / 2, H);
    flies.forEach((f, i) => {
      f.update(step);
      layer.draw(f, i ? (r + W) / 2 : l / 2, H);
    });
    layer.flush();
    layer.ctx.clearRect(Math.floor(l), 0, Math.ceil(r - l), H);
  });
}

// --- 3 + 18: post cleared, then a share achievement ----------------------------------------

function ending() {
  const row = document.querySelector<HTMLElement>(".share-row");
  const heads = Array.from(document.querySelectorAll<HTMLElement>(".post .section-head"));
  if (!row) return;
  // The banner plays once, when the share row is in view and every lantern is lit. Either can happen
  // last, so both an intersection change and a lantern lighting run the check.
  let played = false, rowVisible = false;
  const maybe = () => {
    if (played || !rowVisible || !heads.every((h) => h.dataset.cleared !== undefined)) return;
    played = true;
    const r = docRect(row);
    popup(240, 120, 2, [
      { fx: createFx(firework, { palette: EMBER.slice(1, 8), seed: 3, light: 0.35 }), x: 50, y: 110 },
      { fx: createFx(firework, { palette: TEAL.slice(1), seed: 8, light: 0.35 }), x: 190, y: 105 },
      { fx: createFx(quest, { light: 0.35, text: "POST CLEARED", ribbon: ["#3d1012", "#701a14", "#a8301a", "#e0561e", "#ff9a3c", "#ffbe73", "#ffe2b0"] }), x: 120, y: 76 },
    ], (el) => pin(el, 2, r.left + r.width / 2, r.top, 120, 118));
  };
  new IntersectionObserver(([e]) => {
    rowVisible = e.isIntersecting;
    maybe();
  }, { threshold: 0.6 }).observe(row);
  const watch = new MutationObserver(maybe);
  for (const h of heads) watch.observe(h, { attributes: true, attributeFilter: ["data-cleared"] });
  // Any share button unlocks the achievement over the row. Copy link also throws coins, through copy.ts.
  for (const b of row.querySelectorAll<HTMLElement>("a, button")) {
    b.addEventListener("click", () => {
      const r = docRect(row);
      // Below the row, so it never collides with the banner above it.
      popup(230, 80, 2, [{ fx: createFx(achievement, { light: 0.35, title: "ACHIEVEMENT", text: "SPREAD THE WORD" }), x: 115, y: 36 }], (el) => pin(el, 2, r.left + r.width / 2, r.top + r.height + 6, 115, 4));
    });
  }
}

// --- 15: a wisp keeps the narrator company --------------------------------------------------

function narrator() {
  for (const bar of document.querySelectorAll<HTMLElement>("[data-listen]")) {
    const audio = bar.querySelector("audio")!, btn = bar.querySelector<HTMLElement>("[data-play]")!;
    let fx: Fx | null = null, el: HTMLCanvasElement | null = null;
    audio.addEventListener("play", () => {
      if (reduce || !afterHours() || fx) return;
      const layer = new Layer();
      layer.resize(120, 80);
      el = layer.canvas;
      el.className = "fx-popup afterhours-only";
      Object.assign(el.style, { position: "absolute", width: "240px", height: "160px", pointerEvents: "none", imageRendering: "pixelated", zIndex: "40" });
      document.body.appendChild(el);
      const f = (fx = createFx(wisp, { hover: 12, palette: TEAL.slice(0, 7), light: 0.4 }));
      const canvas = el;
      run((dt) => {
        // The wisp loops in the margin left of the Listen panel. On a narrow screen there's no margin, so it
        // hovers above the play button instead.
        const panel = docRect(bar), r = docRect(btn);
        if (panel.left > 150) pin(canvas, 2, panel.left - 70, panel.top + panel.height, 60, 74);
        else pin(canvas, 2, r.left + r.width / 2, r.top + 4, 60, 74);
        f.update(dt);
        layer.clear();
        layer.draw(f, 60, 74);
        layer.flush(70);
        if (f.done()) {
          canvas.remove();
          if (fx === f) fx = null;
          return false;
        }
      });
    });
    const away = () => fx?.stop();
    audio.addEventListener("pause", away);
    audio.addEventListener("ended", away);
  }
}

export function mountPostFx() {
  if (reduce) return;
  lanterns();
  sky();
  ending();
  narrator();
}
