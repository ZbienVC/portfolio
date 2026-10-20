import type { MotionValue } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * Runs one Specimen Atlas style inside a box, following the Atlas's own module
 * contract (src/CONTRACT.md in specimen-atlas): init(host, api) returns
 * { frame(t, dt), resize(w, h), destroy() }, and the page owns the animation
 * loop. Here the loop only runs while the box is on screen and the tab is
 * visible; with reduced motion it draws a short burst of frames and holds still.
 */

interface SpecimenApi {
  pointer: { x: number; y: number; nx: number; ny: number; down: boolean; inside: boolean };
  onClick: (fn: (p: { x: number; y: number; nx: number; ny: number }) => void) => void;
  reduced: boolean;
  /** the page's colours for styles that take them, as 0-255 RGB */
  palette?: Record<string, [number, number, number]>;
  /** a live 0..1 value from the page (scroll progress), for styles that follow it */
  drive?: { value: number };
}
interface SpecimenInstance {
  frame?: (t: number, dt: number) => void;
  resize?: (w: number, h: number) => void;
  destroy?: () => void;
}
interface SpecimenDef {
  id: string;
  init: (host: HTMLElement, api: SpecimenApi) => SpecimenInstance;
}
declare global {
  interface Window {
    SPECIMENS?: SpecimenDef[];
  }
}

const LOADERS = import.meta.glob('./modules/*.js');

async function load(file: string, id: string): Promise<SpecimenDef | undefined> {
  const find = () => window.SPECIMENS?.find((s) => s.id === id);
  if (find()) return find();
  const loader = LOADERS[`./modules/${file}.js`];
  if (!loader) return undefined;
  await loader();
  return find();
}

interface SpecimenProps {
  file: string;
  id: string;
  className?: string;
  /** shown under the art while it loads, and kept if it fails */
  fallback?: ReactNode;
  /** pause regardless of visibility (a closed drawer, say) */
  paused?: boolean;
  /** CSS colours handed to the style (oklch and variables resolved here); remount to change them */
  palette?: Record<string, string>;
  /** a 0..1 motion value the style can follow, like a section's scroll progress */
  drive?: MotionValue<number>;
}

/** Any CSS colour, oklch or a var() included, as 0-255 RGB. */
function toRgb(css: string): [number, number, number] {
  const probe = document.createElement('span');
  probe.style.color = css;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  const g = c.getContext('2d')!;
  g.fillStyle = resolved;
  g.fillRect(0, 0, 1, 1);
  const [r, gg, b] = g.getImageData(0, 0, 1, 1).data;
  return [r, gg, b];
}

export function Specimen({ file, id, className, fallback, paused = false, palette, drive }: SpecimenProps) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'running' | 'failed'>('idle');
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let inst: SpecimenInstance | null = null;
    let raf = 0;
    let visible = false;
    let dead = false;
    let t = 0;
    let last = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stillFrames = reduced ? 45 : Infinity; // reduced motion: settle into a still picture
    const clicks: ((p: { x: number; y: number; nx: number; ny: number }) => void)[] = [];
    const pointer = { x: 0, y: 0, nx: 0.5, ny: 0.5, down: false, inside: false };
    const driven = { value: drive?.get() ?? 0 };
    const stopDrive = drive?.on('change', (v) => (driven.value = v));
    const colours = palette ? Object.fromEntries(Object.entries(palette).map(([k, v]) => [k, toRgb(v)])) : undefined;

    const where = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      return { x, y, nx: r.width ? x / r.width : 0.5, ny: r.height ? y / r.height : 0.5 };
    };
    const onMove = (e: PointerEvent) => Object.assign(pointer, where(e), { inside: true });
    const onLeave = () => Object.assign(pointer, { inside: false, down: false });
    const onDown = (e: PointerEvent) => Object.assign(pointer, where(e), { down: true, inside: true });
    const onUp = () => (pointer.down = false);
    const onClick = (e: MouseEvent) => clicks.forEach((fn) => fn(where(e as PointerEvent)));
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('click', onClick);

    const loop = (now: number) => {
      raf = 0;
      if (dead || !inst) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      t += dt;
      try {
        inst.frame?.(t, dt);
      } catch {
        setState('failed');
        return;
      }
      if (--stillFrames <= 0) return;
      schedule();
    };
    const schedule = () => {
      if (!raf && visible && !pausedRef.current && !document.hidden && stillFrames > 0) raf = requestAnimationFrame(loop);
    };

    const start = async () => {
      const def = await load(file, id).catch(() => undefined);
      if (dead) return;
      if (!def) return setState('failed');
      try {
        inst = def.init(el, { pointer, onClick: (fn) => clicks.push(fn), reduced, palette: colours, drive: driven });
        setState('running');
        last = 0;
        schedule();
      } catch {
        setState('failed');
      }
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !inst && state === 'idle') start();
        else if (visible) {
          last = 0;
          schedule();
        }
      },
      { rootMargin: '120px' },
    );
    io.observe(el);
    const ro = new ResizeObserver(() => {
      try {
        inst?.resize?.(el.clientWidth, el.clientHeight);
      } catch {
        /* a style that can't resize keeps its old size */
      }
      if (reduced) {
        stillFrames = 3;
        schedule();
      }
    });
    ro.observe(el);
    const onVis = () => {
      last = 0;
      schedule();
    };
    document.addEventListener('visibilitychange', onVis);
    const poll = window.setInterval(schedule, 400); // picks the loop back up after `paused` clears

    return () => {
      dead = true;
      stopDrive?.();
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onVis);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('click', onClick);
      try {
        inst?.destroy?.();
      } catch {
        /* nothing left to free */
      }
      el.replaceChildren();
    };
    // the box is set up once per style; `state` is read only as a starting flag
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, id]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {state !== 'running' && <div className="absolute inset-0">{fallback}</div>}
      <div ref={host} className={cn('absolute inset-0 transition-opacity duration-700', state === 'running' ? 'opacity-100' : 'opacity-0')} />
    </div>
  );
}
