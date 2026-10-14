// The bridge between the game and the page. The engine only draws the canvas
// and emits window events. This module turns those events into page changes:
// damage numbers, embers that fly into the HUD counter, the boss health bar,
// headings that shake while their mini-boss fights and light up once it falls,
// nav links marked as cleared, the final boss's speech bubbles, and the
// victory banner that unlocks the footer.
import { animate, createTimeline, scrambleText, spring, stagger, svg } from "animejs";

// Section ids in road order. Mini-boss i guards section IDS[i], and the footer is the boss arena.
const IDS = ["experience", "awards", "education", "publicspeaking", "projects", "news", "research", "footer"];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel);
const heading = (zone: number) => document.getElementById(IDS[zone] ?? "")?.querySelector<HTMLElement>("[data-heading]") ?? null;
const navLinks = (id: string) => document.querySelectorAll<HTMLElement>(`.nav-link[href="#${id}"]`);
const on = <T>(name: string, fn: (d: T) => void) => addEventListener(name, (e) => fn((e as CustomEvent<T>).detail));

type At = { x: number; y: number };

function float(cls: string, text: string, at: At, rise = -40) {
  const fx = $(".fx");
  if (!fx) return;
  const el = document.createElement("span");
  el.className = cls;
  el.textContent = text;
  el.style.left = `${Math.round(at.x)}px`;
  el.style.top = `${Math.round(at.y)}px`;
  fx.appendChild(el);
  if (reduce) return setTimeout(() => el.remove(), 700);
  animate(el, {
    y: [0, rise],
    x: [0, (Math.random() - 0.5) * 24],
    opacity: [1, 1, 0],
    scale: [1.6, 1],
    duration: 800,
    ease: "outQuad",
    onComplete: () => el.remove(),
  });
}

// Embers leave the fallen enemy and arc into the HUD counter, which ticks up as each one lands.
function flyEmbers(at: At, count: number, total: number) {
  const fx = $(".fx");
  const counter = $("[data-embers]");
  if (!fx || !counter) return;
  const r = counter.getBoundingClientRect();
  const target = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  const land = () => {
    counter.textContent = String(total);
    if (!reduce) animate(counter, { scale: [1.7, 1], ease: spring({ stiffness: 300, damping: 10 }) });
  };
  if (reduce) return land();
  const dots = Array.from({ length: count }, () => {
    const d = document.createElement("span");
    d.className = "ember";
    d.style.left = `${at.x}px`;
    d.style.top = `${at.y}px`;
    fx.appendChild(d);
    return d;
  });
  animate(dots, {
    x: [{ to: () => (Math.random() - 0.5) * 60, duration: 220, ease: "outQuad" }, { to: target.x - at.x, duration: 520, ease: "inQuad" }],
    y: [{ to: () => -30 - Math.random() * 40, duration: 220, ease: "outQuad" }, { to: target.y - at.y, duration: 520, ease: "inQuad" }],
    delay: stagger(60),
    onComplete: () => {
      dots.forEach((d) => d.remove());
      land();
    },
  });
}

function clearZone(zone: number, animated: boolean) {
  const h = heading(zone);
  if (h) {
    h.dataset.cleared = "true";
    delete h.dataset.siege;
    const label = h.querySelector<HTMLElement>(".zone");
    if (label) {
      label.textContent = `Zone ${zone + 1} cleared`;
      if (animated && !reduce) animate(label, { innerHTML: scrambleText({ chars: "shades", text: label.textContent ?? "" }) });
    }
    const flame = h.querySelectorAll(".lantern .flame, .lantern .core");
    if (animated && !reduce) animate(flame, { opacity: [0, 1, 0.4, 1, 0.7, 1], duration: 700, ease: "linear" });
  }
  navLinks(IDS[zone]).forEach((a) => (a.dataset.cleared = "true"));
}

// --- boss bar -------------------------------------------------------------------

const bar = () => $(".bossbar");
let barZone = -1;

on<{ tier: string; name: string; hp: number; max: number; zone: number }>("world:engage", (d) => {
  const b = bar();
  if (!b) return;
  barZone = d.zone;
  $("[data-boss-tier]")!.textContent = d.tier === "boss" ? "Final boss" : `Mini-boss, zone ${d.zone + 1}`;
  const name = $("[data-boss-name]")!;
  name.textContent = d.name;
  $("[data-boss-fill]")!.style.transform = `scaleX(${d.hp / d.max})`;
  b.hidden = false;
  if (!reduce) {
    animate(b, { opacity: [0, 1], y: [-24, 0], ease: spring({ stiffness: 220, damping: 16 }) });
    animate(name, { innerHTML: scrambleText({ chars: "blocks", text: d.name }) });
  }
  const h = heading(d.zone);
  if (h && d.tier === "mini") h.dataset.siege = "true";
});

on<At & { dmg: number; tier: string; zone: number; hp: number; max: number }>("world:hit", (d) => {
  float(d.tier === "boss" ? "dmg big" : "dmg", `-${d.dmg}`, d);
  if (d.tier === "minion") return;
  const fill = $("[data-boss-fill]");
  if (fill && d.zone === barZone) animate(fill, { scaleX: d.hp / d.max, duration: 260, ease: "outQuad" });
  if (reduce) return;
  const target = d.tier === "boss" ? bar() : heading(d.zone);
  if (target) animate(target, { x: [0, -6, 6, -3, 3, 0], duration: 280, ease: "linear" });
});

on<At & { tier: string; zone: number; name: string; reward: number; embers: number; quiet?: boolean }>("world:defeat", (d) => {
  if (d.quiet) {
    clearZone(d.zone, true);
    return;
  }
  flyEmbers(d, Math.min(d.reward, 8), d.embers);
  if (d.tier === "minion") return;
  const b = bar();
  if (b && d.zone === barZone) {
    if (reduce) b.hidden = true;
    else animate(b, { opacity: 0, y: -16, duration: 240, delay: 380, ease: "inQuad", onComplete: () => (b.hidden = true) });
  }
  if (d.tier === "mini") clearZone(d.zone, true);
  else victory();
});

// The bar belongs to one fight. When the reader jumps far from that fight, the bar steps aside until they scroll back.
const sectionOf = (zone: number) => document.getElementById(IDS[zone] ?? "");
addEventListener(
  "scroll",
  () => {
    const b = bar();
    const el = sectionOf(barZone);
    if (!b || b.hidden || !el) return;
    const r = el.getBoundingClientRect();
    const near = r.top < innerHeight * 1.2 && r.top > -innerHeight * 0.6;
    b.toggleAttribute("data-away", !near);
  },
  { passive: true },
);

// --- the final boss -------------------------------------------------------------

on<At & { text: string }>("world:say", (d) => {
  const fx = $(".fx");
  if (!fx) return;
  const el = document.createElement("span");
  el.className = "say";
  el.textContent = d.text;
  fx.appendChild(el);
  const w = el.offsetWidth;
  el.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, d.x - w / 2))}px`;
  el.style.top = `${Math.max(90, d.y - 40)}px`;
  if (reduce) return setTimeout(() => el.remove(), 2400);
  animate(el, { opacity: [0, 1], scale: [0.6, 1], ease: spring({ stiffness: 260, damping: 14 }) });
  animate(el, { opacity: 0, y: -10, delay: 2200, duration: 300, onComplete: () => el.remove() });
});

on<At>("world:hurt", (d) => float("dmg", "oof", d, -28));

function victory() {
  const banner = $(".banner");
  const footer = document.getElementById("footer");
  if (footer) footer.dataset.unlocked = "true";
  if (!banner) return;
  $("[data-banner-title]")!.textContent = "PR closed";
  $("[data-banner-sub]")!.textContent = "Closed without merging. +12,847 lines of slop declined.";
  banner.hidden = false;
  if (reduce) {
    setTimeout(() => (banner.hidden = true), 3200);
    return;
  }
  animate(banner, { opacity: [0, 1], scale: [2.4, 1], translateX: "-50%", translateY: "-50%", ease: spring({ stiffness: 180, damping: 12 }) });
  animate($("[data-banner-title]")!, { innerHTML: scrambleText({ chars: "blocks" }) });
  const fx = $(".fx");
  if (fx) {
    const colors = ["var(--color-accent)", "var(--color-teal)", "var(--color-text)", "#ff4fd8", "#3fb950"];
    const bits = Array.from({ length: 48 }, (_, i) => {
      const s = document.createElement("span");
      s.className = "confetti";
      s.style.left = `${innerWidth / 2}px`;
      s.style.top = `${innerHeight * 0.38}px`;
      s.style.background = colors[i % colors.length];
      fx.appendChild(s);
      return s;
    });
    animate(bits, {
      x: () => (Math.random() - 0.5) * innerWidth * 0.9,
      y: () => (Math.random() - 0.8) * innerHeight * 0.6,
      rotate: () => (Math.random() - 0.5) * 720,
      opacity: [1, 1, 0],
      duration: () => 1100 + Math.random() * 700,
      ease: "outCubic",
      delay: stagger(8),
      onComplete: () => bits.forEach((b) => b.remove()),
    });
  }
  animate(banner, { opacity: 0, delay: 3400, duration: 400, onComplete: () => (banner.hidden = true) });
}

// --- zones and initial state ------------------------------------------------------

on<{ index: number; name: string }>("world:zone", (d) => {
  const label = $("[data-zone]");
  if (label) {
    label.textContent = d.name;
    if (!reduce) animate(label, { innerHTML: scrambleText({ chars: "shades", text: d.name }) });
  }
  document.querySelectorAll<HTMLElement>(".nav-link").forEach((a) => (a.dataset.current = "false"));
  if (d.index > 0) navLinks(IDS[d.index - 1]).forEach((a) => (a.dataset.current = "true"));
});

on<{ cleared: number[] }>("world:state", (d) => d.cleared.forEach((z) => clearZone(z, false)));

// --- combat cues --------------------------------------------------------------------

// A slash sweeps a bright arc across the enemy. Anime.js draws the stroke in, then erases it from the tail.
on<At & { dir: number; size: number }>("world:slash", (d) => {
  const fx = $(".fx");
  if (!fx || reduce) return;
  const w = 90 * d.size;
  const ns = "http://www.w3.org/2000/svg";
  const svgEl = document.createElementNS(ns, "svg");
  svgEl.setAttribute("class", "slash");
  svgEl.setAttribute("viewBox", "0 0 100 60");
  svgEl.style.width = `${w}px`;
  svgEl.style.left = `${d.x - w / 2}px`;
  svgEl.style.top = `${d.y - w * 0.3}px`;
  if (d.dir < 0) svgEl.style.transform = "scaleX(-1)";
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", "M4 52 Q 40 34 96 6");
  svgEl.appendChild(path);
  fx.appendChild(svgEl);
  createTimeline({ onComplete: () => svgEl.remove() })
    .add(svg.createDrawable(path), { draw: ["0 0", "0 1"], duration: 110, ease: "outQuad" })
    .add(svg.createDrawable(path), { draw: ["0 1", "1 1"], duration: 200, ease: "inQuad" }, "+=40");
});
on<At>("world:prompt", (d) => float("dmg", "Scroll to attack ↓", d, -20));
