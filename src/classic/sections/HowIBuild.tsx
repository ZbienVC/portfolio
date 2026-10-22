import { useScroll } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Specimen } from '../specimens/Specimen';
import { useTheme } from '../lib/theme';
import { useInViewOnce, useReducedMotionPref } from '../lib/hooks';
import { cn } from '../lib/cn';
import { BUILT, CREW, FACTS, LAYERS, NEVER_LIST, ROUTES, SHIPS, type Layer } from '../lib/how';

/**
 * How I build: four layers stacked like cards, models at the bottom, what
 * ships on top. Hover (or tap) a layer and its card slides out of the stack,
 * turns to face you and shows its proof; the next one plays the same path in
 * reverse. "Ship a new model" drops a new model in at the bottom and sends a
 * glint up through every layer, which is the whole argument of the section.
 *
 * How the swing works:
 * - Each card sits in its own 3D space (a "slot" carrying the stack's tilt), so
 *   cards never slice through each other; which one draws on top is set by
 *   z-index, switched at the moment a card is out to the side of the stack.
 * - Each card has one Web Animations timeline: resting, slid out sideways,
 *   facing you. The facing pose undoes the stack's tilt exactly (rotateZ then
 *   rotateX, reversed) and the slide is solved so the card's centre lands on one
 *   spot in front of the stack. Closing plays the same timeline backwards from
 *   wherever it is, so a change of mind never jumps.
 * - Hover targets are fixed bands over the stack, so a card sliding under a
 *   still cursor never steals the selection.
 */

const GAP = 92; // depth between layers, px
const DUR = 1150; // one full swing, ms
const MID = 0.36; // where on the timeline a card sits out to the side

export function HowIBuild() {
  const { theme } = useTheme();
  const reduce = useReducedMotionPref();
  const root = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: root, offset: ['start 85%', 'center 40%'] });

  const scene = useRef<HTMLDivElement>(null);
  const slots = useRef<(HTMLDivElement | null)[]>([]);
  const slabs = useRef<(HTMLDivElement | null)[]>([]);
  const anims = useRef<Animation[]>([]);
  const zRaf = useRef<number[]>([]);
  const openTimer = useRef(0);
  const hoverTimer = useRef(0);
  const onRef = useRef(-1);
  const busy = useRef(false);

  const [on, setOn] = useState(1);
  const [open, setOpen] = useState(-1);
  const [releasing, setReleasing] = useState<'idle' | 'landing' | 'carried'>('idle');
  const [shipped, setShipped] = useState(false);
  const [zapping, setZapping] = useState(-1);
  const [stageRef, seen] = useInViewOnce<HTMLDivElement>('0px 0px -30% 0px');

  const N = LAYERS.length;
  const restZ = useCallback((i: number) => {
    const s = slots.current[i];
    if (s) s.style.zIndex = String(N - i);
  }, [N]);

  /* build (or rebuild, on resize) every card's timeline, keeping where each one is */
  const build = useCallback(() => {
    const first = slots.current[0];
    if (!first) return;
    const pm = new DOMMatrix(getComputedStyle(first).transform);
    const W = first.offsetWidth;
    const H = first.offsetHeight;
    const small = window.innerWidth < 1024;
    // the lift brings a card toward you, so it scales back down; it still ends up larger than in the stack
    const target = { x: small ? 0 : W * 0.02, y: -H * (small ? 0.06 : 0.08), z: small ? 360 : 420 };
    const sc = small ? 0.95 : 1;
    const out = small ? { x: -70, y: 50 } : { x: -150, y: 90 };
    slabs.current.forEach((s, i) => {
      if (!s) return;
      const z = (N - 1 - i) * GAP;
      const c = pm.transformPoint(new DOMPoint(s.offsetLeft + s.offsetWidth / 2 - W / 2, s.offsetTop + s.offsetHeight / 2 - H / 2, z));
      const t = { x: target.x - c.x, y: target.y - c.y, z: target.z - c.z };
      const k = (sx: number, sy: number, sz: number, rz: number, rx: number, f: number, m: number) =>
        `translate3d(0px,0px,${z}px) translate3d(${sx}px,${sy}px,${sz}px) rotateZ(${rz}deg) rotateX(${rx}deg) translate3d(${t.x * f}px,${t.y * f}px,${t.z * f}px) scale(${m})`;
      const frames: Keyframe[] = [
        { transform: k(0, 0, 0, 0, 0, 0, 1), easing: 'cubic-bezier(.45,.05,.55,.95)' },
        { transform: k(out.x, out.y, 40, 3, -4, 0.06, 0.97), offset: MID, easing: 'cubic-bezier(.33,.12,.15,1)' },
        { transform: k(0, 0, 0, 28, -60, 1, sc) },
      ];
      const old = anims.current[i];
      const time = Number(old?.currentTime ?? 0);
      const rate = old?.playbackRate ?? 1;
      const running = old?.playState === 'running';
      old?.cancel();
      const a = s.animate(frames, { duration: DUR, fill: 'both' });
      a.pause();
      a.currentTime = time;
      a.playbackRate = rate;
      if (running) a.play();
      anims.current[i] = a;
    });
  }, [N]);

  useLayoutEffect(() => {
    slots.current.forEach((_, i) => restZ(i));
    build();
    const el = scene.current;
    if (!el) return;
    let t = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(build, 120);
    });
    ro.observe(el);
    const anim = anims.current;
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
      anim.forEach((a) => a.cancel());
    };
  }, [build, restZ]);

  /* run fn when a card's timeline crosses the point where it sits out to the side */
  const atMid = useCallback((i: number, fn: () => void) => {
    cancelAnimationFrame(zRaf.current[i]);
    const a = anims.current[i];
    if (!a) return fn();
    const m = DUR * MID;
    const tick = () => {
      const time = Number(a.currentTime ?? 0);
      const r = a.playbackRate;
      if ((r > 0 && time >= m) || (r < 0 && time <= m) || a.playState !== 'running') return fn();
      zRaf.current[i] = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const closeCard = useCallback((i: number) => {
    const a = anims.current[i];
    if (i < 0 || !a) return;
    const s = slots.current[i];
    if (s) s.style.zIndex = '15';
    a.playbackRate = reduce ? -100 : -1.3;
    a.play();
    atMid(i, () => restZ(i));
  }, [atMid, reduce, restZ]);

  const openCard = useCallback((i: number, delay: number) => {
    window.clearTimeout(openTimer.current);
    openTimer.current = window.setTimeout(() => {
      const a = anims.current[i];
      if (!a || onRef.current !== i) return;
      setOpen(i);
      a.playbackRate = reduce ? 100 : 1;
      a.play();
      atMid(i, () => {
        const s = slots.current[i];
        if (s && onRef.current === i) s.style.zIndex = '20';
      });
    }, reduce ? 0 : delay);
  }, [atMid, reduce]);

  const pick = useCallback((i: number, force = false) => {
    if ((i === onRef.current && !force) || busy.current) return;
    const prev = onRef.current;
    onRef.current = i;
    setOn(i);
    setOpen(-1);
    // the open card heads home first; the next one leaves once the way is clearing
    closeCard(prev);
    openCard(i, prev < 0 ? 0 : 230);
  }, [closeCard, openCard]);

  // the first card comes out once the section is on screen
  useEffect(() => {
    if (!seen || onRef.current >= 0) return;
    const raf = requestAnimationFrame(() => pick(1));
    return () => cancelAnimationFrame(raf);
  }, [seen, pick]);

  /* a model release: tuck the open card in, glint up the stack, swing it back out */
  const ship = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const wait = (ms: number) => new Promise((r) => window.setTimeout(r, reduce ? 0 : ms));
    const was = onRef.current;
    if (was >= 0) {
      closeCard(was);
      setOpen(-1);
      await wait(720);
    }
    setReleasing('landing');
    setShipped(true);
    for (let i = N - 1; i >= 0; i--) {
      setZapping(i);
      await wait(240);
    }
    setZapping(-1);
    setReleasing('carried');
    await wait(900);
    busy.current = false;
    if (was >= 0) {
      onRef.current = -1;
      pick(was);
    }
    await wait(2000);
    setShipped(false);
    setReleasing('idle');
  }, [N, closeCard, pick, reduce]);

  // play the release once by itself, a beat after the stack first opens
  const autoShipped = useRef(false);
  useEffect(() => {
    if (!seen || autoShipped.current || reduce) return;
    autoShipped.current = true;
    const t = window.setTimeout(ship, 2200);
    return () => window.clearTimeout(t);
  }, [seen, ship, reduce]);

  // the open card leans a few degrees toward the pointer
  const lean = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || reduce || !scene.current) return;
    const r = scene.current.getBoundingClientRect();
    scene.current.style.setProperty('--hb-ry', `${(((e.clientX - r.left) / r.width - 0.5) * 9).toFixed(2)}deg`);
    scene.current.style.setProperty('--hb-rx', `${(-((e.clientY - r.top) / r.height - 0.5) * 7).toFixed(2)}deg`);
  };
  const unlean = () => {
    scene.current?.style.setProperty('--hb-ry', '0deg');
    scene.current?.style.setProperty('--hb-rx', '0deg');
  };

  const layer = LAYERS[Math.max(0, on)];

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
              I’m a finance ops analyst who taught himself to ship with Claude. I build on what the labs release and put my time into the one layer they can’t hand me:{' '}
              <span className="text-term-ink">my taste, my rules, and the problems I know from real work.</span> And I keep it simple. If someone needs a manual to use what I made, it isn’t finished.
            </p>
          </header>
          <ul className="hb-facts lg:col-span-5">
            {FACTS.map((f) => (
              <li key={f.k}>
                <span>{f.k}</span>
                <b>{f.v}</b>
              </li>
            ))}
          </ul>
        </div>

        <div ref={stageRef} className="mt-8 grid items-center gap-x-10 gap-y-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div ref={scene} className="hb-scene" onPointerMove={lean} onPointerLeave={unlean}>
              <div className="hb-floor" aria-hidden="true" />
              {LAYERS.map((l, i) => (
                <div key={l.id} ref={(el) => { slots.current[i] = el; }} className="hb-slot" aria-hidden="true">
                  <div
                    ref={(el) => { slabs.current[i] = el; }}
                    className={cn('hb-slab', l.mine && 'mine', open === i && 'open', zapping === i && 'zap')}
                  >
                    <div className="hb-inner">
                      <div className="hb-plate p3" />
                      <div className="hb-plate p2" />
                      <div className="hb-plate p1" />
                      <div className="hb-face">
                        <div className="hb-rich">
                          <Rich layer={l} />
                        </div>
                        <div>
                          <p className="hb-lbl">{l.kicker}</p>
                          <p className="hb-name">{l.name}</p>
                          <div className="hb-chips">
                            {l.chips.map((c, ci) => (
                              <span key={c} className={cn(l.id === 'models' && ci === 0 && shipped && 'new')}>
                                {l.id === 'models' && ci === 0 && shipped ? 'Opus, next' : c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {/* fixed hover bands, one per layer, in stack order */}
              <div className="hb-bands">
                {LAYERS.map((l, i) => (
                  <button
                    key={l.id}
                    type="button"
                    aria-label={`Open ${l.name}`}
                    aria-pressed={on === i}
                    onPointerEnter={(e) => {
                      if (e.pointerType !== 'mouse') return;
                      window.clearTimeout(hoverTimer.current);
                      hoverTimer.current = window.setTimeout(() => pick(i), 110);
                    }}
                    onPointerLeave={() => window.clearTimeout(hoverTimer.current)}
                    onClick={() => {
                      window.clearTimeout(hoverTimer.current);
                      pick(i);
                    }}
                    onFocus={() => pick(i)}
                  />
                ))}
              </div>
            </div>
            <div className="hb-release">
              <button type="button" onClick={ship} disabled={releasing !== 'idle'}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
                </svg>
                Ship a new model
              </button>
              <p aria-live="polite">
                {releasing === 'landing' ? 'A new model lands at the bottom...' : releasing === 'carried' ? 'My skills, memory and rules carried straight over.' : 'Press it. Watch what changes.'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div key={layer.id} className="hb-copy" aria-live="polite">
              <p className="font-mono text-[11.5px] text-term-amber">{layer.kicker}</p>
              <h3 className="mt-3 text-[clamp(25px,1rem+1.2vw,32px)] leading-[1.08] font-[720] tracking-[-0.02em] text-term-ink [font-stretch:114%]">{layer.title}</h3>
              <p className="mt-3.5 max-w-[31rem] text-[16.5px] leading-[1.65] text-term-ink/88 [text-wrap:pretty]">{layer.body}</p>
            </div>
            <div className="hb-steps" role="tablist" aria-label="The layers">
              {LAYERS.map((l, i) => (
                <button key={l.id} type="button" role="tab" aria-selected={on === i} className={cn(on === i && 'on')} onClick={() => pick(i)}>
                  <small>0{N - i}</small>
                  <span>{l.name}</span>
                </button>
              ))}
            </div>
            <p className={cn('mt-3 font-mono text-[11.5px] text-term-amber transition-opacity duration-300', releasing === 'carried' ? 'opacity-100' : 'opacity-0')}>
              Everything above the models got better. Nothing needed a rewrite.
            </p>
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
              <span className="a">{r.key}:</span>
              {' '}
              {r.rule}
            </div>
          ))}
          <div className="hb-tick">
            <span className="g">✓</span> <span className="d">applied to every build, unasked</span>
          </div>
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
