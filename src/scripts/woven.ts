// The original hero's woven particle field: a point cloud shaped like a torus
// knot that drifts and parts around the cursor. It draws on a plain 2D canvas,
// so Serious mode needs no 3D library. The field animates only while someone
// moves the pointer, then settles and stops, and it pauses whenever the hero
// scrolls off screen.

const PARTICLES = 6000;
const IDLE_MS = 5000;
const FOV = (75 * Math.PI) / 180;
const CAMERA_Z = 5;

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

export function mountWoven(mount: HTMLElement) {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.createElement("canvas");
  mount.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;

  const knot = knotPoints();
  const knotCount = knot.length / 3;
  const pos = new Float32Array(PARTICLES * 3);
  const home = new Float32Array(PARTICLES * 3);
  const vel = new Float32Array(PARTICLES * 3);
  for (let i = 0; i < PARTICLES; i++) {
    const k = (i % knotCount) * 3;
    for (let a = 0; a < 3; a++) pos[i * 3 + a] = home[i * 3 + a] = knot[k + a];
  }

  // Each particle takes one of three theme colors, read live from the CSS tokens.
  let palette: string[] = [];
  const readPalette = () => {
    const cs = getComputedStyle(document.documentElement);
    palette = ["--color-accent", "--color-teal", "--color-muted"].map((n) => cs.getPropertyValue(n).trim() || "#c46a4d");
  };
  readPalette();
  new MutationObserver(() => {
    readPalette();
    draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  let w = 0, h = 0, dpr = 1, focal = 1;
  const resize = () => {
    dpr = Math.min(devicePixelRatio, 2);
    w = mount.clientWidth;
    h = Math.max(mount.clientHeight, 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    focal = h / 2 / Math.tan(FOV / 2);
  };

  const mouse = { x: 0, y: 0 };
  let angle = 0;

  function step() {
    const mx = mouse.x * 3, my = mouse.y * 3;
    for (let i = 0; i < PARTICLES * 3; i += 3) {
      const dx = pos[i] - mx, dy = pos[i + 1] - my, dz = pos[i + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 1.5 && dist > 0.0001) {
        const f = ((1.5 - dist) * 0.01) / dist;
        vel[i] += dx * f;
        vel[i + 1] += dy * f;
        vel[i + 2] += dz * f;
      }
      for (let a = 0; a < 3; a++) {
        vel[i + a] = (vel[i + a] + (home[i + a] - pos[i + a]) * 0.001) * 0.95;
        pos[i + a] += vel[i + a];
      }
    }
  }

  // Particles batch by color, so a frame costs three fills instead of six thousand.
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 0.85;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const size = 0.025 * focal;
    for (let c = 0; c < palette.length; c++) {
      ctx.beginPath();
      for (let i = c; i < PARTICLES; i += palette.length) {
        const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
        const rx = x * cos + z * sin;
        const rz = -x * sin + z * cos;
        const depth = CAMERA_Z - rz;
        const s = Math.max(1, size / depth);
        ctx.rect(w / 2 + (rx * focal) / depth - s / 2, h / 2 - (y * focal) / depth - s / 2, s, s);
      }
      ctx.fillStyle = palette[c];
      ctx.fill();
    }
  }

  let running = false;
  let visible = true;
  let wanted = false;
  let lastInput = performance.now();
  let raf = 0;

  const loop = () => {
    raf = 0;
    if (!running) return;
    angle += 0.05 / 60;
    step();
    draw();
    if (performance.now() - lastInput > IDLE_MS) running = false;
    else raf = requestAnimationFrame(loop);
  };

  const wake = () => {
    if (!wanted || !visible || reduceMotion) return;
    lastInput = performance.now();
    running = true;
    if (!raf) raf = requestAnimationFrame(loop);
  };

  addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / innerHeight) * 2 + 1;
    wake();
  });
  addEventListener("resize", () => {
    resize();
    draw();
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
    else running = false;
  }).observe(mount);

  resize();
  draw();

  return {
    play() {
      wanted = true;
      resize();
      draw();
      wake();
    },
    pause() {
      wanted = false;
      running = false;
    },
  };
}
