import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { boxOf, build, cancel, generate, hide, linesOf, play, showNow, toothTile, type Geometry, type InkMark, type Line, type MarkType } from '../engines/ink';
import { useShowWork } from '../lib/show-work';
import { cn } from '../lib/cn';

/*
 * "Show the work" marks. Wrap anything worth explaining; while the switch is on,
 * a pencil marks it (seeded, so the same wobble every visit) and a margin note
 * says how it was built. Everything here is decorative (aria-hidden) except the
 * note text, which stays readable.
 */

// One pencil for the whole page: marks that come into view together draw one
// after another, a beat apart, like a hand working down a workpaper.
let pencilFree = 0;
const START_DELAY = 260;
const GAP = 240;

const PEN_WIDTH = { graphite: 1.75, red: 1.85 } as const;
type Pen = keyof typeof PEN_WIDTH;

let fontRequested = false;
function loadNoteFont() {
  if (fontRequested) return;
  fontRequested = true;
  import('@fontsource-variable/caveat');
}

interface InkProps {
  /** seed key: same id, same marks on every visit */
  id: string;
  type: MarkType;
  pen?: Pen;
  /** mark the text inside, or the element's whole box */
  target?: 'text' | 'box';
  note: ReactNode;
  /** a precise line under the note: a value, a call, a number */
  spec?: string;
  place?: 'right' | 'left' | 'below' | 'above';
  /** which margin a bracket stands in */
  side?: 'left' | 'right';
  as?: 'div' | 'span';
  className?: string;
  noteClassName?: string;
  children: ReactNode;
}

export function Ink({
  id,
  type,
  pen = 'graphite',
  target = 'text',
  note,
  spec,
  place = 'right',
  side = 'right',
  as: Tag = 'div',
  className,
  noteClassName,
  children,
}: InkProps) {
  const { on } = useShowWork();
  const [mounted, setMounted] = useState(on);
  if (on && !mounted) setMounted(true); // appear the moment the switch flips on

  const wrap = useRef<HTMLElement | null>(null);
  const layer = useRef<SVGSVGElement>(null);
  const markG = useRef<SVGGElement>(null);
  const arrowG = useRef<SVGGElement>(null);
  const noteEl = useRef<HTMLSpanElement>(null);

  // measure → generate → build, then draw once it scrolls into view
  useLayoutEffect(() => {
    if (!on || !mounted) return;
    const el = wrap.current;
    if (!el || !markG.current || !arrowG.current) return;
    loadNoteFont();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let marks: InkMark[] = [];
    let drawn = false;
    let visible = false;
    let sig = '';

    const layout = () => {
      const r = el.getBoundingClientRect();
      const origin = { x: r.left, y: r.top };
      const lines: Line[] = target === 'box' ? [{ x: 0, y: 0, w: r.width, h: r.height, base: r.height }] : linesOf(el, origin);
      if (!lines.length || r.width < 2) return;
      const em = parseFloat(getComputedStyle(el).fontSize) || 16;
      const g: Geometry = { em, lines, box: boxOf(lines), limit: [4 - r.left, document.documentElement.clientWidth - 4 - r.left] };
      const note = noteEl.current;
      const noteFloats = !!note && getComputedStyle(note).position === 'absolute' && (place === 'left' || place === 'right');
      const noteLine = noteFloats && note ? linesOf(note, origin)[0] : undefined;
      const next = JSON.stringify([g, noteLine]);
      if (next === sig) return; // nothing moved
      sig = next;
      marks.forEach(cancel);
      const markStrokes = generate(type, g, id, { side });
      // the arrow leaves from the marked thing's edge nearest the note
      const from: Line =
        target === 'box'
          ? { x: 0, y: r.height / 2 - 10, w: r.width, h: 20, base: r.height / 2 + em * 0.32 }
          : lines[lines.length - 1];
      const arrowStrokes = noteLine ? generate('arrow', { ...g, lines: [from], to: noteLine }, id) : [];
      marks = [build(markG.current!, markStrokes, PEN_WIDTH[pen]), build(arrowG.current!, arrowStrokes, 1.5)];
      if (drawn || reduce) {
        marks.forEach(showNow);
        note?.style.setProperty('opacity', '1');
      } else {
        marks.forEach(hide);
        if (visible) draw();
      }
    };

    const draw = () => {
      if (drawn || !marks.length) return;
      drawn = true;
      if (reduce) {
        marks.forEach(showNow);
        noteEl.current?.style.setProperty('opacity', '1');
        return;
      }
      const now = performance.now();
      const start = Math.max(now + START_DELAY, pencilFree);
      let t = start - now;
      for (const m of marks) t += play(m, t);
      pencilFree = now + t + GAP;
      noteEl.current?.animate([{ opacity: 0, translate: '0 4px' }, { opacity: 1, translate: '0 0' }], {
        delay: t - 120,
        duration: 420,
        easing: 'cubic-bezier(.22,1,.36,1)',
        fill: 'both',
      });
    };

    layout();
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) draw();
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(el);
    let timer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(layout, 120);
    });
    ro.observe(el);
    document.fonts?.ready.then(layout);
    return () => {
      io.disconnect();
      ro.disconnect();
      window.clearTimeout(timer);
      marks.forEach(cancel);
    };
  }, [on, mounted, id, type, pen, target, place, side]);

  // switching off: rub the marks out, then take them away
  useEffect(() => {
    if (on || !mounted) return;
    pencilFree = 0;
    const fading = [layer.current, noteEl.current]
      .filter((n): n is SVGSVGElement | HTMLSpanElement => !!n)
      .map((n) => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'forwards' }));
    let live = true;
    Promise.all(fading.map((a) => a.finished)).then(
      () => live && setMounted(false),
      () => live && setMounted(false),
    );
    return () => {
      live = false;
    };
  }, [on, mounted]);

  return (
    <Tag ref={wrap as never} className={cn('relative', className)} data-ink={mounted ? type : undefined}>
      {children}
      {mounted && (
        <>
          <svg ref={layer} className="ink-layer" aria-hidden="true" focusable="false">
            <g ref={markG} className="ink-stroke" data-pen={pen} mask="url(#ink-tooth)" />
            <g ref={arrowG} className="ink-stroke" data-pen="graphite" mask="url(#ink-tooth)" />
          </svg>
          <span ref={noteEl} className={cn('ink-note', noteClassName)} data-place={place} data-ink-skip="">
            <span className="ink-note-text">{note}</span>
            {spec && <code className="ink-note-spec">{spec}</code>}
          </span>
        </>
      )}
    </Tag>
  );
}

/**
 * A margin note with no mark: for things you can't wrap (a canvas behind the
 * hero). Position it with `className`; it only exists while the switch is on.
 */
export function InkNote({ id, note, spec, className }: { id: string; note: ReactNode; spec?: string; className?: string }) {
  const { on } = useShowWork();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!on || !ref.current) return;
    loadNoteFont();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = Math.max(performance.now() + START_DELAY, pencilFree) - performance.now();
    pencilFree = performance.now() + start + 500 + GAP;
    const a = ref.current.animate([{ opacity: 0, translate: '0 4px' }, { opacity: 1, translate: '0 0' }], {
      delay: reduce ? 0 : start,
      duration: reduce ? 1 : 460,
      easing: 'cubic-bezier(.22,1,.36,1)',
      fill: 'both',
    });
    return () => a.cancel();
  }, [on, id]);
  if (!on) return null;
  return (
    <span ref={ref} className={cn('ink-note ink-note--free', className)} data-ink-skip="">
      <span className="ink-note-text">{note}</span>
      {spec && <code className="ink-note-spec">{spec}</code>}
    </span>
  );
}

/** The paper's tooth, shared by every pencil stroke on the page (render once). */
export function InkDefs() {
  const { on } = useShowWork();
  const [href, setHref] = useState('');
  useEffect(() => {
    if (!on || href) return;
    const id = requestAnimationFrame(() => setHref(toothTile()));
    return () => cancelAnimationFrame(id);
  }, [on, href]);
  if (!href) return null;
  const big = { x: -4000, y: -4000, width: 12000, height: 12000 };
  return (
    <svg className="ink-defs" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="ink-tooth-tile" patternUnits="userSpaceOnUse" width="64" height="64">
          <image href={href} width="64" height="64" />
        </pattern>
        <mask id="ink-tooth" maskUnits="userSpaceOnUse" {...big}>
          <rect {...big} fill="url(#ink-tooth-tile)" />
        </mask>
      </defs>
    </svg>
  );
}
