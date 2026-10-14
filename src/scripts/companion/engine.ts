// The background world. One fixed canvas covers the viewport at low resolution,
// and the browser upscales it with image-rendering: pixelated. World space maps
// onto the document (one world pixel = S CSS pixels), so the road, enemies and
// lanterns scroll with the page. Sky, stars, moon and ramparts lag behind for
// parallax. Motion is simulated in floating point and snapped when drawn.
//
// The game has three enemy tiers. Minions line the gutter roads, and the hero
// cuts them down mid-stride. A mini-boss guards every section break and blocks
// the road until it falls. The final boss waits in the footer. The engine
// reports what happens through window events (world:engage, world:hit,
// world:defeat, world:zone, world:say, world:hurt, world:state), and hud.ts
// turns those into page reactions.
import { animate, createTimer } from "animejs";
import { buildJourney, pointAt, roundCorners, scrollSpeed, spawnPlan, tAtY, type Pt } from "./world";
import { BAT, GULL, LEGS, LOOKS, MINI_BOSSES, MINION_DAY, MINION_NIGHT, SLIME, SLIME_DAY, SLOP_LINES, SLOP_PAL, SLOP_PR, WHITE, dayPalette, type Frame, type Look } from "./sprites";

type Mode = "fight" | "wander";
type Tier = "minion" | "mini" | "boss";
type Enemy = {
  tier: Tier;
  look: number; // minion: 0 slime / 1 bat; mini: index into MINI_BOSSES
  t: number;
  x: number;
  y: number;
  hp: number;
  max: number;
  flash: number;
  kx: number;
  dying: number;
  alive: boolean;
  zone: number;
  phase: number;
  engaged: boolean;
  timer: number;
  telegraph: number;
};
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string };
type Shot = { x: number; y: number; vx: number; vy: number; kind: "dash" | "sparkle"; life: number };
type Panel = { x0: number; x1: number; y0: number; y1: number };

const MARGIN = 3;
const MINIONS_PER_ZONE = [1, 2, 3, 5, 7];
const SKY_TINT = [0.28, 0, 0.3, 0.45, 0.55];
// Pixels of scroll that buy one swing. Phones get cheaper swings, so a fight
// ends before the boss scrolls up under the top bar.
const perSwing = () => (innerWidth < 700 ? 42 : 70);
// Phones and tablets fight on their own, because scrolling to swing feels bad on touch.
const touch = matchMedia("(pointer: coarse)").matches;
const NINJA_SPEED = 2600; // px/s of scrolling that triggers a ninja dash

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hexRgb = (h: string) => {
  const v = h.trim().replace("#", "");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
};
const mix = (a: number[], b: number[], k: number) => a.map((v, i) => v + (b[i] - v) * k);
const emit = (name: string, detail: object) => dispatchEvent(new CustomEvent(name, { detail }));

export type World = {
  hero: { dragX: number; dragY: number; held: boolean };
  toScreen: () => { x: number; y: number };
  scale: () => number;
  pause: () => void;
  play: () => void;
  setHype: (stop: number) => void;
};

export function mountWorld(root: HTMLElement, startHype = 1): World {
  const canvas = root.querySelector<HTMLCanvasElement>(".world canvas")!;
  const ctx = canvas.getContext("2d")!;
  // Panels are drawn on their own layer, so a soft hole can follow the hero through them.
  const panelLayer = document.createElement("canvas");
  const pctx = panelLayer.getContext("2d")!;
  // The road starts under the hype slider when the slider is on the page.
  let startsAtSlider = false;
  let windowOpen = 1;
  const modeBtn = root.querySelector<HTMLButtonElement>("[data-mode]");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = rng(7);

  let S = 4, W = 0, H = 0, WH = 0;
  let road: Pt[] = [];
  let roadLen = 1;
  let crossings: Pt[] = [];
  let zoneSpans: [number, number][] = [];
  let enemies: Enemy[] = [];
  let lanterns: { x: number; y: number; t: number; lit: number }[] = [];
  let roadArt: HTMLCanvasElement | null = null;
  let zones: { name: string; t: number }[] = [];
  let panels: Panel[] = [];
  let panelAlpha = 0.84;
  let towers: { x: number; y: number; w: number; h: number; windows: Pt[] }[] = [];
  let tufts: Pt[] = [];
  let wall = new Uint8Array(0);
  let sky: HTMLCanvasElement | null = null;
  let col: Record<string, string> = {};
  const skyNow = { top: [0, 0, 0], bot: [0, 0, 0] };
  const stars = Array.from({ length: 90 }, () => ({ x: rand(), y: rand(), p: rand() * 6.28, s: 0.6 + rand() * 2 }));

  let hype = startHype;
  const hero = {
    t: 0, x: 0, y: 0, dir: 1 as 1 | -1, speed: 0, phase: 0, blink: 0, jump: 0,
    atk: -1, atkLen: 8, target: null as Enemy | null,
    dragX: 0, dragY: 0, held: false, hurt: 0, homeX: 0,
    look: LOOKS[startHype],
  };
  const scarf = Array.from({ length: 11 }, () => ({ x: 0, y: 0, px: 0, py: 0 }));
  const sparks: Spark[] = [];
  const shots: Shot[] = [];
  let camY = 0, time = 0, shake = 0, embers = 0, placed = false, zoneShown = -1, running = true;
  let day = false, energy = 0, ninjaUntil = 0, blockedFor = 0;
  let prompted: Enemy | null = null;
  let mode: Mode = "fight";
  try {
    if (localStorage.getItem("journey") === "wander") mode = "wander";
  } catch {
    /* storage blocked */
  }

  // --- colors ---------------------------------------------------------------

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n: string) => cs.getPropertyValue(n).trim();
    day = document.documentElement.getAttribute("data-theme") === "light";
    col = {
      bg: v("--color-bg"),
      skyTop: v("--world-sky-top"),
      skyBot: v("--world-sky-bottom"),
      star: v("--world-star"),
      far: v("--world-far"),
      rock: v("--world-rock"),
      rockHi: v("--world-rock-hi"),
      roadHi: v("--world-road-hi"),
      road: v("--world-road"),
      roadLo: v("--world-road-lo"),
      lantern: v("--world-lantern"),
      glow: v("--world-glow"),
      moon: v("--world-moon"),
      window: v("--world-window"),
      grass: v("--world-grass"),
      grassHi: v("--world-grass-hi"),
      accent: v("--color-accent"),
      teal: v("--color-teal"),
      fx: v("--world-fx"),
    };
    const target = skyTarget();
    skyNow.top = target.top;
    skyNow.bot = target.bot;
    sky = paintSky();
    if (road.length) roadArt = paintRoad();
  }

  // The road is painted once per layout or theme into a page-tall offscreen canvas.
  // Steep legs become stone steps cut into the cliff, gentle legs become a cobbled
  // ledge with a rocky underside, and the long legs that cross the content column
  // become rope-and-plank bridges.
  function paintRoad() {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = WH + 16;
    const g = c.getContext("2d")!;
    const dot = (x: number, y: number, color: string, w = 1, h = 1) => {
      g.fillStyle = color;
      g.fillRect(Math.round(x), Math.round(y), w, h);
    };
    const hash = (x: number, y: number) => (((Math.round(x) * 73856093) ^ (Math.round(y) * 19349663)) >>> 0) % 997;
    const mid = W / 2;

    for (let i = 0; i < road.length - 1; i++) {
      const a = road[i], b = road[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const bridge = (a.x - mid) * (b.x - mid) < 0 && Math.abs(dx) > 16;

      if (bridge) {
        const x0 = Math.round(Math.min(a.x, b.x)), x1 = Math.round(Math.max(a.x, b.x));
        const at = (x: number) => a.y + (dy * (x - a.x)) / dx;
        // Posts split the span evenly, and the hand rope sags between each pair.
        const spans = Math.max(1, Math.round((x1 - x0) / 30));
        const posts = Array.from({ length: spans + 1 }, (_, i) => Math.round(x0 + ((x1 - x0) * i) / spans));
        for (let x = x0; x <= x1; x++) {
          const y = Math.round(at(x));
          const p = posts.findIndex((q, i) => i < spans && x >= q && x <= posts[i + 1]);
          const k = (x - posts[p]) / Math.max(1, posts[p + 1] - posts[p]);
          const sag = Math.round(Math.sin(Math.PI * k) * 2);
          // Planks with a dark gap every third column, and a beam underneath.
          const gap = x % 3 === 0;
          dot(x, y, gap ? col.road : col.roadHi);
          dot(x, y + 1, gap ? col.roadLo : col.road);
          dot(x, y + 2, col.roadLo);
          // Ropes and posts use the mid and light woods, so they read against the night sky too.
          dot(x, y - 6 + sag, col.roadHi);
          if (x % 4 === 2) dot(x, y - 5 + sag, col.road, 1, 5 - sag);
          dot(x, y + 4 + sag, col.road);
        }
        for (const x of posts) {
          const y = Math.round(at(x));
          dot(x - 1, y - 7, col.road, 2, 11);
          dot(x, y - 7, col.roadHi, 1, 11);
          dot(x - 1, y - 8, col.roadHi, 2, 1);
        }
        continue;
      }

      if (Math.abs(dy) > Math.abs(dx)) {
        // Steep legs are steps. Each step is three rows: a lit lip, the tread, then its shadow.
        for (let y = Math.round(a.y); y <= b.y; y++) {
          const x = Math.round(a.x + (dx * (y - a.y)) / (dy || 1));
          const r = ((y % 3) + 3) % 3;
          dot(x - 3, y, col.rockHi);
          dot(x - 2, y, r === 0 ? col.roadHi : r === 1 ? col.road : col.roadLo, 5, 1);
          dot(x + 3, y, col.rock, 2, 1);
          if (r === 0 && hash(x, y) % 4 === 0) dot(x - 2 + (hash(x, y) % 5), y, col.rockHi);
          if (r === 0 && hash(y, x) % 7 === 0) dot(x + 2, y - 1, col.grass);
        }
        continue;
      }

      // Gentle legs are a cobbled ledge with a jagged rock underside.
      const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
      for (let x = Math.round(x0); x <= x1; x++) {
        const y = Math.round(dx ? a.y + (dy * (x - a.x)) / dx : a.y);
        const h = hash(x, y);
        dot(x, y, col.roadHi);
        dot(x, y + 1, x % 4 === 0 ? col.roadLo : col.road);
        dot(x, y + 2, (x + 2) % 4 === 0 ? col.roadLo : col.road);
        dot(x, y + 3, col.roadLo);
        dot(x, y + 4, col.rock, 1, 1 + (h % 3));
        if (h % 5 === 0) dot(x, y + 5 + (h % 3), col.rock);
        if (h % 9 === 0) dot(x, y - 1, col.grass);
      }
    }
    return c;
  }

  // The hype slider tints the sky: green for touch grass, LinkedIn blue in the middle, hustle magenta at the top.
  function skyTarget() {
    const cs = getComputedStyle(document.documentElement);
    const tint = hexRgb(cs.getPropertyValue(`--hype-tint-${hype}`).trim() || col.skyTop);
    const k = SKY_TINT[hype];
    return { top: mix(hexRgb(col.skyTop), tint, k * 0.6), bot: mix(hexRgb(col.skyBot), tint, k) };
  }

  function retintSky() {
    const target = skyTarget();
    const from = { a: skyNow.top[0], b: skyNow.top[1], c: skyNow.top[2], d: skyNow.bot[0], e: skyNow.bot[1], f: skyNow.bot[2] };
    animate(from, {
      a: target.top[0], b: target.top[1], c: target.top[2],
      d: target.bot[0], e: target.bot[1], f: target.bot[2],
      duration: reduce ? 0 : 900,
      ease: "outQuad",
      onUpdate: () => {
        skyNow.top = [from.a, from.b, from.c];
        skyNow.bot = [from.d, from.e, from.f];
        sky = paintSky();
      },
    });
  }

  // An ordered 4×4 Bayer dither turns the sky gradient into visible pixel bands.
  function paintSky() {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d")!;
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const f = y / H + (bayer[(y % 4) * 4 + (x % 4)] / 16 - 0.5) * 0.12;
        const k = Math.round(Math.min(Math.max(f, 0), 1) * 7) / 7;
        const i = (y * W + x) * 4;
        for (let ch = 0; ch < 3; ch++) img.data[i + ch] = skyNow.top[ch] + (skyNow.bot[ch] - skyNow.top[ch]) * k;
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  // --- layout -----------------------------------------------------------------

  function layout() {
    S = innerWidth >= 900 ? 4 : 3;
    W = Math.ceil(innerWidth / S);
    H = Math.ceil(innerHeight / S);
    canvas.width = W;
    canvas.height = H;
    panelLayer.width = W;
    panelLayer.height = H;
    canvas.style.width = `${W * S}px`;
    canvas.style.height = `${H * S}px`;
    WH = Math.ceil(document.documentElement.scrollHeight / S);
    const terrain = rng(11);

    // Lanes are the gutters beside the content column. On narrow screens the
    // road runs behind the column instead, and denser panels keep text readable.
    // The column is the widest section container, so the road never runs under real text.
    const containers = Array.from(document.querySelectorAll<HTMLElement>("body > section[id] .container"));
    const colW = Math.max(0, ...containers.map((c) => c.getBoundingClientRect().width)) || Math.min(innerWidth - 2 * 150, 1000);
    let colL = (innerWidth - colW) / 2 / S, colR = (innerWidth + colW) / 2 / S;
    let left: [number, number] = [MARGIN, Math.floor(colL) - 3];
    let right: [number, number] = [Math.ceil(colR) + 3, W - MARGIN];
    panelAlpha = 0.84;
    // Below about 1000px the gutters are too narrow for the road, so the column
    // spans the screen and the panels behind the text get denser.
    if (colW < 700 || left[1] - left[0] < 16) {
      panelAlpha = 0.95;
      colL = W * 0.06;
      colR = W * 0.94;
      left = [MARGIN + 2, Math.round(W * 0.32)];
      right = [Math.round(W * 0.68), W - MARGIN - 2];
    }

    const ids = ["experience", "awards", "education", "publicspeaking", "projects", "news", "research", "footer"];
    const blocks = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const top = (el: Element) => (el.getBoundingClientRect().top + scrollY) / S;
    // Crossings sit in each section's top padding. The footer's crossing sits mid-arena, where the final boss waits.
    const padTop = (el: Element) => parseFloat(getComputedStyle(el).paddingTop) || 80;
    const boundaries = blocks.map((el) => Math.round(el.id === "footer" ? top(el) + (el.offsetHeight * 0.42) / S : top(el) + (padTop(el) * 0.74) / S));
    // The hero starts in the gap under the hype slider, then walks out to the right gutter.
    const ctrl = document.querySelector<HTMLElement>(".hype-control")?.getBoundingClientRect();
    startsAtSlider = !!ctrl && ctrl.width > 0;
    const start = startsAtSlider ? { x: Math.round((ctrl!.left + ctrl!.width / 2) / S), y: Math.round((ctrl!.bottom + scrollY) / S) + 15 } : null;
    const journey = buildJourney({ top: start ? start.y : 26, bottom: WH - 14, boundaries, left, right, leg: 56, cross: 6, sway: 0.35, rand: terrain });
    // Rounded turns, so the hero and the painted road both follow smooth bends.
    road = roundCorners(start ? [start, ...journey.road] : journey.road, 7, 6);
    crossings = journey.crossings;
    roadLen = road.slice(1).reduce((a, p, i) => a + Math.hypot(p.x - road[i].x, p.y - road[i].y), 0);

    const names = blocks.map((el) => el.querySelector<HTMLElement>("[data-heading]")?.dataset.title || "Arena");
    zones = [{ name: "Start", t: 0 }, ...crossings.map((c, i) => ({ name: names[i], t: tAtY(road, c.y) }))];
    const ts = crossings.map((c) => tAtY(road, c.y));
    // Minions never spawn on the walk out from under the slider.
    const walkOut = start ? Math.abs(journey.road[0].x - start.x) / roadLen : 0;
    zoneSpans = ts.map((t, i) => [i ? ts[i - 1] : walkOut, t]);
    lanterns = crossings.map((c, i) => {
      const p = pointAt(road, Math.max(0, ts[i] - 12 / roadLen));
      return { x: p.x, y: p.y, t: ts[i], lit: 0 };
    });

    // Bosses keep their state across relayouts. Minions respawn from the plan.
    const prevBosses = enemies.filter((e) => e.tier !== "minion");
    const bosses: Enemy[] = crossings.map((c, i) => {
      const last = i === crossings.length - 1 && blocks[i]?.id === "footer";
      const old = prevBosses[i];
      const max = last ? 40 : 6;
      return {
        tier: last ? "boss" : "mini",
        look: i % MINI_BOSSES.length,
        t: ts[i],
        x: c.x,
        y: c.y,
        hp: old ? old.hp : max,
        max,
        flash: 0,
        kx: 0,
        dying: 0,
        alive: old ? old.alive : true,
        zone: i,
        phase: rand() * 6,
        engaged: old ? old.engaged : false,
        timer: 0,
        telegraph: 0,
      };
    });
    enemies = [...bosses, ...spawnMinions()];

    panels = Array.from(document.querySelectorAll<HTMLElement>("header.home, section, footer")).map((el) => {
      const r = el.getBoundingClientRect();
      // The footer keeps its arena clear and only shades the links at the bottom.
      if (el.id === "footer") return { x0: colL - 2, x1: colR + 2, y0: (r.bottom + scrollY - 190) / S, y1: (r.bottom + scrollY - 16) / S };
      return { x0: colL - 2, x1: colR + 2, y0: (r.top + scrollY + parseFloat(getComputedStyle(el).paddingTop) - 24) / S, y1: (r.bottom + scrollY - 40) / S };
    });

    wall = new Uint8Array(WH + H + 8);
    const a = terrain() * 6, b = terrain() * 6;
    for (let y = 0; y < wall.length; y++) wall[y] = Math.max(1, Math.round(2 + Math.sin(y * 0.04 + a) * 1.3 + Math.sin(y * 0.13 + b) * 0.8));

    towers = [];
    for (let y = 20; y < WH * 0.3 + H; y += 30 + terrain() * 60) {
      const w = 6 + Math.round(terrain() * 10), h = 30 + Math.round(terrain() * 60);
      const x = Math.round(terrain() * (W - w));
      if (y < 90 && x + w > W - 56 && x < W - 4) continue; // keep the sun or moon corner clear
      const windows = Array.from({ length: 1 + Math.round(terrain() * 3) }, () => ({ x: x + 1 + Math.round(terrain() * (w - 3)), y: y + 4 + Math.round(terrain() * (h - 10)) }));
      towers.push({ x, y, w, h, windows });
    }
    tufts = [];
    for (let i = 0; i < road.length - 1; i++) {
      const p = road[i], q = road[i + 1];
      if (terrain() < 0.5) continue;
      const f = terrain();
      tufts.push({ x: Math.round(p.x + (q.x - p.x) * f), y: Math.round(p.y + (q.y - p.y) * f) });
    }
    readColors();
    if (!placed) {
      snap();
      placed = true;
      // A load mid-page counts every boss already behind the hero as beaten.
      for (const e of enemies) if (e.tier !== "minion" && e.t < hero.t) e.alive = false;
      emit("world:state", { cleared: enemies.filter((e) => e.tier === "mini" && !e.alive).map((e) => e.zone) });
    }
  }

  // Minions ahead of the hero follow the current hype density. Ones behind him stay beaten.
  function spawnMinions(): Enemy[] {
    const plan = spawnPlan(zoneSpans, MINIONS_PER_ZONE[hype], 16 / roadLen);
    return plan.map((p, i) => {
      const at = pointAt(road, p.t);
      return {
        tier: "minion",
        look: i % 3 === 2 ? 1 : 0,
        t: p.t,
        x: at.x,
        y: at.y,
        hp: 1,
        max: 1,
        flash: 0,
        kx: 0,
        dying: 0,
        alive: p.t > hero.t,
        zone: p.zone,
        phase: rand() * 6,
        engaged: false,
        timer: 0,
        telegraph: 0,
      };
    });
  }

  // The hero leads at 62% of the screen, or 70% on phones, so fights start low enough to stay in view.
  const goal = () => tAtY(road, (scrollY + innerHeight * (innerWidth < 700 ? 0.7 : 0.62)) / S);
  const screen = (x: number, y: number) => ({ x: x * S, y: y * S - scrollY });

  function place() {
    const p = pointAt(road, hero.t);
    hero.x = p.x + hero.homeX;
    hero.y = p.y;
    hero.dir = p.dir;
  }

  // The slider thumb's center, in world pixels.
  function thumbAt() {
    const input = document.querySelector<HTMLInputElement>(".hype-control input");
    const r = input?.getBoundingClientRect();
    if (!input || !r?.width) return road[0].x;
    return (r.left + 9 + ((r.width - 18) * Number(input.value)) / 100) / S;
  }

  function snap() {
    hero.t = goal();
    place();
    for (const n of scarf) {
      n.x = n.px = hero.x;
      n.y = n.py = hero.y - 10;
    }
  }

  function spark(x: number, y: number, vx: number, vy: number, life: number, c: string) {
    if (sparks.length < 220) sparks.push({ x, y, vx, vy, life, max: life, c });
  }

  function nameOf(e: Enemy) {
    return e.tier === "boss" ? "AI Slop PR #4096" : e.tier === "mini" ? MINI_BOSSES[e.look].name : "";
  }

  // A slash: a bright streak drawn across the enemy on the canvas, plus an event
  // so hud.ts can sweep an SVG arc over the page at the same spot.
  const streaks: { x: number; y: number; life: number; dir: 1 | -1 }[] = [];
  function slash(e: Enemy) {
    const lift = e.tier === "boss" ? 14 : e.tier === "mini" ? 10 : 5;
    streaks.push({ x: e.x, y: e.y - lift, life: 8, dir: hero.dir });
    emit("world:slash", { ...screen(e.x, e.y - lift), dir: hero.dir, size: e.tier === "boss" ? 3 : e.tier === "mini" ? 2 : 1 });
  }

  function say(e: Enemy, line: number) {
    emit("world:say", { ...screen(e.x, e.y - 32), text: SLOP_LINES[line % SLOP_LINES.length] });
  }

  // --- combat -------------------------------------------------------------------

  function damage(e: Enemy, dmg: number) {
    e.hp = Math.max(0, e.hp - dmg);
    e.flash = 3;
    e.kx = hero.dir * (e.tier === "minion" ? 3 : 1.5);
    shake = Math.max(shake, e.tier === "minion" ? 1 : 2);
    const hitColor = hero.look.weapon === "keyboard" ? hero.look.weaponColor : col.fx;
    for (let i = 0; i < 6; i++) spark(e.x, e.y - 6, hero.dir * (0.4 + rand()), -rand() * 0.9, 12, i % 2 ? hitColor : col.teal);
    const at = screen(e.x, e.y - (e.tier === "boss" ? 26 : 10));
    emit("world:hit", { ...at, dmg, tier: e.tier, zone: e.zone, hp: e.hp, max: e.max });
    if (e.hp > 0) return;

    e.alive = false;
    e.dying = e.tier === "boss" ? 40 : 14;
    shake = e.tier === "boss" ? 10 : e.tier === "mini" ? 5 : 2;
    const reward = e.tier === "boss" ? 25 : e.tier === "mini" ? 5 : 1;
    embers += reward;
    const n = e.tier === "boss" ? 90 : e.tier === "mini" ? 40 : 14;
    const palette =
      e.tier === "boss" ? [SLOP_PAL.S, SLOP_PAL.E, SLOP_PAL.Y, SLOP_PAL.G]
      : e.tier === "mini" ? [MINI_BOSSES[e.look].pal.A, MINI_BOSSES[e.look].pal.a, col.lantern]
      : ["#6bd36b", "#b8f5a0", col.lantern];
    for (let i = 0; i < n; i++) spark(e.x, e.y - 8, (rand() - 0.5) * (e.tier === "boss" ? 4 : 2.2), -rand() * 2.2, 24 + rand() * 24, palette[i % palette.length]);
    emit("world:defeat", { ...at, tier: e.tier, zone: e.zone, name: nameOf(e), reward, embers });
  }

  function step() {
    time++;
    if (shake > 0) shake--;
    if (hero.hurt > 0) hero.hurt--;

    // Minions pace a few pixels back and forth along their stretch of road.
    for (const e of enemies) {
      if (e.tier === "minion" && e.alive) {
        const p = pointAt(road, e.t + (Math.sin(time * 0.03 + e.phase) * 5) / roadLen);
        e.x = p.x;
        e.y = p.y;
      }
      if (e.flash) e.flash--;
      e.kx *= 0.7;
      if (e.dying) e.dying--;
    }

    // The hero walks toward a point 62% down the viewport. Any live enemy ahead
    // blocks the road, and only the reader's scrolling swings the weapon, so a
    // fight takes a little scroll to win. A very fast scroll turns him into a
    // speedy ninja who dashes through minions and hits mini-bosses three times
    // as hard. The final boss parries the dash.
    const want = goal();
    const fight = mode === "fight";
    const ninja = fight && time < ninjaUntil;
    // The nearest live enemy ahead blocks the road. A ninja dash ignores minions.
    let blocker: Enemy | undefined;
    if (fight) {
      for (const e of enemies) {
        if (!e.alive || e.t < hero.t - 1e-6 || (ninja && e.tier === "minion")) continue;
        if (!blocker || e.t < blocker.t) blocker = e;
      }
    }
    const reach = blocker?.tier === "boss" ? 16 : blocker?.tier === "mini" ? 9 : 7;
    const stopAt = blocker ? blocker.t - reach / roadLen : 1;
    const target = blocker && want >= stopAt ? stopAt : want;
    const gap = (target - hero.t) * roadLen;
    let mag = Math.min(Math.abs(gap), Math.max(ninja ? 5 : 1.3, Math.abs(gap) * (ninja ? 0.2 : 0.08)));
    if (hero.atk >= 0 && !ninja) mag *= 0.3;
    const prevX = hero.x, prevT = hero.t;
    hero.t += (Math.sign(gap) * mag) / roadLen;
    place();
    hero.speed = hero.speed * 0.7 + mag * 0.3;
    // Before the walk starts, he stands under the slider thumb and walks along as it moves.
    const home = startsAtSlider && hero.t < 1e-4 ? thumbAt() - road[0].x : 0;
    const step = Math.max(-2.6, Math.min(2.6, (home - hero.homeX) * 0.2));
    hero.homeX += step;
    if (Math.abs(step) > 0.05) {
      hero.dir = step > 0 ? 1 : -1;
      hero.speed = Math.max(hero.speed, Math.abs(step));
    }
    if (Math.abs(hero.x - prevX) > 0.01) hero.dir = hero.x > prevX ? 1 : -1;
    hero.phase += hero.speed / 2.4;
    if (hero.blink > 0) hero.blink--;
    else if (rand() < 0.008) hero.blink = 4;

    // A ninja dash cuts down every minion the hero passed this frame, even ones he
    // skipped over between frames, and leaves a teal streak behind him.
    if (ninja) {
      const lo = Math.min(prevT, hero.t) - 6 / roadLen, hi = Math.max(prevT, hero.t) + 6 / roadLen;
      for (const e of enemies) {
        if (e.tier !== "minion" || !e.alive || e.t < lo || e.t > hi) continue;
        damage(e, 1);
        slash(e);
      }
      if (rand() < 0.8) spark(hero.x - hero.dir * 4, hero.y - 8 + (rand() - 0.5) * 8, -hero.dir * 0.6, 0, 8, col.teal);
    }

    const atBlocker = !!blocker && want > stopAt && Math.abs(hero.t - stopAt) * roadLen < 1.2;
    const foe = atBlocker ? blocker : undefined;
    if (foe && foe.tier !== "minion" && !foe.engaged) {
      foe.engaged = true;
      emit("world:engage", { tier: foe.tier, name: nameOf(foe), hp: foe.hp, max: foe.max, zone: foe.zone });
      if (foe.tier === "boss") say(foe, 0);
    }
    if (foe) {
      hero.dir = foe.x >= hero.x ? 1 : -1;
      // Standing still in front of a monster for a beat shows a hint once per monster.
      if (++blockedFor === 40 && !touch && energy < perSwing() && prompted !== foe) {
        prompted = foe;
        emit("world:prompt", screen(hero.x, hero.y - 24));
      }
    } else {
      blockedFor = 0;
      energy = Math.min(energy, perSwing());
    }
    // When the reader has scrolled well past the hero, he cuts minions down for free
    // to catch up, so he reaches the next boss while it's still on screen.
    const lagging = foe?.tier === "minion" && (want - hero.t) * roadLen * S > innerHeight * 0.15;
    // On touch screens he also fights on his own, swinging every 20 frames while blocked.
    const free = lagging || (touch && blockedFor >= 20);
    if (foe && hero.atk < 0 && (free || energy >= perSwing())) {
      if (!free) energy -= perSwing();
      blockedFor = 0;
      hero.target = foe;
      hero.atkLen = ninja || lagging ? 4 : 7;
      hero.atk = 0;
    }
    if (hero.atk >= 0) {
      const tgt = hero.target;
      if (tgt) hero.dir = tgt.x >= hero.x ? 1 : -1;
      hero.atk++;
      if (tgt && tgt.alive && hero.atk === Math.max(2, Math.floor(hero.atkLen * 0.45))) {
        damage(tgt, ninja && tgt.tier === "mini" ? 3 : 1);
        if (!tgt.alive || ninja) slash(tgt);
      }
      if (hero.atk >= hero.atkLen) {
        hero.atk = -1;
        hero.target = null;
      }
    }

    // The final boss fights back. It telegraphs, then throws em-dashes and sparkles.
    const boss = enemies.find((e) => e.tier === "boss" && e.alive && e.engaged);
    if (boss && fight) {
      boss.timer++;
      const enraged = boss.hp <= boss.max / 2;
      const every = enraged ? 50 : 80;
      if (boss.timer % every === every - 16) {
        boss.telegraph = 16;
        if (rand() < 0.6) say(boss, 1 + Math.floor(rand() * (SLOP_LINES.length - 1)));
      }
      if (boss.telegraph > 0 && --boss.telegraph === 0) {
        const n = enraged ? 5 : 3;
        for (let i = 0; i < n; i++) {
          shots.push({ x: boss.x - 4, y: boss.y - 16 - i * 3, vx: (hero.x - boss.x) / 22 + (rand() - 0.5) * 0.3, vy: -0.8 - rand() * 0.6, kind: i % 2 ? "sparkle" : "dash", life: 60 });
        }
      }
    }
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.06;
      if (--s.life <= 0 || s.y > hero.y + 4) {
        shots.splice(i, 1);
        continue;
      }
      if (Math.abs(s.x - hero.x) < 4 && Math.abs(s.y - (hero.y - 8)) < 8) {
        shots.splice(i, 1);
        hero.hurt = 10;
        hero.t = Math.max(0, hero.t - 7 / roadLen);
        shake = 4;
        for (let k = 0; k < 8; k++) spark(hero.x, hero.y - 8, (rand() - 0.5) * 1.5, -rand(), 14, k % 2 ? col.fx : SLOP_PAL.E);
        emit("world:hurt", screen(hero.x, hero.y - 16));
      }
    }

    // In wander mode, enemies are spirits that drift up and away as the hero passes. The final boss naps.
    if (!fight) {
      for (const e of enemies) {
        if (e.alive && hero.t > e.t && e.tier !== "boss") {
          e.alive = false;
          e.dying = 40;
          for (let i = 0; i < 10; i++) spark(e.x, e.y - 8, (rand() - 0.5) * 0.4, -0.3 - rand() * 0.4, 50, col.teal);
          if (e.tier === "mini") emit("world:defeat", { ...screen(e.x, e.y), tier: "mini", zone: e.zone, name: "", reward: 0, embers, quiet: true });
        }
      }
    }

    // The scarf (or tie) is a verlet chain pinned at the neck. Wind and inertia make it trail.
    scarf[0].x = hero.x - hero.dir * 3.5;
    scarf[0].y = hero.y - 10 + hero.jump;
    const wind = -hero.dir * (0.02 + hero.speed * 0.09) + Math.sin(time * 0.06) * 0.035;
    for (let i = 1; i < scarf.length; i++) {
      const n = scarf[i];
      const vx = (n.x - n.px) * 0.9, vy = (n.y - n.py) * 0.9;
      n.px = n.x;
      n.py = n.y;
      n.x += vx + wind;
      n.y += vy + 0.06 - Math.min(hero.speed, 2) * 0.03 + Math.sin(time * 0.15 + i) * 0.02;
    }
    for (let k = 0; k < 3; k++) {
      for (let i = 1; i < scarf.length; i++) {
        const a = scarf[i - 1], b = scarf[i];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = (d - 1.2) / d;
        b.x -= dx * f;
        b.y -= dy * f;
      }
    }

    if (hero.held && rand() < 0.3) spark(hero.x + hero.dragX + (rand() - 0.5) * 6, hero.y + hero.dragY, 0, 0.3, 16, col.rockHi);
    if (hero.speed > 1.6 && rand() < 0.5) spark(hero.x - hero.dir * 2, hero.y, -hero.dir * 0.3, -0.15, 14, col.rockHi);
    if (hero.look.aura && rand() < hero.look.aura) spark(hero.x + (rand() - 0.5) * 4, hero.y - 14, (rand() - 0.5) * 0.2, -0.35, 30, rand() < 0.5 ? col.lantern : col.accent);
    for (const l of lanterns) {
      l.lit += ((hero.t >= l.t - 0.001 ? 1 : 0) - l.lit) * 0.08;
      if (l.lit > 0.6 && rand() < 0.03) spark(l.x, l.y - 10, (rand() - 0.5) * 0.1, -0.25, 40, col.lantern);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.vx *= 0.97;
      if (--p.life <= 0) sparks.splice(i, 1);
    }

    const zi = zones.reduce((acc, z, i) => (hero.t >= z.t ? i : acc), 0);
    if (zi !== zoneShown) {
      zoneShown = zi;
      emit("world:zone", { index: zi, name: zones[zi]?.name ?? "Start" });
    }
  }

  // --- drawing --------------------------------------------------------------------

  const px = (x: number, y: number, c: string, w = 1, h = 1) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y - camY), w, h);
  };

  function glow(x: number, y: number, r: number, a: number, rgb = col.glow) {
    if (a <= 0) return;
    const g = ctx.createRadialGradient(x, y - camY, 0, x, y - camY, r);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - camY - r, r * 2, r * 2);
    ctx.globalCompositeOperation = "source-over";
  }

  function sprite(rows: Frame, left: number, top: number, d: 1 | -1, pal: Record<string, string>) {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const k = row[c];
        if (k === "." || !pal[k]) continue;
        px(d > 0 ? left + c : left + (row.length - 1 - c), top + r, pal[k]);
      }
    }
  }

  function draw() {
    if (!W) return;
    camY = scrollY / S + (shake ? (rand() - 0.5) * shake : 0);
    ctx.drawImage(sky!, 0, 0);

    for (const s of stars) {
      const y = (((s.y * H * 2 - camY * 0.06) % (H * 2)) + H * 2) % (H * 2);
      const tw = Math.sin(time * 0.05 * s.s + s.p);
      if (y < H && tw > -0.2) {
        ctx.globalAlpha = 0.3 + 0.5 * tw * tw;
        ctx.fillStyle = col.star;
        ctx.fillRect(Math.round(s.x * W), Math.round(y), 1, 1);
      }
    }
    ctx.globalAlpha = 1;

    // Night hangs a moon in the top right corner. Dawn puts the sun there instead.
    // The inset keeps the sun and moon clear of the theme toggle and the top nav.
    const inset = Math.max(30, Math.min(46, W * 0.12));
    const mx = W - inset, my = inset + 4 - camY * 0.03;
    if (day && my > -24) {
      glow(mx, my + camY, 40, 0.28, "255,196,110");
      ctx.fillStyle = "#ffd56a";
      ctx.beginPath();
      ctx.arc(mx, my, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff1c2";
      ctx.fillRect(mx - 3, my - 4, 3, 2);
      // Eight pixel rays that alternate between long and short every half second.
      const long = Math.floor(time / 15) % 2;
      ctx.fillStyle = "#ffc04a";
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = 12 + ((i + long) % 2 ? 3 : 0);
        ctx.fillRect(Math.round(mx + Math.cos(a) * r), Math.round(my + Math.sin(a) * r), 2, 2);
      }
    } else if (my > -16) {
      glow(mx, my + camY, 34, 0.12, "200,190,255");
      ctx.fillStyle = col.moon;
      ctx.beginPath();
      ctx.arc(mx, my, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = col.far;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(mx - 4, my - 2, 3, 3);
      ctx.fillRect(mx + 2, my + 3, 3, 2);
      ctx.fillRect(mx + 3, my - 5, 2, 2);
      ctx.globalAlpha = 1;
    }

    for (const t of towers) {
      const y = Math.round(t.y - camY * 0.3);
      if (y > H || y + t.h < 0) continue;
      ctx.fillStyle = col.far;
      ctx.fillRect(t.x, y, t.w, t.h);
      for (let cx = t.x; cx < t.x + t.w; cx += 2) ctx.fillRect(cx, y - 2, 1, 2);
      ctx.fillStyle = col.window;
      for (const w of t.windows) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 0.05 + w.x * 3 + w.y);
        ctx.fillRect(w.x, Math.round(w.y - camY * 0.3), 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    for (let row = 0; row < H; row++) {
      const yw = Math.max(0, Math.round(camY) + row);
      const l = wall[yw % wall.length], r = wall[(yw + 211) % wall.length];
      ctx.fillStyle = col.rock;
      ctx.fillRect(0, row, l, 1);
      ctx.fillRect(W - r, row, r, 1);
      ctx.fillStyle = col.rockHi;
      ctx.fillRect(l, row, 1, 1);
      ctx.fillRect(W - r - 1, row, 1, 1);
    }

    if (roadArt) {
      const sy = Math.round(camY);
      ctx.drawImage(roadArt, 0, sy, W, H, 0, 0, W, H);
    }
    for (const g of tufts) {
      if (g.y < camY - 4 || g.y > camY + H + 4) continue;
      px(g.x, g.y - 1, col.grass);
      px(g.x + (Math.sin(time * 0.06 + g.x) > 0.4 ? 1 : 0), g.y - 2, col.grassHi);
    }

    for (const l of lanterns) {
      if (l.y < camY - 20 || l.y > camY + H + 20) continue;
      px(l.x, l.y - 8, col.roadLo, 1, 8);
      px(l.x - 1, l.y - 11, l.lit > 0.5 ? col.lantern : col.road, 3, 3);
      px(l.x - 1, l.y - 12, col.roadLo, 3, 1);
      if (l.lit > 0.05) glow(l.x + 0.5, l.y - 9.5, 12 + Math.sin(time * 0.3 + l.x), 0.35 * l.lit);
    }

    for (const e of enemies) drawEnemy(e);
    drawHero();

    for (const s of shots) {
      if (s.kind === "dash") px(s.x - 2, s.y, col.fx, 5, 1);
      else {
        px(s.x, s.y - 1, SLOP_PAL.Y, 1, 3);
        px(s.x - 1, s.y, SLOP_PAL.Y, 3, 1);
      }
    }
    for (let i = streaks.length - 1; i >= 0; i--) {
      const k = streaks[i];
      ctx.globalAlpha = k.life / 8;
      for (let j = -9; j <= 9; j++) {
        px(k.x + j * k.dir, k.y + j * 0.55, col.fx, 1, 1);
        px(k.x + j * k.dir, k.y + j * 0.55 + 1, col.teal, 1, 1);
      }
      if (--k.life <= 0) streaks.splice(i, 1);
    }
    for (const p of sparks) {
      ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.5);
      px(p.x, p.y, p.c);
    }
    ctx.globalAlpha = 1;

    // Panels behind text. Dithered edges keep them pixel-native.
    pctx.clearRect(0, 0, W, H);
    pctx.fillStyle = col.bg;
    for (const p of panels) {
      if (p.y1 < camY || p.y0 > camY + H) continue;
      const x0 = Math.round(p.x0), w = Math.round(p.x1 - p.x0);
      const y0 = Math.round(p.y0 - camY), y1 = Math.round(p.y1 - camY);
      pctx.globalAlpha = panelAlpha;
      pctx.fillRect(x0, y0, w, y1 - y0);
      for (let k = 1; k <= 5; k++) {
        pctx.globalAlpha = panelAlpha * (1 - k / 6);
        pctx.fillRect(x0, y0 - k, w, 1);
        pctx.fillRect(x0, y1 + k - 1, w, 1);
        pctx.fillRect(x0 - k, y0, 1, y1 - y0);
        pctx.fillRect(x0 + w + k - 1, y0, 1, y1 - y0);
      }
    }
    // A soft window follows the hero. Over text it thins the panel to about half, never
    // to zero, so the words over him stay readable. While he waits in the empty gap under
    // the slider, the window opens fully.
    const hx = hero.x + hero.dragX, hy = hero.y + hero.dragY - 7 - camY;
    windowOpen += ((startsAtSlider && hero.t < 1e-4 ? 1 : 0.5) - windowOpen) * 0.06;
    const open = windowOpen.toFixed(3);
    const hole = pctx.createRadialGradient(hx, hy, 0, hx, hy, 15);
    hole.addColorStop(0, `rgba(0,0,0,${open})`);
    hole.addColorStop(0.6, `rgba(0,0,0,${(windowOpen * 0.7).toFixed(3)})`);
    hole.addColorStop(1, "rgba(0,0,0,0)");
    pctx.globalAlpha = 1;
    pctx.globalCompositeOperation = "destination-out";
    pctx.fillStyle = hole;
    pctx.fillRect(hx - 16, hy - 16, 32, 32);
    pctx.globalCompositeOperation = "source-over";
    ctx.drawImage(panelLayer, 0, 0);
  }

  function drawEnemy(e: Enemy) {
    if (e.y < camY - 40 || e.y > camY + H + 40) return;
    if (!e.alive && !e.dying) return;
    const fight = mode === "fight";
    if ((!fight && e.tier !== "boss") || (!e.alive && e.dying > 14 && e.tier !== "boss")) {
      // A spirit: a small teal flame that bobs above the road, then rises away once passed.
      ctx.globalAlpha = e.alive ? 1 : e.dying / 40;
      const big = e.tier === "mini" ? 2 : 1;
      const by = e.y - 8 * big + Math.sin(time * 0.08 + e.phase) * 1.5 - (e.alive ? 0 : (40 - e.dying) * 0.4);
      glow(e.x, by, 8 * big, 0.25, "95,216,198");
      px(e.x - big, by - big, col.teal, 2 * big + 1, 2 * big + 1);
      px(e.x, by - 2 * big, "#ffffff");
      ctx.globalAlpha = 1;
      return;
    }
    if (!e.alive) ctx.globalAlpha = e.dying / (e.tier === "boss" ? 40 : 14);
    const dir: 1 | -1 = hero.x > e.x ? 1 : -1;
    const white = e.flash > 0 || e.telegraph % 4 > 1;

    if (e.tier === "minion") {
      // By day the slimes wear sunglasses and the bats are seagulls.
      const pal = day ? MINION_DAY : MINION_NIGHT;
      const p = white ? WHITE(pal) : pal;
      if (e.look === 0) sprite((day ? SLIME_DAY : SLIME)[Math.floor((time + e.phase * 10) / 6) % 2], e.x - 5 + e.kx, e.y - 7, dir, p);
      else sprite((day ? GULL : BAT)[Math.floor(time / 4) % 2], e.x - 5 + e.kx, e.y - 13 + Math.round(Math.sin(time * 0.12 + e.phase) * 2), dir, p);
    } else if (e.tier === "mini") {
      const m = MINI_BOSSES[e.look];
      const frame = m.frames[Math.floor((time + e.phase * 10) / 7) % m.frames.length];
      const lift = m.flying ? 12 + Math.round(Math.sin(time * 0.08 + e.phase) * 2) : 0;
      glow(e.x, e.y - 6 - lift, 16, e.alive ? 0.12 : 0, "255,80,120");
      sprite(frame, e.x - Math.floor(frame[0].length / 2) + e.kx, e.y - frame.length - lift, dir, white ? WHITE(m.pal) : day ? dayPalette(m.pal) : m.pal);
    } else {
      const frame = SLOP_PR[Math.floor(time / 9) % 2];
      const enraged = e.hp <= e.max / 2;
      const bob = Math.round(Math.sin(time * 0.06) * 1.5);
      glow(e.x, e.y - 14, 30, enraged ? 0.32 : 0.18, enraged ? "255,79,216" : "127,174,154");
      const left = e.x - Math.floor(frame[0].length / 2) + e.kx, top = e.y - frame.length + bob;
      sprite(frame, left, top, dir, white ? WHITE(SLOP_PAL) : day ? dayPalette(SLOP_PAL) : SLOP_PAL);
      // The slop glitches. A few rows tear sideways every few frames, and more once it's enraged.
      if (e.alive && time % (enraged ? 3 : 7) === 0) {
        const tears = enraged ? 4 : 2;
        for (let i = 0; i < tears; i++) {
          const row = Math.round(top - camY + rand() * frame.length);
          const shift = Math.round((rand() - 0.5) * (enraged ? 8 : 4));
          const h = 1 + Math.floor(rand() * 2), x = Math.round(left - 2), w = frame[0].length + 4;
          ctx.drawImage(canvas, x, row, w, h, x + shift, row, w, h);
        }
      }
      if (e.telegraph) px(e.x, e.y - frame.length - 6 + bob, col.fx, 1, 3);
      // Napping in wander mode: little z's float up.
      if (!fight && e.alive && time % 60 < 40) px(e.x + 10, e.y - frame.length - 4 - ((time % 60) >> 3), col.teal, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawHero() {
    const look = hero.look;
    const d = hero.dir;
    const fighting = hero.atk >= 0;
    const moving = hero.speed > 0.08;
    const running = hero.speed > 1.6;
    const passing = moving && Math.floor(hero.phase) % 2 === 1;
    const breathe = !moving && !fighting && Math.sin(time * 0.09) > 0.6 ? 1 : 0;
    const left = Math.round(hero.x + hero.dragX) - 6;
    const feet = Math.round(hero.y + hero.dragY) - 1 + Math.round(hero.jump);
    const top = feet - 15 - (passing ? 1 : 0) + breathe;
    const swingPhase = fighting ? hero.atk / hero.atkLen : -1;
    const lunging = swingPhase >= 0.4 && swingPhase < 0.75;
    const lean = running || lunging ? d : 0;
    const flash = hero.hurt > 0 && hero.hurt % 4 > 1;
    const eyes = hero.blink ? look.pal.f : hype >= 2 ? "#fff6c9" : look.pal.e;
    const pal: Record<string, string> = flash ? WHITE(look.pal) : look.pal.e ? { ...look.pal, e: eyes } : look.pal;

    if (look.aura) glow(left + 6, top + 6, 13 + look.aura * 30, look.aura, "255,120,60");

    for (let i = look.trailLength - 1; i >= 1; i--) {
      const n = scarf[i];
      px(n.x + hero.dragX, n.y + hero.dragY, i >= look.trailLength - 2 ? look.trail[1] : look.trail[0], i < 5 ? 2 : 1, 1);
    }

    const legs = hero.held ? LEGS.pass : lunging ? LEGS.lunge : !moving ? LEGS.idle : running ? (passing ? LEGS.pass : LEGS.run) : passing ? LEGS.pass : LEGS.stride;
    sprite(legs, left, feet - 2, d, pal);
    sprite(look.body.slice(7), left, top + 7, d, pal);
    sprite(look.body.slice(0, 7), left + lean, top, d, pal);
    drawWeapon(look, left + 6 + lean + d * 3, top + 9, d, swingPhase);

    if (look.crown) {
      for (let i = 0; i < 4; i++) {
        const f = Math.sin(time * 0.4 + i * 1.7);
        px(left + lean + 4 + (i % 3), top - 1 - Math.round(f + 1) - (i === 1 ? 1 : 0), i % 2 ? col.accent : col.lantern);
      }
    }
  }

  // The sword rests low behind him. The keyboard rides under his arm. Both rise on the
  // wind-up and sweep an arc on the slash, and the keyboard sheds keycaps as it lands.
  function drawWeapon(look: Look, sx: number, sy: number, d: 1 | -1, p: number) {
    const kb = look.weapon === "keyboard";
    const c = look.weaponColor;
    if (p < 0) {
      if (kb) {
        px(d > 0 ? sx - 7 : sx + 1, sy + 1, c, 6, 2);
        for (let i = 0; i < 3; i++) px((d > 0 ? sx - 6 : sx + 2) + i * 2, sy + 1, "#2a2f3a");
      } else {
        px(sx - d * 5, sy + 1, "#c9a45a");
        for (let i = 1; i <= 4; i++) px(sx - d * 5 - d * i * 0.5, sy + 1 + i, c);
      }
      return;
    }
    if (p < 0.4) {
      if (kb) px(sx - d * 3 - 3, sy - 8, c, 6, 2);
      else for (let i = 0; i < 5; i++) px(sx - d * 2, sy - 4 - i, i ? c : "#c9a45a");
      return;
    }
    if (p < 0.75) {
      const reach = p < 0.55 ? 1 : 0.65;
      for (let a = -1.3; a <= 1.1; a += 0.12) {
        const r = 6 + (a > 0 ? 1 : 0) + (kb ? 1 : 0);
        const x = sx + d * Math.cos(a) * r * reach, y = sy + Math.sin(a) * r;
        px(x, y, a > 0.6 ? col.teal : kb ? c : col.fx, kb ? 2 : 1, 1);
        if (p < 0.55) px(x - d, y, col.teal);
      }
      if (kb && p < 0.5 && rand() < 0.6) spark(sx + d * 6, sy, d * (0.5 + rand()), -rand(), 18, [col.fx, "#c9ced8", "#0a66c2"][Math.floor(rand() * 3)]);
      return;
    }
    if (kb) px(d > 0 ? sx : sx - 6, sy + 3, c, 6, 2);
    else for (let i = 0; i < 5; i++) px(sx + d * i, sy + 3 + (i >> 1), i ? c : "#c9a45a");
  }

  // --- wiring -----------------------------------------------------------------------

  layout();
  let raf = 0;
  const relayout = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(layout);
  };
  new ResizeObserver(relayout).observe(document.body);
  addEventListener("resize", relayout);
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  function setMode(next: Mode) {
    mode = next;
    if (modeBtn) {
      modeBtn.textContent = mode === "fight" ? "Fight" : "Wander";
      modeBtn.setAttribute("aria-pressed", String(mode === "fight"));
    }
    try {
      localStorage.setItem("journey", mode);
    } catch {
      /* storage blocked */
    }
    // Switching back to fight respawns every enemy still ahead of the hero.
    if (mode === "fight") for (const e of enemies) if (hero.t < e.t) Object.assign(e, { alive: true, hp: e.max, dying: 0, engaged: false });
  }
  setMode(mode);
  modeBtn?.addEventListener("click", () => setMode(mode === "fight" ? "wander" : "fight"));

  // The slider changes who walks the road, how crowded it is, and the color of the sky.
  function setHype(next: number) {
    if (next === hype) return;
    const swap = () => {
      hype = next;
      hero.look = LOOKS[next];
      enemies = [...enemies.filter((x) => x.tier !== "minion"), ...spawnMinions()];
      retintSky();
    };
    if (reduce) return swap();
    animate(hero, { jump: [0, -8, 0], duration: 560, ease: "outQuad" });
    for (let i = 0; i < 26; i++) spark(hero.x, hero.y - 8, (rand() - 0.5) * 1.8, -rand() * 1.5, 30, i % 2 ? col.fx : col.rockHi);
    setTimeout(swap, 180);
  }
  addEventListener("hype:change", (e) => setHype((e as CustomEvent<{ stop: number }>).detail.stop));

  // Scrolling feeds the hero's swings. At the bottom of the page the document
  // can't scroll any further, so wheel and touch input keep the boss fight going.
  let lastY = scrollY, travel = 0;
  const samples: { t: number; d: number }[] = [];
  function feed(dy: number) {
    if (dy <= 0) return;
    energy = Math.min(energy + dy, perSwing() * 6);
    const now = performance.now();
    // After a pause, seed the window one frame back so a single big jump still reads as fast.
    if (!samples.length) samples.push({ t: now - 16, d: travel });
    travel += dy;
    samples.push({ t: now, d: travel });
    while (samples.length && now - samples[0].t > 180) samples.shift();
    if (mode === "fight" && scrollSpeed(samples) > NINJA_SPEED) {
      ninjaUntil = time + 18;
    }
  }
  const atBottom = () => scrollY >= document.documentElement.scrollHeight - innerHeight - 2;
  addEventListener("scroll", () => {
    feed(scrollY - lastY);
    lastY = scrollY;
  }, { passive: true });
  addEventListener("wheel", (e) => {
    if (atBottom() && e.deltaY > 0) feed(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY);
  }, { passive: true });
  let touchY = 0;
  addEventListener("touchstart", (e) => (touchY = e.touches[0].clientY), { passive: true });
  addEventListener("touchmove", (e) => {
    const y = e.touches[0].clientY;
    if (atBottom()) feed(touchY - y);
    touchY = y;
  }, { passive: true });

  // Reposting from the hero's slider makes him celebrate.
  addEventListener("hype:repost", () => {
    if (reduce) return;
    animate(hero, { jump: [0, -10, 0, -5, 0], duration: 760, ease: "outQuad" });
    for (let i = 0; i < 30; i++) spark(hero.x, hero.y - 12, (rand() - 0.5) * 2, -rand() * 1.8, 34, ["#0a66c2", col.fx, col.accent][i % 3]);
  });

  const onScroll = () => requestAnimationFrame(reduce ? still : draw);
  const still = () => {
    snap();
    hero.speed = 0;
    draw();
  };
  addEventListener("scroll", onScroll, { passive: true });

  // Under reduced motion the scene is a still picture that redraws on scroll.
  const timer = reduce
    ? null
    : createTimer({
        frameRate: 30,
        onUpdate: () => {
          step();
          draw();
        },
      });
  if (reduce) still();
  document.addEventListener("visibilitychange", () => {
    if (!running || !timer) return;
    if (document.hidden) timer.pause();
    else timer.play();
  });

  return {
    hero,
    toScreen: () => screen(hero.x + hero.dragX, hero.y + hero.dragY),
    scale: () => S,
    pause: () => {
      running = false;
      timer?.pause();
    },
    play: () => {
      running = true;
      relayout();
      timer?.play();
    },
    setHype,
  };
}
