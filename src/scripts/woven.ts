// The original hero's woven particle field: a point cloud shaped like a torus
// knot that drifts and parts around the cursor. It draws on a plain 2D canvas,
// so Serious mode needs no 3D library. The field animates only while someone
// moves the pointer or the field is changing shape, then settles and stops, and
// it pauses whenever the hero scrolls off screen.
//
// The same dots also gather into Aasim's portrait. Each dot keeps its home on
// the knot and gains a second home on the face, and the spring pulls it toward
// a blend of the two, so the face moves with the same physics as the knot.
import { sampleFace } from "./portrait";

const PARTICLES = 6000;
const IDLE_MS = 5000;
const FOV = (75 * Math.PI) / 180;
const CAMERA_Z = 5;

// The face keeps 150 rows of dots whatever the screen size, so it stays recognisable on a phone.
const FACE_ROWS = 150;
const FACE_SRC = "/images/portrait-cutout.webp";
// The crop runs from the top of the head to mid-chest, so the face fills most of the dot field.
const FACE_CROP = [70, 15, 660, 740];
// Tone ramps run from shadow to highlight, one for the night theme and one for dawn.
const RAMP_NIGHT = ["#262b55", "#43386e", "#6e4468", "#a2524f", "#d8683e", "#ff9a3c", "#ffbe73", "#f3d7ad", "#f4ece0"];
const RAMP_DAWN = ["#1d1a2b", "#33283f", "#4f2c2e", "#7f2f0f", "#a13d14", "#c2602e", "#d68b5c", "#e2b48c", "#ead2b8"];
// Desktop holds the face, lets it go and gathers it again. Narrow screens gather once and hold.
const GATHER_MS = 1800, HOLD_MS = 7000, KNOT_MS = 6000, FIRST_GATHER_MS = 1200;

// A (2, 3) torus knot with a round tube, sampled the way three.js samples
// TorusKnotGeometry(1.5, 0.5, 220, 32), so the shape matches the old hero.
function knotPoints(radius = 1.5, tube = 0.5, tubular = 220, radial = 32, p = 2, q = 3) {
  const curve = (u: number) => {
    const quOverP = (q / p) * u;
    const cs = Math.cos(quOverP);
    return [radius * (2 + cs) * 0.5 * Math.cos(u), radius * (2 + cs) * 0.5 * Math.sin(u), radius * Math.sin(quOverP) * 0.5];
  };
  const out: number[] = [];
  for (let i = 0; i <= tubular; i++) {
    const u = (i / tubular) * p * Math.PI * 2;
    const p1 = curve(u);
    const p2 = curve(u + 0.01);
    const t = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
    let n = [p2[0] + p1[0], p2[1] + p1[1], p2[2] + p1[2]];
    let b = [t[1] * n[2] - t[2] * n[1], t[2] * n[0] - t[0] * n[2], t[0] * n[1] - t[1] * n[0]];
    n = [b[1] * t[2] - b[2] * t[1], b[2] * t[0] - b[0] * t[2], b[0] * t[1] - b[1] * t[0]];
    const bl = Math.hypot(b[0], b[1], b[2]);
    const nl = Math.hypot(n[0], n[1], n[2]);
    b = b.map((v) => v / bl);
    n = n.map((v) => v / nl);
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      const cx = -tube * Math.cos(v);
      const cy = tube * Math.sin(v);
      out.push(p1[0] + cx * n[0] + cy * b[0], p1[1] + cx * n[1] + cy * b[1], p1[2] + cx * n[2] + cy * b[2]);
    }
  }
  return out;
}

async function loadFace() {
  const img = new Image();
  img.src = FACE_SRC;
  await img.decode();
  const [sx, sy, sw, sh] = FACE_CROP;
  const off = document.createElement("canvas");
  off.width = sw;
  off.height = sh;
  const c = off.getContext("2d", { willReadFrequently: true })!;
  c.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return sampleFace(c.getImageData(0, 0, sw, sh).data, sw, sh, { rows: FACE_ROWS, tones: RAMP_NIGHT.length, fade: 0.2 });
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function mountWoven(mount: HTMLElement) {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrow = matchMedia("(max-width: 1099px)");
  const canvas = document.createElement("canvas");
  mount.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;

  const knot = knotPoints();
  const knotCount = knot.length / 3;
  // The knot always uses the same 6000 points. When the face needs more dots, the extras start stacked on those points.
  let count = PARTICLES;
  let pos = new Float32Array(count * 3);
  let home = new Float32Array(count * 3);
  let vel = new Float32Array(count * 3);
  const seat = (from: number) => {
    for (let i = from; i < count; i++) {
      const k = ((i % PARTICLES) % knotCount) * 3;
      for (let a = 0; a < 3; a++) pos[i * 3 + a] = home[i * 3 + a] = knot[k + a];
    }
  };
  seat(0);

  // Each dot's face home is in screen-facing world units, and `faceMix` holds how far along the gather it is.
  let face: Float32Array | null = null;
  let tone = new Uint8Array(0);
  let delay = new Float32Array(0);
  let faceMix = new Float32Array(0);
  let faceStep = 0;

  // Each particle takes one of three theme colors, read live from the CSS tokens.
  let palette: string[] = [];
  let ramp = RAMP_NIGHT;
  const readPalette = () => {
    const cs = getComputedStyle(document.documentElement);
    palette = ["--color-accent", "--color-teal", "--color-muted"].map((n) => cs.getPropertyValue(n).trim() || "#c46a4d");
    ramp = document.documentElement.getAttribute("data-theme") === "light" ? RAMP_DAWN : RAMP_NIGHT;
  };
  readPalette();
  new MutationObserver(() => {
    readPalette();
    draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // The layout sets where the field sits through CSS: --field-x is the knot's centre as a share of the width,
  // and --face-h is the face's height as a share of the field's height.
  let w = 0, h = 0, dpr = 1, focal = 1, fieldX = 0.5, faceH = 0.7;
  const resize = () => {
    dpr = Math.min(devicePixelRatio, 2);
    w = mount.clientWidth;
    h = Math.max(mount.clientHeight, 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    focal = h / 2 / Math.tan(FOV / 2);
    const cs = getComputedStyle(mount);
    fieldX = parseFloat(cs.getPropertyValue("--field-x")) || 0.5;
    faceH = parseFloat(cs.getPropertyValue("--face-h")) || 0.7;
    faceStep = (faceH * h) / FACE_ROWS;
  };

  // The pointer maps onto the plane the face sits in, so the dots part right under the cursor.
  const mouse = { x: 99, y: 99 };
  let angle = 0;
  // `mix` runs from 0 (knot) to 1 (face), and `mixTarget` is where it's heading.
  let mix = 0, mixTarget = 0;

  function step(dt: number) {
    if (mix !== mixTarget) {
      const d = dt / GATHER_MS;
      mix = mixTarget > mix ? Math.min(mixTarget, mix + d) : Math.max(mixTarget, mix - d);
    }
    // The knot stops turning while the face is up, so the face keeps looking at the reader.
    angle += (0.05 / 60) * (1 - mix);
    const cos = Math.cos(-angle), sin = Math.sin(-angle);
    // The face is `faceH` of the field tall once projected at the camera's distance.
    const unit = faceH * 2 * Math.tan(FOV / 2) * CAMERA_Z;
    const mx = mouse.x, my = mouse.y;
    // The knot keeps its 1.5-unit push. The face shrinks it to 0.6, so the cursor parts the face without erasing it.
    const reach = 1.5 - 0.9 * mix;
    for (let p = 0, i = 0; p < count; p++, i += 3) {
      let hx = home[i], hy = home[i + 1], hz = home[i + 2];
      if (face && mix > 0) {
        const e = ease(Math.min(1, Math.max(0, mix * 1.25 - delay[p])));
        faceMix[p] = e;
        if (e > 0) {
          // The face home is rotated back by the knot's angle, so after the draw rotation it faces the camera.
          const fx = face[p * 2] * unit, fy = face[p * 2 + 1] * unit;
          hx += (fx * cos - hx) * e;
          hy += (fy - hy) * e;
          hz += (-fx * sin - hz) * e;
        }
      } else if (faceMix.length) faceMix[p] = 0;
      const dx = pos[i] - mx, dy = pos[i + 1] - my, dz = pos[i + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < reach && dist > 0.0001) {
        const f = ((reach - dist) * 0.01) / dist;
        vel[i] += dx * f;
        vel[i + 1] += dy * f;
        vel[i + 2] += dz * f;
      }
      vel[i] = (vel[i] + (hx - pos[i]) * 0.001) * 0.95;
      vel[i + 1] = (vel[i + 1] + (hy - pos[i + 1]) * 0.001) * 0.95;
      vel[i + 2] = (vel[i + 2] + (hz - pos[i + 2]) * 0.001) * 0.95;
      pos[i] += vel[i];
      pos[i + 1] += vel[i + 1];
      pos[i + 2] += vel[i + 2];
    }
  }

  // Particles batch by color, so a frame costs a dozen fills instead of thousands.
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 0.85;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const size = 0.025 * focal;
    const cx = w * fieldX;
    const faceSize = faceStep * 0.75;
    const paths = [...palette, ...ramp].map(() => new Path2D());
    for (let p = 0; p < count; p++) {
      const x = pos[p * 3], y = pos[p * 3 + 1], z = pos[p * 3 + 2];
      const rx = x * cos + z * sin;
      const rz = -x * sin + z * cos;
      const depth = CAMERA_Z - rz;
      const e = faceMix.length ? faceMix[p] : 0;
      let s = Math.max(1, size / depth);
      if (e > 0) s += (Math.max(s, faceSize) - s) * e;
      const bucket = e > 0.5 ? palette.length + tone[p] : p % palette.length;
      paths[bucket].rect(cx + (rx * focal) / depth - s / 2, h / 2 - (y * focal) / depth - s / 2, s, s);
    }
    paths.forEach((path, i) => {
      ctx.fillStyle = i < palette.length ? palette[i] : ramp[i - palette.length];
      ctx.fill(path);
    });
  }

  let running = false;
  let visible = true;
  let wanted = false;
  let lastInput = performance.now();
  let lastFrame = 0;
  let raf = 0;

  const loop = (now: number) => {
    raf = 0;
    if (!running) return;
    step(Math.min(50, now - (lastFrame || now)));
    lastFrame = now;
    draw();
    // A gather or release counts as input, so the field keeps moving until the dots settle.
    if (mix !== mixTarget) lastInput = now;
    if (now - lastInput > IDLE_MS) running = false;
    else raf = requestAnimationFrame(loop);
  };

  const wake = () => {
    if (!wanted || !visible || reduceMotion) return;
    lastInput = performance.now();
    running = true;
    lastFrame = 0;
    if (!raf) raf = requestAnimationFrame(loop);
  };

  // Desktop cycles between face and knot while the hero is on screen. Narrow screens gather once and hold.
  let timer = 0;
  const schedule = (target: number, after: number) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (!wanted || !visible) return;
      mixTarget = target;
      wake();
      if (narrow.matches && target === 1) return;
      schedule(target ? 0 : 1, (target ? HOLD_MS : KNOT_MS) + GATHER_MS);
    }, after);
  };

  loadFace().then((cells) => {
    // A shuffled assignment sends dots from all over the knot to every part of the face, which reads as weaving.
    const total = Math.max(PARTICLES, cells.length);
    if (total > count) {
      const grow = (a: Float32Array) => {
        const b = new Float32Array(total * 3);
        b.set(a);
        return b;
      };
      pos = grow(pos);
      home = grow(home);
      vel = grow(vel);
      const from = count;
      count = total;
      seat(from);
    }
    let s = 7;
    const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const order = cells.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    face = new Float32Array(count * 2);
    tone = new Uint8Array(count);
    delay = new Float32Array(count);
    faceMix = new Float32Array(count);
    for (let p = 0; p < count; p++) {
      const c = cells[order[p % cells.length]];
      face[p * 2] = c.x;
      face[p * 2 + 1] = -c.y;
      tone[p] = c.tone;
      delay[p] = r() * 0.25;
    }
    if (reduceMotion) {
      // Without motion the face appears in place of the knot, with no gather.
      mix = mixTarget = 1;
      settleStill();
      draw();
      return;
    }
    schedule(1, FIRST_GATHER_MS);
  }).catch(() => {
    // If the portrait fails to load, the field stays a knot.
  });

  // Reduced motion skips the springs and places every dot on its face home directly.
  function settleStill() {
    const unit = faceH * 2 * Math.tan(FOV / 2) * CAMERA_Z;
    for (let p = 0; p < count; p++) {
      pos[p * 3] = face![p * 2] * unit;
      pos[p * 3 + 1] = face![p * 2 + 1] * unit;
      pos[p * 3 + 2] = 0;
      faceMix[p] = 1;
    }
  }

  addEventListener("pointermove", (e) => {
    const r = mount.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left - w * fieldX) * CAMERA_Z) / focal;
    mouse.y = (-(e.clientY - r.top - h / 2) * CAMERA_Z) / focal;
    wake();
  });
  addEventListener("resize", () => {
    resize();
    if (reduceMotion && face) settleStill();
    draw();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      wake();
      if (face && !reduceMotion && !(narrow.matches && mixTarget === 1)) schedule(1, FIRST_GATHER_MS);
    } else {
      running = false;
      clearTimeout(timer);
    }
  }).observe(mount);

  resize();
  draw();

  return {
    play() {
      wanted = true;
      resize();
      draw();
      wake();
      if (face && !reduceMotion) schedule(1, FIRST_GATHER_MS);
    },
    pause() {
      wanted = false;
      running = false;
      clearTimeout(timer);
    },
  };
}
