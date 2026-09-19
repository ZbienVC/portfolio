import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { FLAGSHIPS, ALSO_SHIPPED, projectById, showsShot, type Project, type SiteLink } from '../lib/data';
import { restoreFocus, useInertPage, useMedia, useReducedMotionPref } from '../lib/hooks';
import { ease, fade, spring } from '../lib/motion';
import { cn } from '../lib/cn';
import { HoverArrow, Icon } from './Icon';
import { Shot } from './Shot';

const ORDER = [...FLAGSHIPS, ...ALSO_SHIPPED].map((p) => p.id);
const neighbour = (id: string, step: 1 | -1) => ORDER[(ORDER.indexOf(id) + step + ORDER.length) % ORDER.length];

interface SheetProps {
  id: string;
  /** the project whose card opened the sheet: its screenshot flies in as a shared element */
  sharedId?: string | null;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

/**
 * A project's long version. It opens from the card you clicked (the screenshot
 * is a shared element), reads like a short case study, and leaves the way you'd
 * expect: Esc, the close button, a click outside, or a drag off the edge.
 */
export function ProjectSheet({ id, sharedId, onClose, onNavigate }: SheetProps) {
  const p = projectById(id);
  const phone = useMedia('(max-width: 767px)');
  const reduce = useReducedMotionPref();
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useDragControls();
  const [dir, setDir] = useState<1 | -1>(1);
  // read during the first render, before the page behind goes inert
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  useInertPage();
  const shown = useRef(id);
  useEffect(() => {
    shown.current = id;
  }, [id]);

  // focus in, focus trapped, background still, Esc + arrows
  useEffect(() => {
    panel.current?.focus({ preventScroll: true });
    // the page keeps its scrollbar gutter (scrollbar-gutter: stable), so locking it doesn't shift anything
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = '';
      // back to whatever opened the sheet; if that's gone (the palette), to the project's own card or row
      const last = shown.current;
      restoreFocus(opener, `[data-project-card="${last}"], [data-project="${last}"]`);
    };
  }, [opener]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !(e.target as HTMLElement).closest('input,textarea')) {
        const step = e.key === 'ArrowRight' ? 1 : -1;
        setDir(step);
        onNavigate(neighbour(id, step));
      } else if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [id, onClose, onNavigate]);

  // a new project scrolls back to its top
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [id]);

  if (!p) return null;

  const go = (step: 1 | -1) => {
    setDir(step);
    onNavigate(neighbour(id, step));
  };
  const endDrag = (_: unknown, info: PanInfo) => {
    const far = phone ? info.offset.y > 140 || info.velocity.y > 700 : info.offset.x > 160 || info.velocity.x > 800;
    if (far) onClose();
  };
  const next = projectById(neighbour(id, 1))!;

  return (
    <div className="fixed inset-0 z-[70]" data-overlay-open="">
      <motion.div
        className="absolute inset-0 bg-[oklch(0.2_0.02_50/0.34)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fade}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        tabIndex={-1}
        className={cn(
          'absolute flex flex-col bg-paper outline-none shadow-[0_0_0_1px_var(--rule),var(--shadow-float)]',
          phone ? 'inset-x-0 top-[5vh] bottom-0 rounded-t-2xl' : 'top-0 right-0 bottom-0 w-[min(780px,100vw)]',
        )}
        initial={phone ? { y: '100%' } : { x: '100%' }}
        animate={phone ? { y: 0 } : { x: 0 }}
        exit={phone ? { y: '100%' } : { x: '100%' }}
        transition={reduce ? { duration: 0.01 } : spring.sheet}
        drag={phone ? 'y' : 'x'}
        dragListener={false}
        dragControls={drag}
        dragConstraints={phone ? { top: 0, bottom: 0 } : { left: 0, right: 0 }}
        dragElastic={phone ? { top: 0, bottom: 0.7 } : { left: 0, right: 0.7 }}
        onDragEnd={endDrag}
      >
        {/* the grip: drag the sheet away from here */}
        <div
          className="flex h-14 shrink-0 cursor-grab touch-none items-center gap-2 border-b border-rule px-4 active:cursor-grabbing sm:px-6"
          onPointerDown={(e) => drag.start(e)}
        >
          {phone ? (
            <span className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-rule-2" aria-hidden="true" />
          ) : (
            <Icon name="drag" size={16} className="text-ink-3" />
          )}
          <span className="chip">{p.kind}</span>
          <span className="ml-auto flex items-center gap-1">
            <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label="Previous project" title="Previous (←)">
              <Icon name="arrowRight" className="rotate-180" size={17} />
            </button>
            <button type="button" className="icon-btn" onClick={() => go(1)} aria-label="Next project" title="Next (→)">
              <Icon name="arrowRight" size={17} />
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close" title="Close (Esc)">
              <Icon name="close" />
            </button>
          </span>
        </div>

        <div ref={scroller} className="flex-1 overflow-y-auto overscroll-contain">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.article
              key={p.id}
              custom={dir}
              initial={{ opacity: 0, x: 40 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 * dir }}
              transition={{ ...spring.crisp, opacity: fade }}
              className="px-4 pt-6 pb-16 sm:px-8 sm:pt-8"
            >
              <Shot projectId={p.id} layoutId={p.id === sharedId ? `shot-${p.id}` : undefined} loading="eager" className="aspect-[16/10]" alt={`${p.name}, the live site`} />

              <h2 id="sheet-title" className="h2-type mt-9 text-ink">
                {p.name}
              </h2>
              <p className="mt-3 text-[17px] text-ink-2">{p.tagline}</p>

              <Links project={p} />

              <div className="mt-10 grid gap-10 md:grid-cols-[1fr_12.5rem]">
                <div>
                  <p className="text-[16.5px] leading-[1.7] text-ink-2 [text-wrap:pretty]">{p.description}</p>
                  {p.highlights && (
                    <>
                      <h3 className="label-type mt-10">What&apos;s in it</h3>
                      <ul className="mt-3 border-t border-rule">
                        {p.highlights.map((h, i) => (
                          <motion.li
                            key={h}
                            className="flex gap-4 border-b border-rule py-3 text-[15px] text-ink"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: ease.out, delay: 0.15 + i * 0.05 }}
                          >
                            <span className="font-mono text-[11px] leading-[23px] text-ink-3 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                            {h}
                          </motion.li>
                        ))}
                      </ul>
                    </>
                  )}
                  <h3 className="label-type mt-10">Built with</h3>
                  <p className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="chip">
                        {t}
                      </span>
                    ))}
                  </p>
                </div>
                {!p.collection && showsShot(p.id) && (
                  <figure className="hidden md:block">
                    <div className="overflow-hidden rounded-[22px] bg-ink p-[5px] shadow-[var(--shadow-panel)]">
                      <img src={`/work/${p.id}-m.webp`} alt={`${p.name} on a phone`} loading="lazy" className="w-full rounded-[18px]" onError={(e) => (e.currentTarget.closest('figure')!.hidden = true)} />
                    </div>
                    <figcaption className="label-type mt-3 text-center">On a phone</figcaption>
                  </figure>
                )}
              </div>

              {p.collection && <Collection sites={p.collection} />}

              <button
                type="button"
                onClick={() => go(1)}
                className="group mt-16 flex w-full items-center justify-between gap-4 border-t border-rule pt-6 text-left"
              >
                <span>
                  <span className="label-type">Next</span>
                  <span className="mt-1 block text-[20px] font-[680] tracking-[-0.015em] text-ink [font-stretch:110%]">{next.name}</span>
                </span>
                <HoverArrow size={14} />
              </button>
            </motion.article>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function Links({ project: p }: { project: Project }) {
  const links = [
    p.url && { href: p.url, label: 'Visit the live site', primary: true },
    p.telegram && { href: p.telegram, label: 'Telegram bot' },
    p.twitter && { href: p.twitter, label: 'On X' },
    p.github && { href: p.github, label: 'Source on GitHub' },
  ].filter(Boolean) as { href: string; label: string; primary?: boolean }[];
  if (!links.length) return null;
  return (
    <div className="mt-7 flex flex-wrap gap-2.5">
      {links.map((l) => (
        <a key={l.href} href={l.href} target="_blank" rel="noopener" className={cn('btn btn-sm', l.primary ? 'btn-primary' : 'btn-quiet')}>
          {l.label}
          {l.primary ? <HoverArrow /> : <Icon name="external" size={15} />}
        </a>
      ))}
    </div>
  );
}

function Collection({ sites }: { sites: SiteLink[] }) {
  return (
    <div className="mt-12">
      <h3 className="label-type">The four sites</h3>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {sites.map((s) => {
          const shot = s.name.replace('$', '').toLowerCase();
          return (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener" className="group block">
                {showsShot(shot) ? (
                  <Shot projectId="cryptosites" shot={shot} className="aspect-[16/10]" />
                ) : (
                  <div className="shot grid aspect-[16/10] place-items-center bg-term">
                    <span className="text-[26px] font-[740] tracking-[-0.02em] text-term-amber [font-stretch:120%]">{s.name}</span>
                  </div>
                )}
                <span className="mt-3 flex items-baseline justify-between gap-3">
                  <span className="text-[15.5px] font-[640] text-ink">{s.name}</span>
                  <span className="font-mono text-[11.5px] text-ink-3">{s.chain}</span>
                </span>
                <span className="mt-1 block text-[14px] leading-relaxed text-ink-2">{s.blurb}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
