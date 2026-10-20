import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HoverArrow } from '../components/Icon';
import { UNITS, launchLabel, projectById, type Unit } from '../lib/data';
import { useFinePointer, useReducedMotionPref } from '../lib/hooks';
import { cn } from '../lib/cn';
import type { SceneColors, StackScene } from './StackScene';

/**
 * The Stack, in the page: the 3D scene on the left, and beside it a panel that
 * reads out whatever block the pointer is on (or the one you tapped). The scene's
 * code (three.js and the physics) loads only when the Stack comes near the screen.
 */

const read = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const colors = (): SceneColors => ({
  paper: read('--paper'),
  paper2: read('--paper-2'),
  paper3: read('--paper-3'),
  ink: read('--ink'),
  ink3: read('--ink-3'),
  rule: read('--rule'),
  amber: read('--amber'),
});

interface StackProps {
  /** which units stay solid; the rest go ghostly and can't be picked */
  match: ((u: Unit) => boolean) | null;
  onOpenProject: (id: string) => void;
  /** the scene couldn't start (no WebGL): show the list instead */
  onUnavailable: () => void;
}

export function Stack({ match, onOpenProject, onUnavailable }: StackProps) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<StackScene | null>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotionPref();
  const [ready, setReady] = useState(false);
  const [standing, setStanding] = useState(true);
  const [hover, setHover] = useState<{ unit: Unit; x: number; y: number } | null>(null);
  const [picked, setPicked] = useState<Unit | null>(null);
  const [ticks, setTicks] = useState<{ label: string; x: number; y: number }[]>([]);
  const finePointer = useRef(fine);
  useEffect(() => {
    finePointer.current = fine;
  }, [fine]);
  const opener = useRef(onOpenProject);
  useEffect(() => {
    opener.current = onOpenProject;
  }, [onOpenProject]);

  // start the scene once it's close to the screen
  useEffect(() => {
    const el = box.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    let disposed = false;
    let started = false;
    let entered = false;
    const io = new IntersectionObserver(
      async ([e]) => {
        scene.current?.setVisible(e.isIntersecting);
        if (e.isIntersecting && scene.current && !entered && e.intersectionRatio > 0.3) {
          entered = true;
          scene.current.playEntrance();
        }
        if (!e.isIntersecting || started) return;
        started = true;
        try {
          const { StackScene } = await import('./StackScene');
          await document.fonts.ready;
          if (disposed) return;
          const s = new StackScene(
            cv,
            UNITS,
            colors(),
            {
              onHover: (unit, at) => setHover(unit && at ? { unit, ...at } : null),
              onPick: (unit) => {
                // a mouse click opens it; a tap reads it out in the panel first
                if (finePointer.current) opener.current(unit.projectId);
                else setPicked(unit);
              },
              onStanding: setStanding,
              onTicks: setTicks,
            },
            window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          );
          scene.current = s;
          s.resize(cv.clientWidth, cv.clientHeight);
          s.setVisible(true);
          setReady(true);
          if (!entered && e.intersectionRatio > 0.3) {
            entered = true;
            s.playEntrance();
          }
        } catch {
          onUnavailable();
        }
      },
      { rootMargin: '200px 0px', threshold: [0, 0.3] },
    );
    io.observe(el);
    const ro = new ResizeObserver(() => scene.current?.resize(cv.clientWidth, cv.clientHeight));
    ro.observe(cv);
    // the theme switch repaints the paper and the blocks
    const mo = new MutationObserver(() => scene.current?.setColors(colors()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      disposed = true;
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      scene.current?.dispose();
      scene.current = null;
    };
    // the scene is built once; callbacks reach the latest props through refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scene.current?.setFilter(match);
  }, [match, ready]);

  const shown = hover?.unit ?? picked;
  const first = UNITS[0];
  const latest = UNITS[UNITS.length - 1];
  const solid = useMemo(() => (match ? UNITS.filter(match).length : UNITS.length), [match]);

  return (
    <div ref={box} className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="relative lg:col-span-8">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-paper-2 shadow-[inset_0_0_0_1px_var(--rule)] sm:aspect-[3/2]">
          <canvas
            ref={canvas}
            className={cn('absolute inset-0 size-full touch-pan-y transition-opacity duration-500', ready ? 'opacity-100' : 'opacity-0')}
            aria-label={`A stack of ${UNITS.length} blocks, one for each live site, oldest at the bottom. Use the list view for the same projects as links.`}
            role="img"
          />
          {!ready && (
            <div className="absolute inset-0 grid place-items-center font-mono text-[12px] text-ink-3" aria-hidden="true">
              Stacking {UNITS.length} blocks…
            </div>
          )}

          {/* month ticks up the side of the standing tower */}
          <AnimatePresence>
            {standing &&
              ticks.map((t) => (
                <motion.span
                  key={t.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  className="pointer-events-none absolute flex -translate-x-full -translate-y-1/2 items-center gap-1.5 pr-1 font-mono text-[10.5px] whitespace-nowrap text-ink-3"
                  style={{ left: t.x, top: t.y }}
                  aria-hidden="true"
                >
                  {t.label}
                  <span className="h-px w-3 bg-ink-3/60" />
                </motion.span>
              ))}
          </AnimatePresence>

          {/* the block under the pointer, named right above it */}
          {hover && fine && (
            <span
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-md bg-ink px-2.5 py-1 text-[12.5px] font-[600] whitespace-nowrap text-paper shadow-[var(--shadow-panel)]"
              style={{ left: hover.x, top: hover.y }}
              aria-hidden="true"
            >
              {hover.unit.name} · open
            </span>
          )}

          <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between gap-3">
            <span className="hidden font-mono text-[11px] text-ink-3 sm:block">{fine ? 'Drag a block · click to open' : 'Drag a block · tap to read it'}</span>
            <button
              type="button"
              onClick={() => {
                setPicked(null);
                if (standing) scene.current?.knock();
                else scene.current?.restack();
              }}
              disabled={!ready}
              className="btn btn-sm btn-quiet ml-auto bg-paper"
            >
              {standing ? (reduce ? 'Spread them out' : 'Knock it over') : 'Stack it back'}
            </button>
          </div>
        </div>
      </div>

      {/* the readout: what the block is, or what the stack is when nothing is chosen */}
      <aside className="lg:col-span-4" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {shown ? (
            <Readout key={shown.key} unit={shown} onOpen={() => onOpenProject(shown.projectId)} />
          ) : (
            <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
              <p className="font-mono text-[11.5px] text-ink-3">How to read it</p>
              <p className="mt-3 text-[20px] leading-snug font-[620] tracking-[-0.015em] text-ink [font-stretch:106%] [text-wrap:balance]">
                One block for each live site. The oldest is at the bottom, the newest on top.
              </p>
              <dl className="mt-6 grid grid-cols-2 border-y border-rule">
                <div className="flex flex-col-reverse py-3">
                  <dt className="mt-1 text-[12.5px] text-ink-3">at the bottom, {launchLabel(first.launched)}</dt>
                  <dd className="text-[15px] font-[620] text-ink">{first.name}</dd>
                </div>
                <div className="flex flex-col-reverse border-l border-rule py-3 pl-4">
                  <dt className="mt-1 text-[12.5px] text-ink-3">on top, {launchLabel(latest.launched)}</dt>
                  <dd className="text-[15px] font-[620] text-ink">{latest.name}</dd>
                </div>
              </dl>
              <p className="mt-4 font-mono text-[12px] text-ink-3 tabular-nums">
                {solid === UNITS.length ? `${UNITS.length} blocks` : `${solid} of ${UNITS.length} blocks match`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </div>
  );
}

function Readout({ unit, onOpen }: { unit: Unit; onOpen: () => void }) {
  const p = projectById(unit.projectId);
  if (!p) return null;
  const site = p.collection?.find((s) => s.url === unit.url);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ duration: 0.22 }}
    >
      <p className="font-mono text-[11.5px] text-ink-3">
        {p.kind} · live since {launchLabel(unit.launched)}
      </p>
      <h4 className="mt-2 text-[28px] leading-[1.05] font-[720] tracking-[-0.025em] text-ink [font-stretch:114%]">{unit.name}</h4>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{site?.blurb ?? p.short}</p>
      <button type="button" onClick={onOpen} className="btn btn-primary btn-sm mt-5">
        Open {site ? p.name : unit.name}
        <HoverArrow />
      </button>
    </motion.div>
  );
}
