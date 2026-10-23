import { useScroll } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Specimen } from '../specimens/Specimen';
import { useTheme } from '../lib/theme';
import { useFinePointer, useInViewOnce, useReducedMotionPref } from '../lib/hooks';
import { cn } from '../lib/cn';
import { BUILT, CREW, FACTS, LAYERS, NEVER_LIST, ROUTES, SHIPS, type Layer } from '../lib/how';

/**
 * How I build: four layers stacked like a deck, models at the bottom, what
 * ships on top. Pick a layer and its card slides out of the deck sideways,
 * then stands up to face you beside the stack (never on top of it). Pick
 * another and the first one lies back down and slides home along the same
 * path while the next one comes out. A dashed outline holds each empty slot.
 *
 * How the motion works:
 * - Every card lives in ONE 3D space, so the browser sorts depth itself and no
 *   card ever pops in front of another. The path is built so cards never pass
 *   through each other: they slide out flat at their own level (parallel to the
 *   rest of the deck), and only turn once they are clear of it.
 * - Each card has one Web Animations timeline sampled from that path. Opening
 *   plays it forward; closing plays it backwards from wherever it is, so a
 *   change of mind never jumps. A new card waits until every other card has
 *   finished turning back and is only sliding home.
 * - Hover only lifts a card a little (a preview). Click or tap opens it, so
 *   moving the mouse across the deck never reshuffles it.
 * - Opening a layer sends a light up from the models through every layer
 *   under it: each layer runs on the ones below.
 */

const DUR = 900; // one full trip, slot to facing you, ms
const SPLIT = 0.36; // where on that trip the slide ends and the turn begins
const BACK = 1.55; // closing runs faster than opening
const STEP = 120; // ms between layers as the light climbs
const SAMPLES = 48;

type V2 = { x: number; y: number };
interface Geo {
  W: number; H: number; tilt: number; turn: number; gap: number; ks: number;
  S: V2; B: V2; F: V2; lift: number;
}

/** where everything sits, for a scene this size */
function geometry(SW: number, SH: number, small: boolean): Geo {
  if (small) {
    const W = Math.min(420, SW - 6);
    const H = Math.round(W * 0.62);
    const ks = 0.7;
    const tilt = 56;
    const c = Math.cos((tilt * Math.PI) / 180);
    return {
      W, H, tilt, turn: 0, gap: 40, ks, lift: 50,
      S: { x: 0, y: SH / 2 - (H * ks * c) / 2 - 10 },
      B: { x: 0, y: -(H * ks + 34) },
      F: { x: 0, y: -SH / 2 + H / 2 + 2 },
    };
  }
  const W = Math.min(390, SW * 0.5);
  const H = Math.round(W * 0.62);
  const ks = 0.8;
  return {
    W, H, tilt: 54, turn: -9, gap: 58, ks, lift: 80,
    S: { x: -SW / 2 + (W * ks) / 2 + 12, y: SH * 0.1 },
    B: { x: W * ks + 40, y: 0 },
    F: { x: SW / 2 - W / 2 - 2, y: -SH * 0.05 },
  };
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const f = (n: number) => n.toFixed(2);

/** the card's pose at point p of its trip (0 in its slot, 1 facing you) */
function pose(g: Geo, level: number, p: number) {
  const base = `translate3d(${f(g.S.x)}px,${f(g.S.y)}px,0px) rotateX(${g.tilt}deg) rotateZ(${g.turn}deg)`;
  if (p <= SPLIT) {
    const e = ease(p / SPLIT);
    return `${base} translate3d(${f(g.B.x * e)}px,${f(g.B.y * e)}px,${f(level * g.gap)}px) scale(${g.ks})`;
  }
  const out = new DOMMatrix()
    .translate(g.S.x, g.S.y, 0)
    .rotate(g.tilt, 0, 0)
    .rotate(0, 0, g.turn)
    .translate(g.B.x, g.B.y, level * g.gap)
    .transformPoint(new DOMPoint(0, 0, 0));
  const e = ease((p - SPLIT) / (1 - SPLIT));
  const x = out.x + (g.F.x - out.x) * e;
  const y = out.y + (g.F.y - out.y) * e;
  // lifted toward you on the way, like picking a card up
  const z = out.z * (1 - e) + Math.sin(Math.PI * e) * g.lift;
  return `translate3d(${f(x)}px,${f(y)}px,${f(z)}px) rotateX(${f(g.tilt * (1 - e))}deg) rotateZ(${f(g.turn * (1 - e))}deg) scale(${f(g.ks + (1 - g.ks) * e)})`;
}

export function HowIBuild() {
  const { theme } = useTheme();
  const reduce = useReducedMotionPref();
  const fine = useFinePointer();
  const root = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: root, offset: ['start 85%', 'center 40%'] });

  const scene = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const ghosts = useRef<(HTMLDivElement | null)[]>([]);
  const anims = useRef<Animation[]>([]);
  const wait = useRef(0);
  const cur = useRef(-1);

  const [on, setOn] = useState(-1);
  const [peek, setPeek] = useState(-1);
  const [pulse, setPulse] = useState({ key: 0, to: -1 });
  const [stageRef, seen] = useInViewOnce<HTMLDivElement>('0px 0px -30% 0px');

  const N = LAYERS.length;
  const level = (i: number) => N - 1 - i;

  /* build (or rebuild, on resize) every card's timeline, keeping where each one is */
  const build = useCallback(() => {
    const el = scene.current;
    if (!el) return;
    const g = geometry(el.offsetWidth, el.offsetHeight, window.innerWidth < 1024);
    cards.current.forEach((c, i) => {
      if (!c) return;
      Object.assign(c.style, { width: `${g.W}px`, height: `${g.H}px`, left: `${-g.W / 2}px`, top: `${-g.H / 2}px` });
      const gh = ghosts.current[i];
      if (gh) {
        Object.assign(gh.style, { width: `${g.W}px`, height: `${g.H}px`, left: `${-g.W / 2}px`, top: `${-g.H / 2}px` });
        gh.style.transform = pose(g, level(i), 0);
      }
      const frames: Keyframe[] = Array.from({ length: SAMPLES + 1 }, (_, k) => ({ transform: pose(g, level(i), k / SAMPLES) }));
      const old = anims.current[i];
      const time = Number(old?.currentTime ?? 0);
      const rate = old?.playbackRate ?? 1;
      const running = old?.playState === 'running';
      old?.cancel();
      const a = c.animate(frames, { duration: DUR, fill: 'both' });
      a.pause();
      a.currentTime = time;
      a.playbackRate = rate;
      if (running) a.play();
      anims.current[i] = a;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    build();
    const el = scene.current;
    if (!el) return;
    let t = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(build, 100);
    });
    ro.observe(el);
    const list = anims.current;
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
      cancelAnimationFrame(wait.current);
      list.forEach((a) => a.cancel());
    };
  }, [build]);

  const pick = useCallback(
    (i: number) => {
      if (i === cur.current) return;
      const prev = cur.current;
      cur.current = i;
      setOn(i);
      setPeek(-1);
      setPulse((p) => ({ key: p.key + 1, to: i }));

      const prevAnim = anims.current[prev];
      if (prevAnim) {
        prevAnim.playbackRate = reduce ? -100 : -BACK;
        prevAnim.play();
      }
      // the new card leaves once every other card has turned back and is only sliding home
      cancelAnimationFrame(wait.current);
      const turnEnd = DUR * SPLIT;
      const go = () => {
        if (cur.current !== i) return;
        const clear = anims.current.every((a, k) => k === i || !a || Number(a.currentTime ?? 0) <= turnEnd + 1);
        if (!clear && !reduce) {
          wait.current = requestAnimationFrame(go);
          return;
        }
        const a = anims.current[i];
        if (!a) return;
        a.playbackRate = reduce ? 100 : 1;
        a.play();
      };
      go();
    },
    [reduce],
  );

  // my layer comes out once the section is on screen
  useEffect(() => {
    if (!seen || cur.current >= 0) return;
    const raf = requestAnimationFrame(() => pick(1));
    return () => cancelAnimationFrame(raf);
  }, [seen, pick]);

  // the light climbs from the bottom layer to the one you opened
  const delay = (i: number) => (N - 1 - i) * STEP;

  const layer = LAYERS[Math.max(0, on)];
  const order = [...LAYERS.keys()].reverse(); // 01 first, for the index

  const onKey = (e: React.KeyboardEvent) => {
    const at = order.indexOf(Math.max(0, on));
    const to = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? at + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? at - 1 : -1;
    if (to < 0 || to >= N) return;
    e.preventDefault();
    pick(order[to]);
    (e.currentTarget.querySelectorAll('button')[to] as HTMLButtonElement | undefined)?.focus();
  };

  return (
    <section ref={root} id="how" aria-labelledby="how-title" className="section-y relative overflow-hidden bg-term text-term-ink">
      {/* Specimen Atlas's slime mold: thousands of small agents building a network, kept behind the heading */}
      <div
        className="pointer-events-none absolute top-0 right-0 h-[min(760px,86vh)] w-[min(1000px,66%)] [mask-image:linear-gradient(to_right,transparent,black_60%),linear-gradient(to_bottom,black_24%,transparent_58%)] [mask-composite:intersect] max-lg:w-full max-lg:opacity-40"
        aria-hidden="true"
      >
        <Specimen
          key={theme}
          file="particles-physarum-crew"
          id="physarum-crew"
          className="absolute inset-0 opacity-45"
          palette={{ bg: 'var(--term)', mid: 'color-mix(in oklch, var(--term) 62%, var(--term-amber))', accent: 'var(--term-amber)', hi: 'var(--term-ink)' }}
          drive={scrollYProgress}
          fps={30}
        />
      </div>
      <div className="hb-glow" aria-hidden="true" />

      <div className="container-x relative">
        <div className="grid items-end gap-x-12 gap-y-8 lg:grid-cols-12">
          <header className="lg:col-span-7">
            <p className="flex items-center gap-2 font-mono text-[12px] tracking-[0.06em] text-term-amber uppercase">
              <span className="h-px w-5 bg-term-amber" aria-hidden="true" />
              How I build
            </p>
            <h2 id="how-title" className="h2-type mt-4 max-w-[14ch] text-term-ink">
              Every new model makes my setup better.
            </h2>
            <p className="mt-5 max-w-[36rem] text-[17px] leading-relaxed text-term-dim [text-wrap:pretty]">
              I’m a finance ops analyst who taught himself to ship software with Claude. A homemade agent framework would be outdated by the next model release, so I build on what the labs ship and spend my time on the part they can’t hand me:{' '}
              <span className="text-term-ink">my taste, my rules, and problems I know from real work.</span> If someone needs a manual to use what I made, I’m not done yet.
            </p>
          </header>
          <ul className="hb-facts lg:col-span-5">
            {FACTS.map((x) => (
              <li key={x.k}>
                <span>{x.k}</span>
                <b>{x.v}</b>
              </li>
            ))}
          </ul>
        </div>

        <div ref={stageRef} className="mt-10 grid items-center gap-x-10 gap-y-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div ref={scene} className="hb-scene" onPointerLeave={() => setPeek(-1)}>
              <div className="hb-floor" aria-hidden="true" />
              <div className="hb-world">
                {LAYERS.map((l, i) => (
                  <div
                    key={l.id}
                    ref={(el) => { ghosts.current[i] = el; }}
                    className={cn('hb-ghost', l.mine && 'mine', on === i && 'show')}
                    aria-hidden="true"
                  >
                    {pulse.to === i && <span key={pulse.key} className="hb-zap" style={{ animationDelay: `${delay(i)}ms` }} />}
                  </div>
                ))}
                {LAYERS.map((l, i) => {
                  const lit = pulse.to >= 0 && i >= pulse.to;
                  return (
                    <div
                      key={l.id}
                      ref={(el) => { cards.current[i] = el; }}
                      className={cn('hb-card', l.mine && 'mine', on === i && 'open', peek === i && 'peek')}
                      aria-hidden="true"
                      onPointerEnter={(e) => { if (e.pointerType === 'mouse' && on !== i) setPeek(i); }}
                      onPointerLeave={() => setPeek((p) => (p === i ? -1 : p))}
                      onClick={() => pick(i)}
                    >
                      <div className="hb-lift">
                        <div className="hb-plate p3" />
                        <div className="hb-plate p2" />
                        <div className="hb-plate p1" />
                        <div className="hb-face">
                          <span className="hb-num">{l.no}</span>
                          <div className="hb-rich">
                            <Rich layer={l} />
                          </div>
                          <div>
                            <p className="hb-lbl">
                              {l.no} · {l.kicker}
                            </p>
                            <p className="hb-name">{l.name}</p>
                          </div>
                          {lit && (
                            <span
                              key={pulse.key}
                              className="hb-zap"
                              style={{ animationDelay: `${on === i ? Math.max(delay(i), DUR * 0.95) : delay(i)}ms` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="hb-hint">
              <p>
                <b>01</b> and <b>02</b> come from the labs. <b className="mine">03</b> is mine. <b>04</b> is what you see.
              </p>
              <p className="hb-how">{fine ? 'Click a layer to pull it out' : 'Tap a layer to pull it out'}</p>
            </div>
          </div>

          <div className="flex flex-col lg:col-span-4">
            <Copy key={layer.id} layer={layer} reduce={reduce} live={on >= 0} />
            <div className="hb-steps max-lg:order-first" role="tablist" aria-label="The layers, bottom up" onKeyDown={onKey}>
              {order.map((i) => {
                const l = LAYERS[i];
                return (
                  <button
                    key={l.id}
                    type="button"
                    role="tab"
                    aria-selected={on === i}
                    tabIndex={on === i || (on < 0 && i === 1) ? 0 : -1}
                    className={cn(on === i && 'on', l.mine && 'mine')}
                    onClick={() => pick(i)}
                  >
                    <span className="hb-rail" aria-hidden="true">
                      {pulse.to >= 0 && i >= pulse.to && <i key={pulse.key} style={{ animationDelay: `${delay(i)}ms` }} />}
                    </span>
                    <small>{l.no}</small>
                    <span>{l.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="hb-built">
          <p>Built along the way</p>
          <ul>
            {BUILT.map((t) => {
              const [a, b] = t.em ? t.body.split(t.em) : [t.body, ''];
              return (
                <li key={t.name}>
                  <h4>
                    {t.name} <span>{t.role}</span>
                  </h4>
                  <p>
                    {a}
                    {t.em && <b>{t.em}</b>}
                    {b}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

/**
 * The words next to the stack. They arrive in reading order: the kicker
 * decodes like a terminal, the title's words rise into place, the sentences
 * follow one after another, and last the phrase worth remembering gets
 * underlined, so a skim still catches the point.
 */
function Copy({ layer, reduce, live }: { layer: Layer; reduce: boolean; live: boolean }) {
  const kicker = useDecode(`${layer.no} · ${layer.kicker}`, live && !reduce);
  const words = layer.title.split(' ');
  const sentences = layer.body.split(/(?<=[.!?])\s+/);
  const titleEnd = 140 + words.length * 45;
  const bodyEnd = titleEnd + 120 + sentences.length * 90;
  return (
    <div className={cn('hb-copy', live && 'live')} aria-live="polite">
      <p className={cn('hb-kick', layer.mine && 'mine')}>{kicker}</p>
      <h3 className="hb-title">
        {words.map((w, k) => (
          <span key={k}>
            <span className="hb-w">
              <span style={{ animationDelay: `${140 + k * 45}ms` }}>{w}</span>
            </span>{' '}
          </span>
        ))}
      </h3>
      <p className="hb-body">
        {sentences.map((s, k) => {
          const at = s.indexOf(layer.em);
          return (
            <span key={k} className="hb-s" style={{ animationDelay: `${titleEnd + 60 + k * 90}ms` }}>
              {at < 0 ? (
                s
              ) : (
                <>
                  {s.slice(0, at)}
                  <mark className="hb-em" style={{ animationDelay: `${bodyEnd + 150}ms` }}>
                    {layer.em}
                  </mark>
                  {s.slice(at + layer.em.length)}
                </>
              )}{' '}
            </span>
          );
        })}
      </p>
    </div>
  );
}

/** a mono line that settles out of scrambled characters, left to right */
function useDecode(text: string, run: boolean) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (!run) return;
    const glyphs = '01<>/[]#=+*';
    const start = performance.now();
    const span = 380;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / span);
      const settled = Math.floor(t * text.length);
      setOut(
        text
          .split('')
          .map((ch, k) => (k < settled || ch === ' ' ? ch : glyphs[(k * 7 + Math.floor(now / 40)) % glyphs.length]))
          .join(''),
      );
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, run]);
  return run ? out : text;
}

/** What a card shows once it faces you: the proof for that layer. */
function Rich({ layer }: { layer: Layer }) {
  switch (layer.id) {
    case 'ships':
      return (
        <div className="hb-mini">
          {SHIPS.map((s) => (
            <div key={s.name}>
              <b>{s.name}</b>
              <span>{s.kind}</span>
            </div>
          ))}
        </div>
      );
    case 'mine':
      return (
        <div className="hb-code">
          {NEVER_LIST.map((r) => (
            <div key={r.rule}>
              <span className="a">{r.key}:</span> {r.rule}
            </div>
          ))}
        </div>
      );
    case 'harness':
      return (
        <div>
          <div className="hb-roster">
            {CREW.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <p className="hb-night">
            overnight: Crucible → research → build on a branch → <b>my yes</b>
          </p>
        </div>
      );
    case 'models':
      return (
        <div className="hb-code">
          {ROUTES.map(([job, model, note]) => (
            <div key={job}>
              {job.padEnd(19)}
              <span className="d">→</span> <span className="a">{model}</span>
              {note && <span className="d n">{'  ' + note}</span>}
            </div>
          ))}
        </div>
      );
  }
}
