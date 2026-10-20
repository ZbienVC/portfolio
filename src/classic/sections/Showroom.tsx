import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Phone } from '../components/Devices';
import { Laptop3D } from '../components/Laptop3D';
import { HoverArrow, Icon } from '../components/Icon';
import { SignatureStrip } from '../components/Signature';
import {
  DEMO_IDS,
  FILTERS,
  LIVE_COUNT,
  PING_TARGETS,
  PROJECTS,
  STAGE,
  STAGE_IDS,
  TOOLS,
  embeds,
  hostOf,
  inFilter,
  launchLabel,
  shotId,
  shotSrc,
  type FilterId,
  type Project,
  type Signature,
} from '../lib/data';
import { isTypingTarget, useFinePointer, useMedia, useReducedMotionPref } from '../lib/hooks';
import { registerReveal, registerStage } from '../lib/launch';
import { useBoard } from '../lib/pings';
import { ease, spring } from '../lib/motion';
import { useTheme } from '../lib/theme';
import { cn } from '../lib/cn';
import { canPlayClips } from '../lib/video';
import { Specimen } from '../specimens/Specimen';

/**
 * The Work showroom. On a wide screen the section pins, and scrolling opens a
 * laptop: the lid swings up from closed while the view comes round from above.
 * Once it's open, the screen plays the chosen project's recorded visit, and the
 * arrows, keys, a swipe or the strip underneath slide the screen sideways to the
 * next site. "Try it here" puts the live site on the screen where it allows that.
 * On a phone it's a phone that tilts up as it scrolls in.
 *
 * Behind it, Specimen Atlas's contour lines, retinted to the page, slide as you
 * scroll: the one generative piece in this section, and it carries the travel.
 */

export type WorkFilter = { kind: 'category'; id: FilterId } | { kind: 'tool'; id: string };

interface Item {
  p: Project;
  hook: string;
  signature?: Signature;
}

// the newest and the résumé's four first, then everything else
const ALL: Item[] = [
  ...STAGE.map((s) => ({ p: PROJECTS.find((p) => p.id === s.id)!, hook: s.hook, signature: s.signature })).filter((x) => x.p),
  ...PROJECTS.filter((p) => !STAGE_IDS.includes(p.id)).map((p) => ({ p, hook: p.description.split('. ')[0] + '.' })),
];

const demo = (id: string, device: 'laptop' | 'phone', ext: 'mp4' | 'webp') => `/demos/${id}-${device}.${ext}`;
const still = (id: string, device: 'laptop' | 'phone') =>
  DEMO_IDS.has(id) ? demo(id, device, 'webp') : shotSrc(shotId(id), device === 'phone' ? 'mobile' : 'cover');
// one plain sentence beside the tabs, so the counts (8 picks, 15 projects, 18 sites) add up
const FILTER_NOTE: Record<string, string> = {
  best: 'My eight best. Everything else is one tab over.',
  ai: 'Products built on AI models and data.',
  crypto: 'On-chain products and token launch sites.',
  web: 'Games, guides and client sites.',
  all: `All 15 projects. The four token sites share one card, so ${LIVE_COUNT} live sites in all.`,
  tool: 'Only the projects built with this tool.',
};
const pad2 = (n: number) => String(n).padStart(2, '0');
const FALLBACK_MS = 8000; // a site without a clip still moves the tour on

// "fifteen" reads better than "15" in a heading
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const countWord = (n: number) => (n < WORDS.length ? WORDS[n] : String(n));

interface ShowroomProps {
  filter: WorkFilter;
  onFilter: (f: WorkFilter) => void;
  onOpenProject: (id: string, fromCard?: boolean) => void;
}

export function Showroom({ filter, onFilter, onOpenProject }: ShowroomProps) {
  const reduce = useReducedMotionPref();
  const wide = useMedia('(min-width: 1024px) and (min-height: 660px)');
  const laptopSize = useMedia('(min-width: 640px)');
  const pinned = wide && !reduce;
  const { theme } = useTheme();

  const section = useRef<HTMLElement>(null);
  const device = useRef<HTMLDivElement>(null);

  // ── which projects are in play ────────────────────────────────────────────
  const tool = filter.kind === 'tool' ? TOOLS.find((t) => t.id === filter.id) : undefined;
  const items = useMemo(
    () =>
      ALL.filter(({ p }) => (filter.kind === 'tool' ? !!tool && p.tags.some((t) => tool.aliases.includes(t)) : inFilter(p, filter.id))),
    [filter, tool],
  );
  const [currentId, setCurrentId] = useState(ALL[0].p.id);
  const index = Math.max(0, items.findIndex((x) => x.p.id === currentId));
  const item = items[index] ?? items[0];

  // ── the opening: scroll scrubs the lid on wide screens, entry scrubs it on small ones ──
  const { scrollYProgress: pinProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });
  const { scrollYProgress: entryProgress } = useScroll({ target: device, offset: ['start end', 'center center'] });
  const rawOpen = useTransform(() => (reduce ? 1 : pinned ? Math.min(1, pinProgress.get() / 0.62) : entryProgress.get()));
  const open = useSpring(rawOpen, { stiffness: 170, damping: 32, mass: 0.6 });
  const [opened, setOpened] = useState(false);
  useMotionValueEvent(open, 'change', (v) => setOpened((was) => (was ? v > 0.7 : v > 0.86)));
  // with reduced motion the laptop is simply open
  const isOpen = reduce || opened;

  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ── moving between projects ───────────────────────────────────────────────
  const [touring, setTouring] = useState(true);
  const [live, setLive] = useState(false);
  const [progress, setProgress] = useState(0);
  const go = useCallback(
    (next: number, byHand: boolean) => {
      if (!items.length) return;
      const i = (next + items.length) % items.length;
      setCurrentId(items[i].p.id);
      setProgress(0);
      setLive(false);
      if (byHand) setTouring(false);
    },
    [items],
  );
  const advance = useCallback(() => go(index + 1, false), [go, index]);

  // keys: left and right while the laptop is open and on screen (never over an open sheet or a text field)
  useEffect(() => {
    if (!isOpen || !inView) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (isTypingTarget(e.target) || document.querySelector('[aria-modal="true"]')) return;
      e.preventDefault();
      go(index + (e.key === 'ArrowRight' ? 1 : -1), true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, inView, go, index]);

  // where "show me the laptop" scrolls to: the point where it has just finished opening
  const reveal = useCallback(() => {
    const el = section.current;
    if (!el) return;
    if (pinned) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * 0.72, behavior: reduce ? 'auto' : 'smooth' });
    } else device.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }, [pinned, reduce]);
  useEffect(() => registerReveal(reveal), [reveal]);

  // the status board (and anything else) asks for a project by id
  useEffect(
    () =>
      registerStage((projectId) => {
        if (!ALL.some((x) => x.p.id === projectId)) return false;
        // stay on the standouts when it's one of them, otherwise show everything
        if (!items.some((x) => x.p.id === projectId)) onFilter({ kind: 'category', id: STAGE_IDS.includes(projectId) ? 'best' : 'all' });
        setCurrentId(projectId);
        setLive(false);
        setTouring(false);
        reveal();
        return true;
      }),
    [items, onFilter, reveal],
  );

  const playing = isOpen && inView && !live;
  const kind: 'laptop' | 'phone' = laptopSize ? 'laptop' : 'phone';

  const screen = (
    <ScreenTrack
      items={items}
      index={index}
      device={kind}
      playing={playing && !reduce}
      live={live && embeds(item?.p.id ?? '')}
      onProgress={setProgress}
      onDone={touring ? advance : undefined}
      onSwipe={(dir) => go(index + dir, true)}
      onTap={() => {
        if (kind === 'laptop' && item && embeds(item.p.id) && item.p.url && !live) {
          setLive(true);
          setTouring(false);
        }
      }}
      tapHint={kind === 'laptop' && !!item && embeds(item.p.id) && !live && isOpen}
    />
  );

  return (
    <section
      ref={section}
      id="work"
      aria-labelledby="work-title"
      className={cn('relative', pinned ? 'h-[205vh]' : 'section-y')}
    >
      <div className={cn(pinned && 'sticky top-0 flex h-[100svh] flex-col overflow-hidden pt-[var(--nav-h)]')}>
        {/* the desk: Specimen Atlas contour lines in the page's own ink, sliding as you scroll */}
        <div
          className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_78%,transparent)]"
          aria-hidden="true"
        >
          <Specimen
            key={theme}
            file="geo-topographic-desk"
            id="topographic-desk"
            className="absolute inset-0"
            palette={{ bg: 'var(--paper)', ink: 'var(--ink)', accent: 'var(--amber)' }}
            drive={pinned ? pinProgress : entryProgress}
            fps={24}
          />
        </div>

        <div className={cn('container-x relative', pinned && 'pt-5')}>
          <Header open={open} pinned={pinned} />
        </div>

        <div className={cn('container-x relative', pinned ? 'flex min-h-0 flex-1 items-center' : 'mt-10')}>
          <div className="grid w-full items-center gap-x-10 gap-y-8 lg:grid-cols-12">
            {/* the device and its arrows */}
            <div ref={device} className="relative lg:col-span-8">
              {kind === 'laptop' ? (
                <Laptop3D open={open} maxWidth={pinned ? 'min(100%, calc((100svh - var(--nav-h) - 410px) * 1.42))' : '100%'}>
                  {screen}
                </Laptop3D>
              ) : (
                <TiltPhone open={open}>{screen}</TiltPhone>
              )}
              <Arrows open={open} onPrev={() => go(index - 1, true)} onNext={() => go(index + 1, true)} />
            </div>

            {/* what's on the screen, and what to do with it */}
            <motion.div className="lg:col-span-4" style={{ opacity: useTransform(open, [0.62, 0.95], [0, 1]) }} aria-live="polite">
              {item && (
                <Info
                  item={item}
                  live={live}
                  canLive={kind === 'laptop' && embeds(item.p.id) && !!item.p.url}
                  onLive={() => {
                    setLive((v) => !v);
                    setTouring(false);
                  }}
                  onOpenProject={onOpenProject}
                />
              )}
            </motion.div>
          </div>
        </div>

        <motion.div
          className={cn('container-x relative', pinned ? 'pb-5' : 'mt-12')}
          style={{ opacity: useTransform(open, [0.7, 1], [0, 1]) }}
        >
          <Rail
            items={items}
            index={index}
            progress={playing ? progress : 1}
            filter={filter}
            toolLabel={tool?.label}
            onFilter={onFilter}
            onPick={(i) => go(i, true)}
            interactive={isOpen}
            touring={touring && !reduce}
            canTour={!reduce}
            onTour={() => setTouring((t) => !t)}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ── the heading: says what's here, then steps back once the laptop is open ─── */

function Header({ open, pinned }: { open: MotionValue<number>; pinned: boolean }) {
  const hint = useTransform(open, [0, 0.35], [1, 0]);
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
      <div>
        <p className="label-type flex items-center gap-2">
          <span className="h-px w-5 bg-amber" aria-hidden="true" />
          Work · {LIVE_COUNT} live sites
        </p>
        <h2 id="work-title" className="mt-3 text-[clamp(30px,1.4rem+1.9vw,50px)] leading-[1.02] font-[720] tracking-[-0.03em] text-ink [font-stretch:116%]">
          I&apos;ve shipped {countWord(LIVE_COUNT)}. Open one up.
        </h2>
      </div>
      {pinned && (
        <motion.p className="flex items-center gap-2 font-mono text-[12px] text-ink-3" style={{ opacity: hint }} aria-hidden="true">
          <Icon name="arrowDown" size={14} /> Scroll to open the laptop
        </motion.p>
      )}
    </div>
  );
}

// On a phone it's a phone, tipping up from lying flat as it scrolls in
function TiltPhone({ open, children }: { open: MotionValue<number>; children: React.ReactNode }) {
  const tilt = useTransform(open, [0, 1], [-58, 0]);
  const scale = useTransform(open, [0, 1], [0.86, 1]);
  return (
    <div className="mx-auto w-[min(64vw,270px)] [perspective:1400px]">
      <motion.div style={{ rotateX: tilt, scale, transformOrigin: '50% 100%' }}>
        <Phone label="A phone showing the selected project">{children}</Phone>
      </motion.div>
    </div>
  );
}

/* ── the screen: every project side by side, slid to the current one ────────── */

interface TrackProps {
  items: Item[];
  index: number;
  device: 'laptop' | 'phone';
  playing: boolean;
  live: boolean;
  onProgress: (v: number) => void;
  onDone?: () => void;
  onSwipe: (dir: 1 | -1) => void;
  /** a click or tap that wasn't a swipe */
  onTap: () => void;
  /** say on the screen that a click makes it live */
  tapHint: boolean;
}

function ScreenTrack({ items, index, device, playing, live, onProgress, onDone, onSwipe, onTap, tapHint }: TrackProps) {
  const reduce = useReducedMotionPref();
  const [drag, setDrag] = useState<{ x0: number; dx: number; id: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const onDown = (e: ReactPointerEvent) => {
    if (live || (e.pointerType === 'mouse' && e.button !== 0)) return;
    setDrag({ x0: e.clientX, dx: 0, id: e.pointerId });
  };
  const onMove = (e: ReactPointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    if (Math.abs(dx) > 6 && !box.current?.hasPointerCapture(e.pointerId)) box.current?.setPointerCapture(e.pointerId);
    setDrag({ ...drag, dx });
  };
  const onUp = () => {
    if (!drag) return;
    const w = box.current?.clientWidth ?? 1;
    if (Math.abs(drag.dx) > Math.min(80, w * 0.18)) onSwipe(drag.dx < 0 ? 1 : -1);
    else if (Math.abs(drag.dx) < 6) onTap();
    setDrag(null);
  };

  return (
    <div
      ref={box}
      className={cn('absolute inset-0 overflow-hidden', !live && 'cursor-grab touch-pan-y active:cursor-grabbing')}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => setDrag(null)}
    >
      <div
        className={cn('flex h-full', !drag && !reduce && 'transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]')}
        style={{ transform: `translateX(calc(${-index * 100}% + ${drag?.dx ?? 0}px))` }}
      >
        {items.map((it, i) => {
          const near = Math.abs(i - index) <= 1;
          return (
            <div key={it.p.id} className="relative h-full w-full shrink-0" aria-hidden={i !== index}>
              {i === index && live && it.p.url ? (
                <LiveSite url={it.p.url} name={it.p.name} />
              ) : i === index && DEMO_IDS.has(it.p.id) ? (
                <Clip key={`${it.p.id}-${device}`} id={it.p.id} device={device} play={playing} onProgress={onProgress} onDone={onDone} alt={`${it.p.name}, a recorded visit`} />
              ) : near ? (
                <StillWithTimer
                  src={still(it.p.id, device)}
                  alt={`${it.p.name}, the live site`}
                  timed={i === index && playing}
                  onProgress={onProgress}
                  onDone={onDone}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {tapHint && (
        <span className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-black/65 px-2.5 py-1.5 font-mono text-[11px] text-white backdrop-blur-sm">
          Click to use the live site
        </span>
      )}
      {!items.length && (
        <div className="absolute inset-0 grid place-items-center font-mono text-[12px] text-white/60">Nothing matches that filter.</div>
      )}
    </div>
  );
}

/** The live site at true desktop size, scaled down to fit the screen. */
function LiveSite({ url, name }: { url: string; name: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.5);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / 1280));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="absolute inset-0 bg-white">
      <iframe
        src={url}
        title={`${name}, the live site`}
        className="absolute top-0 left-0 origin-top-left border-0"
        style={{ width: 1280, height: 800, transform: `scale(${k})` }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
        allow="fullscreen; autoplay"
      />
    </div>
  );
}

interface ClipProps {
  id: string;
  device: 'laptop' | 'phone';
  play: boolean;
  alt: string;
  onProgress: (v: number) => void;
  onDone?: () => void;
}

/** One recorded visit: its poster first, the clip while it's playing; it loops unless the tour moves on. */
function Clip({ id, device, play, alt, onProgress, onDone }: ClipProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(() => !canPlayClips());
  useEffect(() => {
    const v = video.current;
    if (!v || failed) return;
    if (play) v.play().catch(() => {});
    else v.pause();
  }, [play, failed]);
  if (failed) return <StillWithTimer src={shotSrc(shotId(id), device === 'phone' ? 'mobile' : 'cover')} alt={alt} timed={play} onProgress={onProgress} onDone={onDone} />;
  // the poster is a plain image under the clip: browsers size a video's own poster inconsistently
  return (
    <>
    <img src={demo(id, device, 'webp')} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full object-cover object-top" />
    <video
      ref={video}
      className="pointer-events-none absolute inset-0 size-full object-cover object-top"
      muted
      playsInline
      preload="metadata"
      aria-label={alt}
      onError={() => setFailed(true)}
      onTimeUpdate={(e) => e.currentTarget.duration && onProgress(e.currentTarget.currentTime / e.currentTarget.duration)}
      onEnded={(e) => {
        if (onDone) onDone();
        else {
          e.currentTarget.currentTime = 0;
          e.currentTarget.play().catch(() => {});
        }
      }}
    >
      <source src={demo(id, device, 'mp4')} type="video/mp4" />
      <source src={`/demos/${id}-${device}.webm`} type="video/webm" onError={() => setFailed(true)} />
    </video>
    </>
  );
}

/** A still, and when it's the current one on a tour, a timer that moves the tour on. */
function StillWithTimer({ src, alt, timed, onProgress, onDone }: { src: string; alt: string; timed: boolean; onProgress: (v: number) => void; onDone?: () => void }) {
  useEffect(() => {
    if (!timed) return;
    const start = performance.now();
    const t = window.setInterval(() => {
      const k = (performance.now() - start) / FALLBACK_MS;
      onProgress(Math.min(1, k));
      if (k >= 1) {
        window.clearInterval(t);
        onDone?.();
      }
    }, 200);
    return () => window.clearInterval(t);
  }, [timed, onDone, onProgress]);
  return <img src={src} alt={alt} draggable={false} className="pointer-events-none absolute inset-0 size-full object-cover object-top" />;
}

/* ── the arrows, on the device's two sides ──────────────────────────────────── */

function Arrows({ open, onPrev, onNext }: { open: MotionValue<number>; onPrev: () => void; onNext: () => void }) {
  const opacity = useTransform(open, [0.7, 1], [0, 1]);
  const btn =
    'pointer-events-auto grid size-11 place-items-center rounded-xl bg-paper/90 text-ink shadow-[0_0_0_1px_var(--rule-2),var(--shadow-float)] backdrop-blur-sm transition-[background-color,transform] hover:bg-paper active:scale-95';
  return (
    <motion.div className="pointer-events-none absolute inset-x-0 top-[38%] z-10 flex -translate-y-1/2 justify-between max-lg:inset-x-[-6px] lg:-inset-x-6" style={{ opacity }}>
      <button type="button" onClick={onPrev} className={btn} aria-label="Previous project" title="Previous (← key)">
        <Icon name="arrowRight" size={18} className="rotate-180" />
      </button>
      <button type="button" onClick={onNext} className={btn} aria-label="Next project" title="Next (→ key)">
        <Icon name="arrowRight" size={18} />
      </button>
    </motion.div>
  );
}

/* ── the readout beside the device ───────────────────────────────────────────── */

function Info({
  item,
  live,
  canLive,
  onLive,
  onOpenProject,
}: {
  item: Item;
  live: boolean;
  canLive: boolean;
  onLive: () => void;
  onOpenProject: (id: string, fromCard?: boolean) => void;
}) {
  const { p } = item;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={p.id}
        initial={{ opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10, transition: { duration: 0.12 } }}
        transition={{ duration: 0.34, ease: ease.out }}
      >
        <div className="flex items-center gap-3 font-mono text-[11.5px] text-ink-3">
          <span>{p.kind}</span>
          {p.launched && (
            <>
              <span aria-hidden="true">·</span>
              <span>since {launchLabel(p.launched)}</span>
            </>
          )}
          <Status project={p} />
        </div>
        <h3 className="mt-3 text-[clamp(28px,2.8vw,40px)] leading-[1.02] font-[720] tracking-[-0.03em] text-ink [font-stretch:116%]">{p.name}</h3>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2 [text-wrap:pretty]">{item.hook}</p>
        {item.signature && <SignatureStrip signature={item.signature} className="mt-5" />}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {canLive && (
            <button type="button" onClick={onLive} className="btn btn-primary btn-sm">
              {live ? 'Back to the demo' : 'Try it here'}
              {!live && <HoverArrow />}
            </button>
          )}
          {p.url && (
            <a href={p.url} target="_blank" rel="noopener" className={cn('btn btn-sm', canLive ? 'btn-quiet' : 'btn-primary')}>
              Open it <Icon name="external" size={15} />
            </a>
          )}
          <button type="button" onClick={() => onOpenProject(p.id)} className="text-link inline-flex items-center gap-1.5 text-[14px]">
            The long version <HoverArrow />
          </button>
        </div>
        {live && p.url && (
          <p className="mt-4 flex items-center gap-2 font-mono text-[11.5px] text-ink-3">
            <span className="dot" data-state="up" aria-hidden="true" />
            Live: {hostOf(p.url)}, running inside this page.
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/** The site's own check from this visit, same as the status board. Only a site that answered is reported here. */
function Status({ project }: { project: Project }) {
  const board = useBoard();
  const target = PING_TARGETS.find((t) => t.projectId === project.id);
  const r = target ? board.results[target.key] : undefined;
  if (r?.state !== 'up') return null;
  return (
    <span className="ml-auto flex items-center gap-2">
      <span className="dot" data-state="up" aria-hidden="true" />
      <span className="tabular-nums">up · {r.ms} ms</span>
    </span>
  );
}

/* ── the strip: every project in a row you scroll sideways ───────────────────── */

interface RailProps {
  touring: boolean;
  canTour: boolean;
  onTour: () => void;
  items: Item[];
  index: number;
  progress: number;
  filter: WorkFilter;
  toolLabel?: string;
  onFilter: (f: WorkFilter) => void;
  onPick: (i: number) => void;
  interactive: boolean;
}

function Rail({ items, index, progress, filter, toolLabel, onFilter, onPick, interactive, touring, canTour, onTour }: RailProps) {
  const strip = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionPref();
  const fine = useFinePointer();
  const board = useBoard();
  // the card under the pointer, and where it sits on screen: the preview floats above it
  const [peek, setPeek] = useState<{ item: Item; x: number; y: number } | null>(null);
  const resultFor = (p: Project) => {
    const t = PING_TARGETS.find((x) => x.projectId === p.id);
    return t ? board.results[t.key] : undefined;
  };
  // keep the current project in view as the tour moves along
  useEffect(() => {
    const el = strip.current?.children[index] as HTMLElement | undefined;
    const box = strip.current;
    if (!el || !box) return;
    const left = el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2;
    box.scrollTo({ left, behavior: reduce ? 'auto' : 'smooth' });
  }, [index, reduce]);
  const count = (id: FilterId) => ALL.filter(({ p }) => inFilter(p, id)).length;

  return (
    <div className={cn(!interactive && 'pointer-events-none')}>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-t border-rule pt-3">
        {FILTERS.map((f) => {
          const on = filter.kind === 'category' && filter.id === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => onFilter({ kind: 'category', id: f.id })}
              className={cn('relative h-8 rounded-md px-2.5 text-[13px] font-[560] transition-colors', on ? 'text-ink' : 'text-ink-3 hover:text-ink')}
            >
              {on && <motion.span layoutId="rail-filter" transition={spring.crisp} className="absolute inset-0 rounded-md bg-paper-3 shadow-[inset_0_0_0_1px_var(--rule)]" aria-hidden="true" />}
              <span className="relative">
                {f.label} <span className="font-mono text-[11px] text-ink-3 tabular-nums">{count(f.id)}</span>
              </span>
            </button>
          );
        })}
        <span className="ml-auto hidden text-[12.5px] text-ink-3 xl:inline">{FILTER_NOTE[filter.kind === 'category' ? filter.id : 'tool']}</span>
        <span className="flex items-center gap-2 max-xl:ml-auto xl:ml-4">
          <span className="font-mono text-[12px] text-ink-2 tabular-nums" aria-live="polite">
            {pad2(index + 1)} / {pad2(items.length)}
          </span>
          <button
            type="button"
            onClick={onTour}
            disabled={!canTour}
            aria-pressed={touring}
            aria-label={touring ? 'Pause the auto-play' : 'Start the auto-play'}
            title={touring ? 'Pause the auto-play' : 'Start the auto-play'}
            className="grid size-8 place-items-center rounded-md text-ink-2 shadow-[inset_0_0_0_1px_var(--rule-2)] transition-colors hover:bg-paper-3 hover:text-ink disabled:opacity-40"
          >
            <Icon name={touring ? 'pause' : 'play'} size={13} />
          </button>
        </span>
        {toolLabel && (
          <button
            type="button"
            onClick={() => onFilter({ kind: 'category', id: 'all' })}
            className="relative ml-1 flex h-8 items-center gap-1.5 rounded-md bg-amber-wash px-2.5 text-[13px] font-[560] text-ink shadow-[inset_0_0_0_1px_var(--amber)]"
            aria-label={`Built with ${toolLabel}. Clear this filter`}
          >
            Built with {toolLabel}
            <Icon name="close" size={13} className="text-ink-2" />
          </button>
        )}
      </div>
      <div
        ref={strip}
        role="list"
        aria-label="Every project"
        className="no-scrollbar mt-2 flex snap-x gap-1 overflow-x-auto scroll-smooth pb-1 [mask-image:linear-gradient(to_right,black_92%,transparent)]"
      >
        {items.map((it, i) => {
          const on = i === index;
          return (
            <button
              key={it.p.id}
              type="button"
              role="listitem"
              aria-current={on ? 'true' : undefined}
              onClick={() => onPick(i)}
              onPointerEnter={(e) => {
                if (!fine || e.pointerType !== 'mouse') return;
                const r = e.currentTarget.getBoundingClientRect();
                setPeek({ item: it, x: r.left + r.width / 2, y: r.top });
              }}
              onPointerLeave={() => setPeek(null)}
              className={cn('group relative w-[10.5rem] shrink-0 snap-start rounded-md px-3 pt-2.5 pb-3 text-left transition-colors', on ? 'bg-paper-2' : 'hover:bg-paper-2/70')}
            >
              <span className="flex items-center justify-between font-mono text-[10.5px] text-ink-3 tabular-nums">
                {pad2(i + 1)}
                <span className="dot" data-state={resultFor(it.p)?.state ?? 'pending'} aria-hidden="true" />
              </span>
              <span className={cn('mt-0.5 block truncate text-[14px] font-[620] tracking-[-0.01em] [font-stretch:106%]', on ? 'text-ink' : 'text-ink-2 group-hover:text-ink')}>
                {it.p.name}
              </span>
              <span className="block truncate text-[12px] text-ink-3">{it.p.kind}</span>
              <span className="absolute inset-x-3 bottom-1 h-[2px] overflow-hidden rounded-full bg-rule" aria-hidden="true">
                {on && <span className="block h-full origin-left bg-amber transition-transform duration-300 ease-linear" style={{ transform: `scaleX(${progress})` }} />}
              </span>
            </button>
          );
        })}
      </div>

      {/* the preview: what the site looks like, and how fast it just answered your browser */}
      <AnimatePresence>
        {peek && (
          <motion.div
            key="peek"
            aria-hidden="true"
            className="pointer-events-none fixed z-40 w-[264px] overflow-hidden rounded-lg bg-paper shadow-[0_0_0_1px_var(--rule),var(--shadow-float)]"
            style={{ left: peek.x, top: peek.y, x: '-50%', y: 'calc(-100% - 12px)' }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
            transition={{ ...spring.crisp, opacity: { duration: 0.14 } }}
          >
            <img src={still(peek.item.p.id, 'laptop')} alt="" className="aspect-[16/10] w-full object-cover object-top" />
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="truncate text-[13px] font-[620] text-ink">{peek.item.p.name}</span>
              <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-ink-3">
                {peek.item.p.url && hostOf(peek.item.p.url)}
                {resultFor(peek.item.p)?.state === 'up' && <span className="text-ink-2">· {resultFor(peek.item.p)?.ms} ms</span>}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
