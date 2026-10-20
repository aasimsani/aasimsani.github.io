// Pure geometry for the pixel companion. The renderer and the tests share it.
export type Pt = { x: number; y: number };

/**
 * Build a switchback road that zigzags from the top of the world to the bottom.
 * With a random source, each leg gets its own drop and turns short of the wall,
 * so the road reads as terrain instead of a repeating pattern.
 */
export function buildRoad(width: number, height: number, turns: number, margin: number, rand?: () => number): Pt[] {
  const weights = Array.from({ length: turns }, () => (rand ? 0.45 + rand() * 1.3 : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  const inset = (width - 2 * margin) * 0.4;
  const road: Pt[] = [{ x: margin, y: 0 }];
  let acc = 0;
  for (let i = 1; i <= turns; i++) {
    acc += weights[i - 1];
    const pull = rand ? Math.round(rand() * inset) : 0;
    road.push({ x: i % 2 ? width - margin - pull : margin + pull, y: Math.round((acc / total) * height) });
  }
  return road;
}

/** Return the point at fraction t of the road's arc length, plus the facing direction. */
export function pointAt(road: Pt[], t: number): Pt & { dir: 1 | -1 } {
  const lens = road.slice(1).map((p, i) => Math.hypot(p.x - road[i].x, p.y - road[i].y));
  const total = lens.reduce((a, b) => a + b, 0);
  let left = Math.min(Math.max(t, 0), 1) * total;
  for (let i = 0; i < lens.length; i++) {
    const a = road[i];
    const b = road[i + 1];
    const dir = b.x < a.x ? -1 : 1;
    if (left <= lens[i] || i === lens.length - 1) {
      const k = lens[i] ? Math.min(left / lens[i], 1) : 0;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, dir };
    }
    left -= lens[i];
  }
  return { ...road[0], dir: 1 };
}

/** Snap a 0..100 slider value to the nearest of n stops. */
export function stopForValue(value: number, n: number): number {
  const v = Math.min(Math.max(value, 0), 100);
  return Math.round((v / 100) * (n - 1));
}

export type JourneyParams = {
  top: number;
  bottom: number;
  /** World heights of the breaks between sections, sorted ascending. */
  boundaries: number[];
  left: [number, number];
  right: [number, number];
  /** Average drop per switchback inside a lane. */
  leg: number;
  /** Drop while crossing the content column at a break. */
  cross: number;
  /** Fraction of a lane's width the road swings across. 1 runs wall to wall, smaller is straighter. */
  sway?: number;
  rand?: () => number;
};

/**
 * Build the full-page road. It switchbacks down the right gutter, crosses the
 * content column in the gap at each section break, switchbacks down the other
 * gutter, and so on. The crossing midpoints come back separately because
 * lanterns and encounters sit there.
 */
export function buildJourney(p: JourneyParams): { road: Pt[]; crossings: Pt[] } {
  const rand = p.rand ?? (() => 0.5);
  const sway = p.sway ?? 1;
  // The road swings inside a band that hugs the lane's inner edge, so crossings join it without a long sideways leg.
  const inner = (l: [number, number]) => (l === p.right ? l[0] : l[1]);
  const band = (l: [number, number]): [number, number] => {
    const span = (l[1] - l[0]) * sway;
    return l === p.right ? [l[0], l[0] + span] : [l[1] - span, l[1]];
  };
  let lane = p.right;
  let y = p.top;
  let x = sway < 1 ? inner(lane) : lane[1];
  const road: Pt[] = [{ x, y }];
  const crossings: Pt[] = [];
  const stops = [...p.boundaries, p.bottom];

  stops.forEach((b, i) => {
    const last = i === stops.length - 1;
    const end = last ? p.bottom : Math.max(y, b - p.cross / 2);
    const legs = Math.max(1, Math.round((end - y) / p.leg));
    const [lo, hi] = band(lane);
    const width = hi - lo;
    for (let k = 1; k <= legs; k++) {
      const pull = Math.round(rand() * width * 0.35);
      x = x - lo < width / 2 ? hi - pull : lo + pull;
      road.push({ x, y: Math.round(y + ((end - y) * k) / legs) });
    }
    y = end;
    if (last) return;

    // Walk to the inner edge, then cross to the other gutter's inner edge.
    const other = lane === p.right ? p.left : p.right;
    const fromEdge = lane === p.right ? lane[0] : lane[1];
    const toEdge = other === p.right ? other[0] : other[1];
    if (x !== fromEdge) road.push({ x: fromEdge, y });
    const ny = y + p.cross;
    road.push({ x: toEdge, y: ny });
    crossings.push({ x: Math.round((fromEdge + toEdge) / 2), y: Math.round((y + ny) / 2) });
    lane = other;
    x = toEdge;
    y = ny;
  });
  road[road.length - 1].y = p.bottom;
  return { road, crossings };
}

/** Return the arc-length fraction where the road first reaches height y. */
export function tAtY(road: Pt[], y: number): number {
  const lens = road.slice(1).map((p, i) => Math.hypot(p.x - road[i].x, p.y - road[i].y));
  const total = lens.reduce((a, b) => a + b, 0);
  if (y <= road[0].y) return 0;
  let acc = 0;
  for (let i = 0; i < lens.length; i++) {
    const a = road[i], b = road[i + 1];
    if (y <= b.y) {
      const k = b.y === a.y ? 0 : (y - a.y) / (b.y - a.y);
      return (acc + lens[i] * k) / total;
    }
    acc += lens[i];
  }
  return 1;
}

/**
 * Place `perZone` minions evenly inside each [start, end] zone of the road,
 * keeping `margin` clear at both ends for the crossings and their mini-bosses.
 */
export function spawnPlan(zones: [number, number][], perZone: number, margin: number): { t: number; zone: number }[] {
  const plan: { t: number; zone: number }[] = [];
  zones.forEach(([a, b], zone) => {
    const lo = a + margin, hi = b - margin;
    if (perZone <= 0 || hi <= lo) return;
    for (let i = 1; i <= perZone; i++) plan.push({ t: lo + ((hi - lo) * i) / (perZone + 1), zone });
  });
  return plan;
}

/** Pixels per second between the first and last scroll sample in a window. */
export function scrollSpeed(samples: { t: number; d: number }[]): number {
  if (samples.length < 2) return 0;
  const a = samples[0], b = samples[samples.length - 1];
  const dt = b.t - a.t;
  return dt > 0 ? ((b.d - a.d) / dt) * 1000 : 0;
}

/**
 * Round every interior corner of a polyline with a quadratic curve that starts
 * `radius` before the corner and ends `radius` after it. Short legs shrink the
 * radius so neighbouring curves never overlap.
 */
export function roundCorners(road: Pt[], radius: number, steps: number): Pt[] {
  if (road.length < 3) return road.slice();
  const out: Pt[] = [road[0]];
  for (let i = 1; i < road.length - 1; i++) {
    const a = road[i - 1], v = road[i], b = road[i + 1];
    const la = Math.hypot(v.x - a.x, v.y - a.y), lb = Math.hypot(b.x - v.x, b.y - v.y);
    const r = Math.min(radius, la / 2, lb / 2);
    if (r < 0.5) {
      out.push(v);
      continue;
    }
    const p0 = { x: v.x + ((a.x - v.x) * r) / la, y: v.y + ((a.y - v.y) * r) / la };
    const p2 = { x: v.x + ((b.x - v.x) * r) / lb, y: v.y + ((b.y - v.y) * r) / lb };
    for (let k = 0; k <= steps; k++) {
      const t = k / steps, u = 1 - t;
      out.push({ x: u * u * p0.x + 2 * u * t * v.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * v.y + t * t * p2.y });
    }
  }
  out.push(road[road.length - 1]);
  return out;
}
