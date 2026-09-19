import { AnimatePresence, motion, useDragControls, useMotionValueEvent, useScroll, type PanInfo } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PROFILE } from '../lib/data';
import { restoreFocus, useInertPage, useReducedMotionPref } from '../lib/hooks';
import { fade, spring } from '../lib/motion';
import { useShowWork } from '../lib/show-work';
import { useTheme } from '../lib/theme';
import { cn } from '../lib/cn';
import { HoverArrow, Icon, type IconName } from './Icon';

export const SECTION_LABELS = {
  work: 'Work',
  'day-job': 'The day job',
  experience: 'Experience',
  toolkit: 'Toolkit',
  'off-the-clock': 'Off the clock',
  basecamp: '3D basecamp',
  contact: 'Contact',
} as const;
export type SectionId = keyof typeof SECTION_LABELS;
const ORDER = Object.keys(SECTION_LABELS) as SectionId[];
const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * The phone's navigation, down where a thumb is: once you're past the hero, a
 * pill at the bottom says which section you're in and how far down the page
 * you are (the glaze fills it). Tap it for everything else.
 */
export function Dock({ active, onOpen }: { active: SectionId | null; onOpen: () => void }) {
  const { scrollY, scrollYProgress } = useScroll();
  const [shown, setShown] = useState(false);
  const { on: showingWork } = useShowWork();
  // sections run edge to edge, so past the hero there's always one on the reading line; in the hero, the top bar does the job
  const current = active ?? 'work';
  const visible = shown && active !== null;

  useMotionValueEvent(scrollY, 'change', (y) => setShown(y > window.innerHeight * 0.85));

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="dock"
          type="button"
          onClick={onOpen}
          data-menu-trigger=""
          aria-haspopup="dialog"
          aria-label={`Menu. You're in ${SECTION_LABELS[current]}`}
          className={cn(
            'fixed left-1/2 z-[45] flex h-12 w-[min(252px,calc(100vw-48px))] -translate-x-1/2 items-center justify-between gap-3 overflow-hidden rounded-full bg-term pr-2 pl-4 text-term-ink shadow-[0_0_0_1px_var(--term-rule),0_14px_34px_-12px_rgb(0_0_0/0.55)] lg:hidden',
            // the "showing the work" badge takes the bottom edge while it's up
            showingWork ? 'bottom-[calc(env(safe-area-inset-bottom)+68px)]' : 'bottom-[calc(env(safe-area-inset-bottom)+14px)]',
          )}
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ ...spring.crisp, opacity: fade }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={current}
              className="flex items-baseline gap-2.5 whitespace-nowrap"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={{ ...spring.crisp, opacity: { duration: 0.16 } }}
            >
              <span className="font-mono text-[11.5px] text-term-amber tabular-nums">{pad2(ORDER.indexOf(current) + 1)}</span>
              <span className="text-[15px] font-[620] [font-stretch:106%]">{SECTION_LABELS[current]}</span>
            </motion.span>
          </AnimatePresence>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-term-2 text-term-dim">
            <Icon name="menu" size={16} />
          </span>
          {/* how far down the page: the glaze, filling as you read */}
          <span className="absolute inset-x-4 bottom-[5px] h-[2px] overflow-hidden rounded-full bg-term-rule" aria-hidden="true">
            <motion.span
              className="block h-full origin-left rounded-full bg-[linear-gradient(90deg,#7a1f24,#d8432a_45%,#ffb347)]"
              style={{ scaleX: scrollYProgress }}
            />
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

interface SheetProps {
  active: SectionId | null;
  onClose: () => void;
  onOpenPalette: () => void;
  onOpenAsk: () => void;
}

/**
 * Everything the top bar holds on a desktop, as a sheet from the bottom of the
 * screen: the sections (with where you are), search, the AI, the résumé, and
 * the two switches. Drag it down, tap outside or press Esc to put it away.
 */
export function MenuSheet({ active, onClose, onOpenPalette, onOpenAsk }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null);
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  const drag = useDragControls();
  const reduce = useReducedMotionPref();
  const { theme, toggle: toggleTheme } = useTheme();
  const { on: showing, set: setShowing } = useShowWork();
  useInertPage();

  useEffect(() => {
    // focus lands on the sheet itself: a screen reader hears "Menu", and a tap doesn't leave a ring on the first row
    panel.current?.focus({ preventScroll: true });
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      restoreFocus(opener, '[data-menu-trigger]');
    };
  }, [opener]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const endDrag = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };
  const then = (fn: () => void) => () => {
    onClose();
    // after the sheet has started to leave, so the next thing isn't opened underneath it
    requestAnimationFrame(fn);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] lg:hidden" data-overlay-open="">
      <motion.div
        className="absolute inset-0 bg-[oklch(0.2_0.02_50/0.4)]"
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
        aria-label="Menu"
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col outline-none rounded-t-[20px] bg-paper shadow-[0_-1px_0_var(--rule),var(--shadow-float)]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={reduce ? { duration: 0.01 } : spring.sheet}
        drag="y"
        dragListener={false}
        dragControls={drag}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.65 }}
        onDragEnd={endDrag}
      >
        {/* the grip, and who this is */}
        <div className="shrink-0 cursor-grab touch-none px-5 pt-2.5 pb-3 active:cursor-grabbing" onPointerDown={(e) => drag.start(e)}>
          <span className="mx-auto block h-1 w-10 rounded-full bg-rule-2" aria-hidden="true" />
          <div className="mt-3 flex items-center gap-3">
            <img src="/me/headshot.webp" alt="" width={40} height={40} className="size-10 rounded-full object-cover shadow-[0_0_0_2px_var(--paper),0_0_0_3px_var(--amber)]" />
            <div className="min-w-0">
              <p className="text-[16px] font-[680] tracking-[-0.01em] text-ink [font-stretch:110%]">{PROFILE.name}</p>
              <p className="font-mono text-[11px] leading-snug text-ink-3">{PROFILE.location} · open to the right role</p>
            </div>
            <button type="button" className="icon-btn ml-auto" onClick={onClose} aria-label="Close menu">
              <Icon name="close" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
          <nav aria-label="Sections">
            <ol className="border-t border-rule">
              {ORDER.map((id, i) => {
                const here = active === id;
                return (
                  <motion.li
                    key={id}
                    className="border-b border-rule"
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring.crisp, delay: 0.04 + i * 0.025 }}
                  >
                    <a
                      href={`#${id}`}
                      onClick={onClose}
                      aria-current={here ? 'location' : undefined}
                      className="group relative flex min-h-[52px] items-center gap-4 py-2.5"
                    >
                      {here && <span className="absolute top-2.5 bottom-2.5 -left-5 w-[3px] rounded-r-full bg-amber" aria-hidden="true" />}
                      <span className={cn('w-6 font-mono text-[12px] tabular-nums', here ? 'text-amber-ink' : 'text-ink-3')}>{pad2(i + 1)}</span>
                      <span className="text-[19px] font-[660] tracking-[-0.015em] text-ink [font-stretch:108%]">{SECTION_LABELS[id]}</span>
                      {here && <span className="font-mono text-[11px] text-amber-ink">you&apos;re here</span>}
                      <Icon name="arrowRight" size={17} className="ml-auto text-ink-3 transition-transform group-active:translate-x-1" />
                    </a>
                  </motion.li>
                );
              })}
            </ol>
          </nav>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <Tile icon="search" label="Search" sub="projects, sections" onClick={then(onOpenPalette)} />
            <Tile icon="ask" label="Ask my AI" sub="about my work" onClick={then(onOpenAsk)} />
            <Tile icon="file" label="Résumé" sub="PDF" href={PROFILE.resumePdfNamed} />
            <Tile icon="mail" label="Email me" sub={PROFILE.email} href={`mailto:${PROFILE.email}`} />
          </div>

          <div className="mt-5 grid gap-1 border-t border-rule pt-4">
            <button
              type="button"
              role="switch"
              aria-checked={showing}
              onClick={() => {
                setShowing(!showing);
                // turning the notes on is only worth it with the page in view
                if (!showing) onClose();
              }}
              className="flex min-h-[52px] items-center gap-3 text-left"
            >
              <Icon name="pencil" size={18} className="shrink-0 text-amber-ink" />
              <span className="min-w-0">
                <span className="block text-[15.5px] font-[620] text-ink">Show the work</span>
                <span className="block text-[13px] text-ink-3">Pencil notes on how each part is built</span>
              </span>
              <Switch on={showing} />
            </button>
            <div className="flex min-h-[52px] items-center gap-3">
              <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={18} className="shrink-0 text-amber-ink" />
              <span className="text-[15.5px] font-[620] text-ink">Theme</span>
              <div className="ml-auto flex rounded-full bg-paper-3 p-1 shadow-[inset_0_0_0_1px_var(--rule)]" role="group" aria-label="Theme">
                {(['light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={theme === t}
                    onClick={(e) => {
                      if (theme === t) return;
                      const r = e.currentTarget.getBoundingClientRect();
                      toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
                    }}
                    className={cn(
                      'relative h-8 rounded-full px-3.5 text-[13px] font-[600] transition-colors',
                      theme === t ? 'text-ink' : 'text-ink-3',
                    )}
                  >
                    {theme === t && (
                      <motion.span layoutId="sheet-theme" transition={spring.crisp} className="absolute inset-0 rounded-full bg-paper shadow-[0_0_0_1px_var(--rule-2)]" aria-hidden="true" />
                    )}
                    <span className="relative">{t === 'light' ? 'Daylight' : 'After hours'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

interface TileProps {
  icon: IconName;
  label: string;
  sub: string;
  href?: string;
  onClick?: () => void;
}
function Tile({ icon, label, sub, href, onClick }: TileProps) {
  const inner = (
    <>
      <Icon name={icon} size={18} className="text-amber-ink" />
      <span className="mt-3 flex items-center gap-1.5 text-[15px] font-[620] text-ink">
        {label}
        <HoverArrow size={9} />
      </span>
      <span className="block truncate text-[12.5px] text-ink-3">{sub}</span>
    </>
  );
  const cls = 'group block min-w-0 rounded-xl bg-paper-2 p-3.5 text-left shadow-[inset_0_0_0_1px_var(--rule)] transition-colors active:bg-paper-3';
  return href ? (
    <a href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener" className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function Switch({ on }: { on: boolean }) {
  return (
    <span className={cn('relative ml-auto h-7 w-12 shrink-0 rounded-full transition-colors', on ? 'bg-amber' : 'bg-rule-2')} aria-hidden="true">
      <motion.span className="absolute top-1 left-1 size-5 rounded-full bg-paper shadow-[0_1px_3px_rgb(0_0_0/0.25)]" animate={{ x: on ? 20 : 0 }} transition={spring.stiff} />
    </span>
  );
}
