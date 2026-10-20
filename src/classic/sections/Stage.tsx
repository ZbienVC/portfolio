import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Laptop, Phone } from '../components/Devices';
import { HoverArrow, Icon } from '../components/Icon';
import { SignatureStrip } from '../components/Signature';
import { PING_TARGETS, STAGE, embeds, hostOf, launchLabel, projectById, shotSrc, type Project, type StageItem } from '../lib/data';
import { useBoard } from '../lib/pings';
import { useReducedMotionPref } from '../lib/hooks';
import { registerStage } from '../lib/launch';
import { ease } from '../lib/motion';
import { cn } from '../lib/cn';

/**
 * The Work stage: eight projects, running. Each has two recorded demos (a scripted
 * visit at laptop size and at phone size). The stage plays through them on its own
 * while it's on screen, the tab's underline filling as the clip plays. Picking a
 * tab takes over and stops the tour. "Try it here" swaps the laptop's demo for the
 * live site, where the site allows being shown inside another page.
 */

const demo = (id: string, device: 'laptop' | 'phone', ext: 'mp4' | 'webp') => `/demos/${id}-${device}.${ext}`;
const FALLBACK_MS = 9000;
const ITEMS = STAGE.map((s) => ({ s, p: projectById(s.id) })).filter((x): x is { s: StageItem; p: Project } => !!x.p); // a stage item with no clip still moves on

interface StageProps {
  onOpenProject: (id: string, fromCard?: boolean) => void;
}

export function Stage({ onOpenProject }: StageProps) {
  const items = ITEMS;
  const reduce = useReducedMotionPref();
  const [index, setIndex] = useState(0);
  const [touring, setTouring] = useState(true);
  const [live, setLive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [inView, setInView] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const { s, p } = items[index];
  // clips run while the stage is on screen; the tour only decides whether a finished clip moves on
  const running = inView && !reduce && !live;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = useCallback(
    (next: number, byHand: boolean) => {
      setIndex((next + items.length) % items.length);
      setProgress(0);
      setLive(false);
      if (byHand) setTouring(false);
    },
    [items.length],
  );
  const advance = useCallback(() => go(index + 1, false), [go, index]);

  // the status board (and anything else) can ask the stage to play a project
  useEffect(
    () =>
      registerStage((projectId) => {
        const i = items.findIndex((x) => x.p.id === projectId);
        if (i < 0) return false;
        go(i, true);
        root.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        requestAnimationFrame(() => tabs.current[i]?.focus({ preventScroll: true }));
        return true;
      }),
    [items, go, reduce],
  );

  const onTabKey = (e: ReactKeyboardEvent, i: number) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + items.length) % items.length;
    go(next, true);
    tabs.current[next]?.focus();
  };

  return (
    <div ref={root} className="mt-10 lg:mt-12">
      {/* the tabs: one per project, the active one's underline is the clip's progress */}
      <div className="flex items-center gap-3">
        <div
          role="tablist"
          aria-label="Projects on the stage"
          className="no-scrollbar -mx-[calc(var(--gutter)+var(--inset))] flex flex-1 gap-1 overflow-x-auto px-[calc(var(--gutter)+var(--inset))] lg:mx-0 lg:grid lg:grid-cols-8 lg:gap-0 lg:overflow-visible lg:px-0"
        >
          {items.map(({ p: tp }, i) => {
            const on = i === index;
            return (
              <button
                key={tp.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`stage-tab-${tp.id}`}
                aria-selected={on}
                aria-controls="stage-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => go(i, true)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={cn(
                  'group relative shrink-0 px-3 pt-2 pb-3 text-left transition-colors lg:px-0 lg:pr-3',
                  on ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
                )}
              >
                <span className="block font-mono text-[10.5px] tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <span className="mt-0.5 block text-[14.5px] font-[620] tracking-[-0.01em] whitespace-nowrap [font-stretch:106%]">{tp.name}</span>
                <span className="absolute inset-x-3 bottom-0 h-[2px] overflow-hidden rounded-full bg-rule lg:right-3 lg:left-0" aria-hidden="true">
                  {on && (
                    <span
                      className="block h-full origin-left bg-amber transition-transform duration-300 ease-linear"
                      style={{ transform: `scaleX(${running ? progress : 1})` }}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setTouring((t) => !t)}
          className="icon-btn hidden shrink-0 lg:grid"
          aria-label={touring ? 'Stop the tour' : 'Play the tour'}
          title={touring ? 'Stop the tour' : 'Play the tour'}
          disabled={reduce}
        >
          <Icon name={touring && !reduce ? 'pause' : 'play'} size={16} />
        </button>
      </div>

      <div
        id="stage-panel"
        role="tabpanel"
        aria-labelledby={`stage-tab-${p.id}`}
        className="mt-6 grid items-end gap-x-10 gap-y-8 lg:mt-8 lg:grid-cols-12"
      >
        {/* the devices, standing on one line */}
        <div className="relative lg:col-span-8">
          <div className="flex items-end justify-center gap-[3.5%]">
            <Laptop className="hidden flex-1 lg:block" label={`${p.name} at laptop size`}>
              {live && embeds(p.id) && p.url ? (
                <iframe
                  key={`live-${p.id}`}
                  src={p.url}
                  title={`${p.name}, the live site`}
                  className="absolute inset-0 size-full border-0 bg-white"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
                  allow="fullscreen; autoplay"
                />
              ) : (
                <Clip
                  key={`laptop-${p.id}`}
                  id={p.id}
                  device="laptop"
                  play={running}
                  onProgress={setProgress}
                  onDone={touring ? advance : undefined}
                  alt={`${p.name}, a recorded visit at laptop size`}
                />
              )}
            </Laptop>
            <Phone className="w-[min(56vw,250px)] shrink-0 lg:w-[22%]" label={`${p.name} at phone size`}>
              <Clip
                key={`phone-${p.id}`}
                id={p.id}
                device="phone"
                play={inView && !reduce}
                // on a phone the laptop is hidden, so the phone's clip keeps the time
                drivesTour="phone-only"
                onProgress={setProgress}
                onDone={touring ? advance : undefined}
                alt={`${p.name}, a recorded visit on a phone`}
              />
            </Phone>
          </div>
          {live && (
            <p className="mt-4 hidden items-center justify-center gap-3 font-mono text-[12px] text-ink-3 lg:flex">
              <span className="dot" data-state="up" aria-hidden="true" />
              Live: {p.url && hostOf(p.url)}. It runs here exactly as it does on its own site.
            </p>
          )}
        </div>

        {/* what it is, and what to do next */}
        <div className="lg:col-span-4" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }}
              transition={{ duration: 0.38, ease: ease.out }}
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
              <h3 className="mt-3 text-[clamp(30px,3.4vw,42px)] leading-[1.02] font-[720] tracking-[-0.03em] text-ink [font-stretch:116%]">{p.name}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-ink-2 [text-wrap:pretty]">{s.hook}</p>
              <SignatureStrip signature={s.signature} className="mt-5" />
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {embeds(p.id) && p.url ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLive((v) => !v);
                      setTouring(false);
                    }}
                    className="btn btn-primary btn-sm max-lg:hidden"
                  >
                    {live ? 'Back to the demo' : 'Try it here'}
                    {!live && <HoverArrow />}
                  </button>
                ) : null}
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener"
                    className={cn('btn btn-sm', embeds(p.id) ? 'btn-quiet lg:hidden' : 'btn-primary')}
                  >
                    Open it <Icon name="external" size={15} />
                  </a>
                )}
                <button type="button" onClick={() => onOpenProject(p.id)} className="text-link inline-flex items-center gap-1.5 text-[14px]">
                  The long version <HoverArrow />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

interface ClipProps {
  id: string;
  device: 'laptop' | 'phone';
  play: boolean;
  alt: string;
  onProgress: (v: number) => void;
  /** called when the clip ends; without it the clip loops */
  onDone?: () => void;
  /** which clip reports progress: the laptop's on wide screens, the phone's when the laptop is hidden */
  drivesTour?: 'phone-only';
}

/** One recorded demo: poster first, the clip once it's on screen, the cover screenshot if there's no clip. */
function Clip({ id, device, play, alt, onProgress, onDone, drivesTour }: ClipProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  // exactly one visible clip keeps the tour's time
  const drives = drivesTour === 'phone-only' ? !wide : wide;

  useEffect(() => {
    const v = video.current;
    if (!v || failed) return;
    if (play) v.play().catch(() => {});
    else v.pause();
  }, [play, failed]);

  // no clip: hold the still for a while, then move on
  useEffect(() => {
    if (!failed || !play || !drives) return;
    const start = performance.now();
    const t = window.setInterval(() => {
      const k = (performance.now() - start) / FALLBACK_MS;
      onProgress(Math.min(1, k));
      if (k >= 1) onDone?.();
    }, 250);
    return () => window.clearInterval(t);
  }, [failed, play, drives, onDone, onProgress]);

  if (failed) {
    const still = device === 'phone' ? shotSrc(id, 'mobile') : shotSrc(id);
    return <img src={still} alt={alt} className="absolute inset-0 size-full object-cover object-top" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />;
  }
  return (
    <video
      ref={video}
      className="absolute inset-0 size-full object-cover object-top"
      src={demo(id, device, 'mp4')}
      poster={demo(id, device, 'webp')}
      muted
      playsInline
      preload="none"
      aria-label={alt}
      onError={() => setFailed(true)}
      onTimeUpdate={(e) => drives && e.currentTarget.duration && onProgress(e.currentTarget.currentTime / e.currentTarget.duration)}
      onEnded={(e) => {
        if (drives && onDone) onDone();
        else {
          e.currentTarget.currentTime = 0;
          e.currentTarget.play().catch(() => {});
        }
      }}
    />
  );
}

/** The site's own check from this visit, same as the status board: it answered your browser, this fast. */
function Status({ project }: { project: Project }) {
  const board = useBoard();
  const target = PING_TARGETS.find((t) => t.projectId === project.id);
  if (!target) return null;
  const r = board.results[target.key];
  const state = r?.state ?? 'pending';
  const said = state === 'up' ? `up · ${r?.ms} ms` : state === 'down' ? 'not answering' : 'checking';
  return (
    <span className="ml-auto flex items-center gap-2">
      <span className="dot" data-state={state} aria-hidden="true" />
      <span className="tabular-nums">{said}</span>
    </span>
  );
}

