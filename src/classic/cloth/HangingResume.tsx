import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { HoverArrow } from '../components/Icon';
import { PROFILE } from '../lib/data';
import { useReducedMotionPref } from '../lib/hooks';
import { cn } from '../lib/cn';
import type { ClothScene } from './ClothScene';

const PAGE = '/resume-page.webp';

/**
 * The résumé, hanging on a line. Pull it down and it comes off its clips and
 * the PDF opens. The button under it does the same thing in one click, and
 * without WebGL the page itself is shown as a picture with the same button.
 */
export function HangingResume() {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<ClothScene | null>(null);
  const reduce = useReducedMotionPref();
  const [ready, setReady] = useState(false);
  const [flat, setFlat] = useState(false);
  const [tension, setTension] = useState(0);

  // the PDF opens from the pointer's own release, so pop-up blockers let it through
  const open = () => window.open(PROFILE.resumePdfNamed, '_blank', 'noopener');

  useEffect(() => {
    const el = box.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    let disposed = false;
    let started = false;
    const io = new IntersectionObserver(
      async ([e]) => {
        scene.current?.setVisible(e.isIntersecting);
        if (!e.isIntersecting || started) return;
        started = true;
        try {
          const { ClothScene } = await import('./ClothScene');
          if (disposed) return;
          const s = new ClothScene(
            cv,
            PAGE,
            { onPulled: () => {}, onTension: setTension },
            window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          );
          scene.current = s;
          s.resize(cv.clientWidth, cv.clientHeight);
          s.setVisible(true);
          setReady(true);
        } catch {
          setFlat(true);
        }
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(el);
    const ro = new ResizeObserver(() => scene.current?.resize(cv.clientWidth, cv.clientHeight));
    ro.observe(cv);
    return () => {
      disposed = true;
      io.disconnect();
      ro.disconnect();
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  // pointer handling lives here so the pull can open the PDF inside the user's own gesture
  const lastX = useRef(0);
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!scene.current?.grabAt(e.clientX, e.clientY)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = scene.current;
    if (!s) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) s.moveTo(e.clientX, e.clientY);
    else if (e.pointerType === 'mouse') s.brush(e.clientX, e.clientY, e.clientX - lastX.current);
    lastX.current = e.clientX;
  };
  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (tension >= 0.98) {
      scene.current?.drop();
      open();
    } else scene.current?.release();
  };

  return (
    <div ref={box} className="relative">
      <div className="relative aspect-[4/5] w-full max-lg:mx-auto max-lg:max-w-[340px]">
        {flat ? (
          <img src={PAGE} alt={`${PROFILE.name}'s résumé, one page`} className="absolute inset-[6%_14%] w-[72%] rounded-sm shadow-[0_24px_48px_-20px_rgb(0_0_0/0.7)]" />
        ) : (
          <canvas
            ref={canvas}
            role="img"
            aria-label={`${PROFILE.name}'s résumé, hanging on a line. Pull it down to open the PDF, or use the button below.`}
            className={cn('absolute inset-0 size-full touch-none transition-opacity duration-700', ready ? 'opacity-100' : 'opacity-0', reduce ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing')}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={() => scene.current?.release()}
            onClick={reduce ? open : undefined}
          />
        )}
        {/* the handle: says it's pullable before anyone tries; it steps aside once the pull starts */}
        {!flat && ready && !reduce && tension < 0.04 && (
          <motion.span
            className="pointer-events-none absolute bottom-[9%] left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-md bg-term-amber px-2.5 py-1 font-mono text-[11px] font-[600] text-term shadow-[0_8px_18px_-8px_var(--term-amber)]"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          >
            ↓ Pull
          </motion.span>
        )}
        {/* how far there is to go: a line that fills as you pull */}
        {!flat && (
          <div className="pointer-events-none absolute inset-x-[22%] bottom-[2%] h-[3px] overflow-hidden rounded-full bg-term-rule" aria-hidden="true">
            <span className="block h-full origin-left bg-term-amber transition-transform duration-75" style={{ transform: `scaleX(${tension})` }} />
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <span className="font-mono text-[11.5px] text-term-dim">{reduce || flat ? 'One page, as a PDF' : tension > 0.05 ? 'Keep pulling…' : 'Pull it down to open it'}</span>
        <button type="button" onClick={open} className="inline-flex items-center gap-1.5 text-[14px] font-[600] text-term-amber hover:text-term-ink">
          Open the résumé <HoverArrow />
        </button>
      </div>
    </div>
  );
}
