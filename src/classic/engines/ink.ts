/**
 * Pencil marks on live text, ported from Atelier's typography/hand-annotation
 * (motion lab): seeded wobble (same page, same marks, every visit), centripetal
 * Catmull–Rom strokes split into per-segment paths so pressure can taper the
 * width, drawn in with a hand's timing through WAAPI stroke-dashoffset.
 *
 * Everything is measured relative to an `origin` element, so a mark lives in an
 * SVG overlay positioned over that element.
 */

export type MarkType = 'underline' | 'circle' | 'box' | 'bracket' | 'highlight' | 'arrow';
type Pt = [number, number];
type Seg = [Pt, Pt, Pt, Pt];

export interface Line {
  x: number;
  y: number;
  w: number;
  h: number;
  base: number;
}
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Geometry {
  em: number;
  lines: Line[];
  box: Box;
  /** usable horizontal range, so a loop never runs off the screen */
  limit: [number, number];
  /** arrow: the note's first line, and where the marked text's column ends */
  to?: Line;
  clear?: number;
}
export interface Stroke {
  segs: Seg[];
  pressure?: (s: number) => number;
  marker?: boolean;
  width?: number;
}

const KNOBS = {
  roughness: 1,
  drawSpeed: 560, // px of pencil line per second
  markerSpeed: 950,
  minStroke: 200,
  maxStroke: 1250,
  liftGap: 110, // ms between strokes of one mark
};

const TAU = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (p: Pt, q: Pt, t: number): Pt => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
const dist = (p: Pt, q: Pt) => Math.hypot(q[0] - p[0], q[1] - p[1]);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const half = (v: number) => Math.round(v * 2) / 2;
const tenth = (v: number) => Math.round(v * 10) / 10;

/* ── seeded randomness: FNV-1a of the key into mulberry32 ─────────────────── */
function hash(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
interface Rng {
  next: () => number;
  range: (lo: number, hi: number) => number;
  jit: (amp: number) => number;
  sub: (k: string | number) => Rng;
  wave: () => (s: number) => number;
}
export function rng(key: string): Rng {
  let a = hash(`zb-ledger|${key}`);
  const next = () => {
    let t = (a = (a + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r: Rng = {
    next,
    range: (lo, hi) => lo + (hi - lo) * next(),
    jit: (amp) => (next() * 2 - 1) * amp * KNOBS.roughness,
    sub: (k) => rng(`${key}|${k}`),
    wave() {
      // a smooth wobble along a stroke: two slow sines at random phase
      const f1 = r.range(0.6, 1.4);
      const f2 = r.range(2.1, 3.6);
      const p1 = r.range(0, TAU);
      const p2 = r.range(0, TAU);
      const m = r.range(0.25, 0.45);
      return (s) => Math.sin(TAU * f1 * s + p1) * (1 - m) + Math.sin(TAU * f2 * s + p2) * m;
    },
  };
  return r;
}

/* ── geometry: stations bunched where a hand lands and lifts ──────────────── */
const stations = (n: number) => Array.from({ length: n + 1 }, (_, i) => 0.5 - 0.5 * Math.cos((Math.PI * i) / n));

// Bézier handle next to M, for centripetal Catmull–Rom (distances already ^½).
function handle(P: Pt, M: Pt, Q: Pt, dA: number, d: number): Pt {
  const a = dA * dA;
  const b = d * d;
  const k = 3 * dA * (dA + d);
  const w = 2 * a + 3 * dA * d + b;
  return [(a * Q[0] - b * P[0] + w * M[0]) / k, (a * Q[1] - b * P[1] + w * M[1]) / k];
}
// Centripetal Catmull–Rom (α = ½) through a polyline, as cubic Bézier segments.
function smooth(pts: Pt[]): Seg[] {
  const n = pts.length;
  const segs: Seg[] = [];
  const mirror = (p: Pt, about: Pt): Pt => [2 * about[0] - p[0], 2 * about[1] - p[1]];
  for (let i = 0; i < n - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : mirror(pts[1], pts[0]);
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i + 2 < n ? pts[i + 2] : mirror(pts[n - 2], pts[n - 1]);
    const d1 = Math.sqrt(dist(p0, p1));
    const d2 = Math.sqrt(dist(p1, p2));
    const d3 = Math.sqrt(dist(p2, p3));
    segs.push([p1, d1 < 1e-4 ? p1 : handle(p0, p1, p2, d1, d2), d3 < 1e-4 ? p2 : handle(p3, p2, p1, d3, d2), p2]);
  }
  return segs;
}
const pathD = (segs: Seg[]) =>
  segs
    .map(
      (s, i) =>
        (i ? '' : `M${tenth(s[0][0])} ${tenth(s[0][1])}`) +
        `C${tenth(s[1][0])} ${tenth(s[1][1])} ${tenth(s[2][0])} ${tenth(s[2][1])} ${tenth(s[3][0])} ${tenth(s[3][1])}`,
    )
    .join('');

// Width multiplier along a stroke: lands a touch light, presses in, thins as it lifts.
function pressure(r: Rng) {
  const w = r.wave();
  const lift = r.range(0.42, 0.6);
  return (s: number) => (0.74 + 0.26 * smoothstep(0, 0.14, s)) * (1 - lift * smoothstep(0.8, 1, s)) * (1 + 0.09 * w(s));
}

interface LineOpts {
  lead: Pt;
  over: Pt;
  rise: Pt;
  passes: number;
}
function lineStroke(ln: Line, r: Rng, y: number, o: LineOpts): Stroke {
  const x0 = ln.x - r.range(o.lead[0], o.lead[1]);
  const x1 = ln.x + ln.w + r.range(o.over[0], o.over[1]);
  const rise = r.range(o.rise[0], o.rise[1]) * KNOBS.roughness;
  const amp = 0.7 * KNOBS.roughness;
  const y0 = y + r.jit(0.8);
  const n = clamp(Math.round((x1 - x0) / 32), 4, 24);
  const at = (f: number, wave: (s: number) => number, dy: number): Pt => [lerp(x0, x1, f) + r.jit(0.5), y0 + rise * f + wave(f) * amp + dy];
  const out = r.wave();
  const pts = stations(n).map((f) => at(f, out, 0));
  if (o.passes > 1) {
    const back = r.wave();
    const stop = r.range(0.1, 0.32);
    const drop = r.range(2.6, 3.8);
    const ret = stations(Math.max(3, Math.round(n * (1 - stop)))).map((f) => at(1 - f * (1 - stop), back, drop + r.jit(0.4)));
    ret[0][0] += r.range(1.5, 3.5);
    pts.push(...ret);
  } else {
    pts[pts.length - 1][1] -= r.range(0.4, 1.6); // the flick as the pencil leaves the paper
  }
  return { segs: smooth(pts), pressure: pressure(r) };
}

export interface GenOptions {
  passes?: number;
  side?: 'left' | 'right';
  band?: number;
}

const GEN: Record<MarkType, (g: Geometry, r: Rng, o: Required<GenOptions>) => Stroke[]> = {
  underline: (g, r, o) =>
    g.lines.map((ln, i) =>
      lineStroke(ln, r.sub(i), ln.base + g.em * 0.16, {
        lead: [1, 5],
        over: i === g.lines.length - 1 ? [5, 11] : [1, 4],
        rise: [-2.4, 0.6],
        passes: o.passes,
      }),
    ),

  highlight: (g, r, o) =>
    g.lines.map((ln, i) => {
      const q = r.sub(i);
      const x0 = ln.x - q.range(2, 5);
      const x1 = ln.x + ln.w + q.range(1, 6);
      const yc = ln.base - g.em * 0.3 + q.jit(0.8);
      const rise = q.range(-1.2, 0.8) * KNOBS.roughness;
      const wave = q.wave();
      const pts = stations(clamp(Math.round((x1 - x0) / 60), 3, 10)).map((f): Pt => [lerp(x0, x1, f), yc + rise * f + wave(f) * 0.6 * KNOBS.roughness]);
      return { segs: smooth(pts), marker: true, width: g.em * o.band * q.range(0.93, 1.04) };
    }),

  circle(g, r) {
    // an open loop round the phrase, one stroke, that doesn't quite close
    const b = g.box;
    const K = KNOBS.roughness;
    const cx = b.x + b.w / 2 + r.jit(1.5);
    const cy = b.y + b.h / 2 + r.jit(1);
    const ry = b.h / 2 + r.range(5, 8);
    let rx = Math.max(b.w / 2 + r.range(7, 12), ry * 1.25);
    rx = Math.min(rx, cx - g.limit[0] - 3, g.limit[1] - cx - 3);
    const tilt = r.range(-0.05, 0.035) * K;
    const cs = Math.cos(tilt);
    const sn = Math.sin(tilt);
    const start = -Math.PI / 2 + r.range(0.25, 0.7);
    const sweep = TAU + r.range(0.3, 0.6);
    const spread = r.range(3.5, 6.5) * K;
    const round = r.range(2.5, 3.1);
    const wave = r.wave();
    const n = clamp(Math.round((rx + ry) / 6), 16, 44);
    const pts: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      const a = start - sweep * f;
      const grow = spread * (f - 0.5) + wave(f) * 0.9 * K;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const x = Math.sign(c) * Math.abs(c) ** (2 / round) * (rx + grow);
      const y = Math.sign(s) * Math.abs(s) ** (2 / round) * (ry + grow * 0.75);
      pts.push([cx + x * cs - y * sn, cy + x * sn + y * cs]);
    }
    return [{ segs: smooth(pts), pressure: pressure(r) }];
  },

  box(g, r) {
    // one stroke, clockwise, sharp corners; the last side overshoots the first corner
    const b = g.box;
    const px = r.range(5, 8);
    const py = r.range(3, 5);
    const corner = (x: number, y: number): Pt => [x + r.jit(1.4), y + r.jit(1.1)];
    const tl = corner(b.x - px, b.y - py);
    const tr = corner(b.x + b.w + px, b.y - py);
    const br = corner(b.x + b.w + px, b.y + b.h + py);
    const bl = corner(b.x - px, b.y + b.h + py);
    const side = (p: Pt, q: Pt) => {
      const bow = r.jit(1.4);
      const nx = p[1] - q[1];
      const ny = q[0] - p[0];
      const l = Math.hypot(nx, ny) || 1;
      return stations(clamp(Math.round(dist(p, q) / 36), 2, 8)).map((f): Pt => {
        const s = Math.sin(Math.PI * f) * bow;
        return [lerp(p[0], q[0], f) + (nx / l) * s, lerp(p[1], q[1], f) + (ny / l) * s];
      });
    };
    const start: Pt = [tl[0] + r.range(-3, 1), tl[1] + r.jit(1)];
    const end: Pt = [tl[0] + r.jit(1.2), tl[1] - r.range(3, 6)];
    return [{ segs: [side(start, tr), side(tr, br), side(br, bl), side(bl, end)].flatMap(smooth), pressure: pressure(r) }];
  },

  bracket(g, r, o) {
    // a tall square bracket in the margin, hooks turned toward the text
    const right = o.side !== 'left';
    const b = g.box;
    const room = right ? g.limit[1] - (b.x + b.w) : b.x - g.limit[0];
    const gap = clamp(r.range(12, 18), 3, Math.max(3, room - 8));
    const hook = clamp(r.range(7, 10), 3, Math.max(3, room - gap - 2));
    const x = right ? b.x + b.w + gap : b.x - gap;
    const dir = right ? -1 : 1;
    const top = b.y + 1 + r.jit(1.5);
    const bot = b.y + b.h - 1 + r.jit(1.5);
    const bow = r.jit(2.6);
    const wave = r.wave();
    const spine = stations(clamp(Math.round((bot - top) / 40), 3, 14)).map((f): Pt => [
      x - dir * Math.sin(Math.PI * f) * bow + wave(f) * KNOBS.roughness,
      lerp(top, bot, f),
    ]);
    const s0 = spine[0];
    const s1 = spine[spine.length - 1];
    const topHook: Pt[] = [[s0[0] + dir * hook, s0[1] + r.range(1, 3.5)], [s0[0] + dir * hook * 0.4, s0[1] + r.jit(0.9)], s0];
    const botHook: Pt[] = [s1, [s1[0] + dir * hook * 0.45, s1[1] + r.jit(0.9)], [s1[0] + dir * hook * r.range(0.9, 1.15), s1[1] - r.range(0.5, 3)]];
    return [{ segs: [topHook, spine, botHook].flatMap(smooth), pressure: pressure(r) }];
  },

  arrow(g, r) {
    // from the end of the marked thing out to its note, then the head as one V
    const from = g.lines[g.lines.length - 1];
    const to = g.to;
    if (!to) return [];
    const leftward = to.x + to.w < from.x;
    const s: Pt = leftward
      ? [from.x - r.range(6, 10), from.base - g.em * 0.32 + r.jit(1)]
      : [from.x + from.w + r.range(6, 10), from.base - g.em * 0.32 + r.jit(1)];
    const e: Pt = leftward ? [to.x + to.w + r.range(9, 13), to.y + to.h * 0.5 + r.jit(1.5)] : [to.x - r.range(9, 13), to.y + to.h * 0.5 + r.jit(1.5)];
    const span = Math.abs(e[0] - s[0]);
    if (span < 24 && Math.abs(e[1] - s[1]) < 24) return [];
    const sag = r.range(2.5, 5) * (e[1] < s[1] ? 1 : -1);
    const mid: Pt = [lerp(s[0], e[0], 0.45), lerp(s[1], e[1], 0.25) + sag + r.jit(1.2)];
    const turn: Pt = [lerp(s[0], e[0], 0.78), lerp(s[1], e[1], 0.72) + r.jit(1.2)];
    const shaft: Pt[] = [s, mid, turn, e];
    const ang = Math.atan2(e[1] - turn[1], e[0] - turn[0]);
    const barb = r.range(7, 10);
    const spread = r.range(0.42, 0.58);
    const b1: Pt = [e[0] - Math.cos(ang - spread) * barb, e[1] - Math.sin(ang - spread) * barb];
    const b2: Pt = [e[0] - Math.cos(ang + spread) * barb * r.range(0.85, 1.1), e[1] - Math.sin(ang + spread) * barb];
    return [
      { segs: smooth(shaft), pressure: pressure(r) },
      { segs: [...smooth([b1, mix(b1, e, 0.5), e]), ...smooth([e, mix(e, b2, 0.5), b2])], pressure: pressure(r.sub('head')) },
    ];
  },
};

export function generate(type: MarkType, g: Geometry, key: string, o: GenOptions = {}): Stroke[] {
  return GEN[type](g, rng(`${type}:${key}`), { passes: o.passes ?? 1, side: o.side ?? 'right', band: o.band ?? 1.04 });
}

/* ── measuring live text ──────────────────────────────────────────────────── */

/** One box per line of text under `el`, relative to `origin` (with each line's baseline). */
export function linesOf(el: Element, origin: { x: number; y: number }): Line[] {
  const range = document.createRange();
  const rects: Box[] = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (n.parentElement?.closest('.visually-hidden, [data-ink-skip]')) continue;
    range.selectNodeContents(n);
    for (const c of range.getClientRects()) {
      if (c.width > 0.5 && c.height > 0.5) rects.push({ x: c.left - origin.x, y: c.top - origin.y, w: c.width, h: c.height });
    }
  }
  rects.sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: Box[] = [];
  for (const c of rects) {
    const ln = lines.find((l) => Math.min(l.y + l.h, c.y + c.h) - Math.max(l.y, c.y) > Math.min(l.h, c.h) / 2);
    if (!ln) {
      lines.push({ ...c });
      continue;
    }
    const x1 = Math.max(ln.x + ln.w, c.x + c.w);
    const y1 = Math.max(ln.y + ln.h, c.y + c.h);
    ln.x = Math.min(ln.x, c.x);
    ln.y = Math.min(ln.y, c.y);
    ln.w = x1 - ln.x;
    ln.h = y1 - ln.y;
  }
  // baseline: a content-area rect's top plus the font's ascent share; ~0.8 of the
  // line box is close enough for grotesks and the pencil hides the rest
  return lines.map((l) => ({ x: half(l.x), y: half(l.y), w: half(l.w), h: half(l.h), base: half(l.y + l.h * 0.8) }));
}

export const boxOf = (lines: Line[]): Box => {
  const x = Math.min(...lines.map((l) => l.x));
  const y = Math.min(...lines.map((l) => l.y));
  return { x, y, w: Math.max(...lines.map((l) => l.x + l.w)) - x, h: Math.max(...lines.map((l) => l.y + l.h)) - y };
};

/* ── building, drawing ────────────────────────────────────────────────────── */

const SVGNS = 'http://www.w3.org/2000/svg';

interface Chunk {
  el: SVGPathElement;
  len: number;
  w: number;
  a: number;
  b: number;
}
interface BuiltStroke extends Stroke {
  chunks: Chunk[];
  ms: number;
}
export interface InkMark {
  strokes: BuiltStroke[];
  anims: Animation[];
}

/** Write each stroke into `g` as paths (one per Bézier segment, so pressure can vary). */
export function build(g: SVGGElement, strokes: Stroke[], penWidth: number): InkMark {
  g.replaceChildren();
  const built: BuiltStroke[] = strokes.map((st) => ({
    ...st,
    ms: 0,
    chunks: (st.marker ? [st.segs] : st.segs.map((seg) => [seg])).map((segs) => {
      const el = document.createElementNS(SVGNS, 'path');
      el.setAttribute('d', pathD(segs));
      g.append(el);
      return { el, len: 0, w: st.width ?? 0, a: 0, b: 1 };
    }),
  }));
  // read every length, then write every width (no interleaved layout)
  for (const st of built) for (const c of st.chunks) c.len = c.el.getTotalLength();
  for (const st of built) {
    const total = st.chunks.reduce((t, c) => t + c.len, 0) || 1;
    let acc = 0;
    for (const c of st.chunks) {
      c.a = acc / total;
      acc += c.len;
      c.b = acc / total;
      if (!st.marker && st.pressure) c.w = penWidth * st.pressure((c.a + c.b) / 2);
      c.el.setAttribute('stroke-width', c.w.toFixed(2));
    }
    st.ms = clamp((total / (st.marker ? KNOBS.markerSpeed : KNOBS.drawSpeed)) * 1000, KNOBS.minStroke, KNOBS.maxStroke);
  }
  return { strokes: built, anims: [] };
}

const hiddenAt = (c: Chunk) => c.len + c.w + 1;
function paint(m: InkMark, drawn: boolean) {
  for (const st of m.strokes) {
    for (const c of st.chunks) {
      c.el.style.strokeDasharray = `${c.len}px ${c.len + 2 * c.w + 2}px`;
      c.el.style.strokeDashoffset = drawn ? '0px' : `${hiddenAt(c)}px`;
    }
  }
}
export function cancel(m: InkMark) {
  m.anims.forEach((a) => a.cancel());
  m.anims = [];
}
export function showNow(m: InkMark) {
  cancel(m);
  paint(m, true);
}
/** Park every stroke just before its start: nothing shows until play(). */
export function hide(m: InkMark) {
  cancel(m);
  paint(m, false);
}

// Pencil timing: the arc-length reached at time t eases in and slows to lift off,
// inverted once into a lookup so each segment knows when the pencil arrives.
const timeAt = (() => {
  const B = (u: number, p: number, q: number) => 3 * (1 - u) * (1 - u) * u * p + 3 * (1 - u) * u * u * q + u * u * u;
  const T: number[] = [];
  const S: number[] = [];
  for (let i = 0; i <= 200; i++) {
    const u = i / 200;
    T.push(B(u, 0.42, 0.2));
    S.push(B(u, 0, 1));
  }
  return (s: number) => {
    let i = 1;
    while (i < 200 && S[i] < s) i++;
    return lerp(T[i - 1], T[i], clamp((s - S[i - 1]) / (S[i] - S[i - 1] || 1), 0, 1));
  };
})();

/** Draw the mark in with WAAPI after `delay` ms; returns how long the pencil is busy. */
export function play(m: InkMark, delay = 0): number {
  cancel(m);
  paint(m, true); // rest drawn: a cancelled draw finishes instead of vanishing
  let t = delay;
  for (const st of m.strokes) {
    for (const c of st.chunks) {
      const single = st.chunks.length === 1;
      const t0 = single ? 0 : st.ms * timeAt(c.a);
      const t1 = single ? st.ms : st.ms * timeAt(c.b);
      m.anims.push(
        c.el.animate([{ strokeDashoffset: `${hiddenAt(c)}px` }, { strokeDashoffset: '0px' }], {
          delay: t + t0,
          duration: Math.max(1, t1 - t0),
          easing: single ? 'cubic-bezier(.42,0,.2,1)' : 'linear',
          fill: 'backwards',
        }),
      );
    }
    t += st.ms + KNOBS.liftGap;
  }
  return t - delay;
}

/* ── the paper's tooth: one shared mask, so pencil reads as pencil ────────── */

let toothUrl = '';
export function toothTile() {
  if (toothUrl) return toothUrl;
  const S = 128;
  const C = 16;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const img = ctx.createImageData(S, S);
  const r = rng('tooth');
  const lattice = Array.from({ length: C * C }, r.next);
  const at = (i: number, j: number) => lattice[(j % C) * C + (i % C)];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const gx = (x / S) * C;
      const gy = (y / S) * C;
      const i = Math.floor(gx);
      const j = Math.floor(gy);
      const fx = smoothstep(0, 1, gx - i);
      const fy = smoothstep(0, 1, gy - j);
      const fibre = lerp(lerp(at(i, j), at(i + 1, j), fx), lerp(at(i, j + 1), at(i + 1, j + 1), fx), fy);
      const n = fibre * 0.6 + r.next() * 0.4;
      const v = Math.round(255 * (1 - 0.45 * smoothstep(0.35, 1, n))); // white keeps, grey lets paper through
      const k = (y * S + x) * 4;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = v;
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  toothUrl = canvas.toDataURL();
  return toothUrl;
}
