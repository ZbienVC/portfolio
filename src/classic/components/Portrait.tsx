import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { LIFE_PRINTS, PORTRAIT } from '../lib/data';
import { useReducedMotionPref } from '../lib/hooks';
import { ease, spring } from '../lib/motion';
import { cn } from '../lib/cn';
import { Icon } from './Icon';

/** How long each life photo stays up. The ring on the pause button is this timer. */
const HOLD = 4200;

type Which = 'me' | 'life';
// where a print rests, in fractions of its own width (--pw), and the spot a
// print swings out to on its way from behind the other one to the front
const SLOT = {
  front: { x: '16%', y: '5%', rotate: 3.5 },
  back: { x: '-38%', y: '-7%', rotate: -6.5 },
};
const OUT = { x: '-96%', y: '-12%', rotate: -13 };

const pageVisible = {
  subscribe: (cb: () => void) => {
    document.addEventListener('visibilitychange', cb);
    return () => document.removeEventListener('visibilitychange', cb);
  },
  get: () => document.visibilityState === 'visible',
};

/**
 * The hero's portrait: two prints on the glaze. The headshot sits in front;
 * the print behind it runs through photos from off the clock, one every few
 * seconds. Tap the pair and they trade places. The photos hold still while
 * they're off screen, while a pointer rests on them, and when paused.
 */
export function Portrait({ className }: { className?: string }) {
  const reduce = useReducedMotionPref();
  const visible = useSyncExternalStore(pageVisible.subscribe, pageVisible.get, () => true);
  const [idx, setIdx] = useState(0);
  const [front, setFront] = useState<Which>('me');
  // z-order follows `front`, but only once the print coming forward has cleared the other
  const [top, setTop] = useState<Which>('me');
  const [swapped, setSwapped] = useState(false); // until the first tap, the prints only deal out
  const [paused, setPaused] = useState(false);
  const [resting, setResting] = useState(false); // a pointer is on the prints
  const [inView, setInView] = useState(true);
  const figure = useRef<HTMLElement>(null);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);

  const running = !reduce && !paused && !resting && inView && visible;
  const life = LIFE_PRINTS[idx];
  const next = () => setIdx((i) => (i + 1) % LIFE_PRINTS.length);

  useEffect(() => {
    const el = figure.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the other prints download after the page settles, so each change is instant
  useEffect(() => {
    const warm = () => LIFE_PRINTS.slice(1).forEach((p) => (new Image().src = p.src));
    const id = window.requestIdleCallback ? window.requestIdleCallback(warm, { timeout: 4000 }) : window.setTimeout(warm, 2500);
    const t = timers.current;
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id);
      window.clearTimeout(id);
      t.forEach(window.clearTimeout);
    };
  }, []);

  const swap = () => {
    if (busy.current) return;
    busy.current = true;
    const coming: Which = front === 'me' ? 'life' : 'me';
    setSwapped(true);
    setFront(coming);
    timers.current.push(
      window.setTimeout(() => setTop(coming), reduce ? 0 : 190),
      window.setTimeout(() => (busy.current = false), reduce ? 0 : 640),
    );
  };

  return (
    <figure
      ref={figure}
      className={cn('flex flex-col items-start gap-3 select-none [--pw:clamp(128px,38vw,188px)]', className)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setResting(true)}
      onPointerLeave={() => setResting(false)}
    >
      <figcaption className="sr-only">
        {PORTRAIT.alt}. Behind the portrait, photos from off the clock: {life.alt}.
      </figcaption>

      <NowShowing
        idx={idx}
        label={life.label}
        running={running}
        paused={paused}
        reduce={reduce}
        onToggle={() => setPaused((p) => !p)}
        onNext={next}
      />

      <motion.button
        type="button"
        onClick={swap}
        className="relative block h-[calc(var(--pw)*1.36)] w-[calc(var(--pw)*1.62)] cursor-pointer rounded-lg outline-offset-4"
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.985 }}
        transition={spring.crisp}
      >
        {/* named by its captions, so what a screen reader says matches what the prints show */}
        <span className="sr-only">Swap the prints: </span>
        <Print which="life" front={front} top={top} swapped={swapped} caption={<Caption text={life.label} />}>
          <AnimatePresence initial={false}>
            <motion.img
              key={life.src}
              src={life.src}
              alt=""
              draggable={false}
              decoding="async"
              className="absolute inset-0 size-full object-cover"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 0.7, ease: ease.out }, scale: { duration: (HOLD + 900) / 1000, ease: 'linear' } }}
            />
          </AnimatePresence>
        </Print>
        <Print which="me" front={front} top={top} swapped={swapped} caption={<Caption text="Zach Bienstock" />}>
          <img
            src={PORTRAIT.src}
            alt=""
            width={400}
            height={400}
            draggable={false}
            fetchPriority="high"
            className="absolute inset-0 size-full object-cover"
          />
        </Print>
      </motion.button>
    </figure>
  );
}

interface NowShowingProps {
  idx: number;
  label: string;
  running: boolean;
  paused: boolean;
  reduce: boolean;
  onToggle: () => void;
  onNext: () => void;
}

/** The running photo's name, and the control that stops it. Its ring is the time left on this photo. */
function NowShowing({ idx, label, running, paused, reduce, onToggle, onNext }: NowShowingProps) {
  const gradient = useId();
  return (
    <div className="relative z-10 flex max-w-full items-center gap-2 rounded-full bg-term/92 py-1 pr-3 pl-1 text-term-ink shadow-[0_6px_18px_-8px_rgb(0_0_0/0.5)]">
      <button
        type="button"
        onClick={reduce ? onNext : onToggle}
        className="relative grid size-7 shrink-0 place-items-center rounded-full text-term-ink"
        aria-label={reduce ? 'Next photo' : paused ? 'Play the photos' : 'Pause the photos'}
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 28 28" aria-hidden="true">
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffb347" />
              <stop offset="1" stopColor="#d8432a" />
            </linearGradient>
          </defs>
          <circle cx="14" cy="14" r="12" fill="none" stroke="var(--term-rule)" strokeWidth="2" />
          {/* a CSS animation is the clock: pausing it pauses the photos, and its end turns to the next one */}
          {!reduce && (
            <circle
              key={idx}
              cx="14"
              cy="14"
              r="12"
              fill="none"
              stroke={`url(#${gradient})`}
              strokeWidth="2"
              strokeLinecap="round"
              className="portrait-ring"
              style={{ animationDuration: `${HOLD}ms`, animationPlayState: running ? 'running' : 'paused' }}
              onAnimationEnd={onNext}
            />
          )}
        </svg>
        <Icon name={reduce ? 'arrowRight' : paused ? 'play' : 'pause'} size={reduce ? 13 : 12} />
      </button>
      <span className="relative min-w-0 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={idx}
            className="block truncate font-mono text-[11px] tracking-[0.02em] text-term-ink"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ ...spring.crisp, opacity: { duration: 0.18 } }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}

interface PrintProps {
  which: Which;
  front: Which;
  top: Which;
  swapped: boolean;
  caption: ReactNode;
  children: ReactNode;
}

function Print({ which, front, top, swapped, caption, children }: PrintProps) {
  const slot = front === which ? SLOT.front : SLOT.back;
  // the print coming forward swings out from behind the other first
  const coming = swapped && front === which;
  return (
    <motion.span
      className="absolute top-[calc(var(--pw)*0.12)] left-[calc(var(--pw)*0.43)] block w-[var(--pw)] rounded-[3px] bg-[#fbfaf7] p-[6%] pb-[21%] shadow-[0_1px_2px_rgb(0_0_0/0.14),0_20px_40px_-18px_rgb(20_8_4/0.55)]"
      style={{ zIndex: top === which ? 3 : 1 }}
      // dealt out of one pile on arrival, then trading places on a tap
      initial={{ x: '0%', y: '10%', rotate: 0 }}
      animate={coming ? { x: [null, OUT.x, slot.x], y: [null, OUT.y, slot.y], rotate: [null, OUT.rotate, slot.rotate] } : slot}
      transition={coming ? { duration: 0.72, times: [0, 0.32, 1], ease: [ease.out, [0.2, 0.9, 0.25, 1]] } : { ...spring.gentle, delay: 0.08 }}
    >
      <span className="relative block aspect-square overflow-hidden bg-[#2a2420]">{children}</span>
      {caption}
    </motion.span>
  );
}

function Caption({ text }: { text: string }) {
  return (
    <span className="absolute inset-x-[6%] bottom-[5.5%] block text-left text-[clamp(10.5px,2.9vw,12.5px)] font-[640] tracking-[-0.005em] text-[#2a2420] [font-stretch:104%]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={text} className="block truncate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
