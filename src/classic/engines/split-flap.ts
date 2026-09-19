/**
 * Split-flap drums, ported from Atelier's typography/split-flap (motion lab).
 *
 * Mechanically honest: each module is a drum of printed flaps that turns ONE
 * way through an ordered set of faces, one flap per step. A flap's face carries
 * the top half of the current character and its back the bottom half of the
 * next, so one rotateX from 0° to −180° is the whole flip. One rAF scheduler
 * drives every module on the page and sleeps when nothing turns.
 */

export interface Drum {
  faces: string[];
  size: number;
}
export const drum = (faces: string[]): Drum => ({ faces, size: faces.length });
export const DIGITS = drum(Array.from(' 0123456789'));

const KNOBS = {
  flapMs: 72, // one flap's fall
  jitter: 0.14, // ± per-module motor speed, so modules never flap in unison
  maxSteps: 12, // long jumps skip ahead inside the first flap, then step in order
  bounceDeg: 7, // the last flap slaps down and rebounds once
  bounceMs: 90,
};
const V0 = 0.28; // release speed; the rest of the fall is gravity (p²)
const SHADE_FRONT = 0.85;
const SHADE_BACK = 0.7;

const IDLE = 0;
const WAIT = 1;
const FLIP = 2;
const SETTLE = 3;

interface Slot {
  half: HTMLElement;
  glyph: HTMLElement;
  i: number;
}
export interface FlapModule {
  el: HTMLElement;
  drum: Drum;
  cur: number;
  target: number;
  nxt: number;
  state: number;
  t0: number;
  startAt: number;
  dur: number;
  top: Slot;
  bot: Slot;
  front: Slot;
  back: Slot;
  frontShade: HTMLElement;
  backShade: HTMLElement;
  leaf: HTMLElement;
}

const TEMPLATE =
  '<span class="half top"><span class="glyph"></span></span>' +
  '<span class="half bot"><span class="glyph"></span></span>' +
  '<span class="leaf"><span class="half top front"><span class="glyph"></span><span class="shade"></span></span>' +
  '<span class="half bot back"><span class="glyph"></span><span class="shade"></span></span></span>';

function setFace(m: FlapModule, slot: Slot, i: number) {
  if (slot.i === i) return;
  slot.i = i;
  slot.glyph.textContent = m.drum.faces[i];
}

/** Stamp the four halves into `el` (a `.flap` span) and return its drum record. */
export function mount(el: HTMLElement, d: Drum, face = 0): FlapModule {
  el.innerHTML = TEMPLATE;
  const h = el.querySelectorAll<HTMLElement>('.half');
  const slot = (half: HTMLElement): Slot => ({ half, glyph: half.firstElementChild as HTMLElement, i: -1 });
  const m: FlapModule = {
    el,
    drum: d,
    cur: face,
    target: face,
    nxt: face,
    state: IDLE,
    t0: 0,
    startAt: 0,
    dur: KNOBS.flapMs * (1 + (Math.random() * 2 - 1) * KNOBS.jitter),
    top: slot(h[0]),
    bot: slot(h[1]),
    front: slot(h[2]),
    back: slot(h[3]),
    frontShade: h[2].lastElementChild as HTMLElement,
    backShade: h[3].lastElementChild as HTMLElement,
    leaf: el.querySelector('.leaf') as HTMLElement,
  };
  setFace(m, m.top, face);
  setFace(m, m.bot, face);
  return m;
}

/* ── the scheduler ─────────────────────────────────────────────────────────── */

const active = new Set<FlapModule>();
const settleWaiters = new Set<{ mods: FlapModule[]; cb: () => void }>();
let raf = 0;
let last = 0;
let clock = 0; // board ms, advanced by clamped dt so a stalled tab never jumps
let frames = 0;
let watchdog = 0;

/** Snap to a face: no flap in the air. */
export function place(m: FlapModule, i: number) {
  m.cur = m.target = i;
  m.state = IDLE;
  setFace(m, m.top, i);
  setFace(m, m.bot, i);
  if (m.el.classList.contains('run')) {
    m.el.classList.remove('run');
    m.leaf.style.transform = '';
  }
  active.delete(m);
}

function beginStep(m: FlapModule) {
  const n = m.drum.size;
  const dist = (m.target - m.cur + n) % n;
  m.nxt = dist > KNOBS.maxSteps ? (m.target - KNOBS.maxSteps + 1 + n) % n : (m.cur + 1) % n;
  setFace(m, m.top, m.nxt); // revealed as the flap falls away
  setFace(m, m.bot, m.cur); // covered as the flap lands
  setFace(m, m.front, m.cur); // the flap's face: top half of the current character
  setFace(m, m.back, m.nxt); // its reverse: bottom half of the next
  m.frontShade.style.opacity = '0';
  m.el.classList.add('run');
}

function drawFlap(m: FlapModule, p: number) {
  const a = 180 * (V0 * p + (1 - V0) * p * p); // 0 → 180°: the hinge turns it face-down
  m.leaf.style.transform = `rotateX(${(-a).toFixed(2)}deg)`;
  if (a < 90) m.frontShade.style.opacity = ((a / 90) * SHADE_FRONT).toFixed(3);
  else m.backShade.style.opacity = (((180 - a) / 90) * SHADE_BACK).toFixed(3);
}

function tick(m: FlapModule) {
  if (m.state === WAIT) {
    if (clock < m.startAt) return;
    if (m.cur === m.target) {
      place(m, m.cur);
      return;
    }
    m.state = FLIP;
    m.t0 = m.startAt;
    beginStep(m);
  } else if (m.state === SETTLE && m.cur !== m.target) {
    m.state = FLIP; // re-aimed while settling
    m.t0 = clock;
    beginStep(m);
  }
  if (m.state === FLIP) {
    let p = (clock - m.t0) / m.dur;
    if (p >= 1) {
      m.cur = m.nxt;
      m.t0 += m.dur;
      if (m.cur === m.target) {
        m.state = SETTLE;
        setFace(m, m.bot, m.cur);
      } else {
        beginStep(m);
        p = (clock - m.t0) / m.dur;
      }
    }
    if (m.state === FLIP) {
      drawFlap(m, Math.min(p, 1));
      return;
    }
  }
  const s = (clock - m.t0) / KNOBS.bounceMs; // SETTLE: slap and rebound once
  if (s >= 1) {
    place(m, m.cur);
    return;
  }
  const r = KNOBS.bounceDeg * Math.sin(Math.PI * s);
  m.leaf.style.transform = `rotateX(${(r - 180).toFixed(2)}deg)`;
  m.backShade.style.opacity = ((r / 90) * SHADE_BACK).toFixed(3);
}

function notifySettled() {
  for (const w of settleWaiters) {
    if (w.mods.every((m) => !active.has(m))) {
      settleWaiters.delete(w);
      w.cb();
    }
  }
}

function frame(now: number) {
  raf = 0;
  frames++;
  clock += Math.max(0, Math.min(now - last, 33));
  last = now;
  for (const m of active) tick(m);
  notifySettled();
  if (active.size && !document.hidden) raf = requestAnimationFrame(frame);
}

// Frames can stall while the page still says it's visible (a throttled webview,
// a headless capture). Once a second, only while a frame is pending, check the
// loop moved; if it didn't, finish the board rather than freeze it mid-flap.
function guard() {
  if (watchdog) return;
  const seen = frames;
  watchdog = window.setTimeout(() => {
    watchdog = 0;
    if (!raf && !active.size) return;
    if (frames === seen) {
      for (const m of [...active]) place(m, m.target);
      notifySettled();
    } else guard();
  }, 1000);
}

function wake() {
  if (raf || !active.size) return;
  last = performance.now();
  raf = requestAnimationFrame(frame);
  guard();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) wake();
  });
}

/** Turn the drum forward to face `i`, starting after `delay` ms. `instant` swaps in place. */
export function aim(m: FlapModule, i: number, delay = 0, instant = false) {
  if (instant) {
    place(m, i);
    m.el.animate?.([{ opacity: 0.55 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
    notifySettled();
    return;
  }
  if (m.target === i && m.state !== IDLE) return;
  if (m.cur === i && m.state === IDLE) return;
  m.target = i;
  if (m.state === IDLE) {
    m.state = WAIT;
    m.startAt = clock + delay;
    active.add(m);
  }
  wake();
}

/** Call `cb` once every module in `mods` has come to rest. Returns an unsubscribe. */
export function whenSettled(mods: FlapModule[], cb: () => void) {
  const w = { mods, cb };
  settleWaiters.add(w);
  notifySettled();
  return () => {
    settleWaiters.delete(w);
  };
}
