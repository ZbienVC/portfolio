import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { ALSO_SHIPPED, FLAGSHIPS, PROFILE, LIVE_COUNT, shotId, shotSrc, showsShot } from '../lib/data';
import { modKey, useActiveSection } from '../lib/hooks';
import { fade, spring } from '../lib/motion';
import { useShowWork } from '../lib/show-work';
import { useTheme } from '../lib/theme';
import { openBasecamp } from '../lib/basecamp';
import { cn } from '../lib/cn';
import { HoverArrow, Icon } from './Icon';
import { Dock, MenuSheet, type SectionId } from './MobileNav';

export const SECTIONS = ['work', 'day-job', 'experience', 'toolkit', 'off-the-clock', 'basecamp', 'contact'] as const;

type MenuId = 'work' | 'about';
interface NavProps {
  onOpenPalette: () => void;
  onOpenProject: (id: string) => void;
  onOpenAsk: () => void;
}

/**
 * The top bar. Two of its items open menus, and there is only ever ONE menu
 * panel: it morphs between them (size, position and the little caret), the way
 * Stripe's nav does, so moving across the bar never flickers closed and open.
 */
export function Nav({ onOpenPalette, onOpenProject, onOpenAsk }: NavProps) {
  const active = useActiveSection(SECTIONS);
  const [menu, setMenu] = useState<MenuId | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef(0);
  const barRef = useRef<HTMLElement>(null);
  const triggers = useRef<Record<MenuId, HTMLButtonElement | null>>({ work: null, about: null });
  const [caretX, setCaretX] = useState(0);
  const menuId = useId();
  const [mod] = useState(modKey);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const open = useCallback((id: MenuId, fromKeyboard = false) => {
    window.clearTimeout(closeTimer.current);
    const t = triggers.current[id];
    const bar = barRef.current;
    if (t && bar) {
      const r = t.getBoundingClientRect();
      setCaretX(r.left + r.width / 2 - bar.getBoundingClientRect().left);
    }
    setMenu(id);
    // the panel comes after every trigger in the DOM, so a keyboard open moves focus into it
    if (fromKeyboard)
      requestAnimationFrame(() =>
        document.getElementById(menuId)?.querySelector<HTMLElement>(`[data-menu="${id}"] :is(a, button)`)?.focus(),
      );
  }, [menuId]);
  // a short grace period so the pointer can travel from the trigger into the panel
  const closeSoon = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      // a keyboard user inside the panel keeps it, wherever the mouse wanders
      if (document.getElementById(menuId)?.contains(document.activeElement)) return;
      setMenu(null);
    }, 140);
  }, [menuId]);
  const close = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setMenu(null);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggers.current[menu]?.focus();
        close();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) close();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [menu, close]);

  const aboutActive = active === 'day-job' || active === 'experience' || active === 'toolkit' || active === 'off-the-clock' || active === 'basecamp';

  return (
    <header
      ref={barRef}
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-[var(--nav-h)] transition-[background-color,box-shadow] duration-200',
        scrolled || menu ? 'bg-paper shadow-[0_1px_0_var(--rule)]' : 'bg-transparent',
      )}
    >
      <div className="container-x flex h-full items-center gap-6">
        <a href="#top" className="group flex shrink-0 items-center gap-2.5" title="Back to top">
          <Monogram />
          <span className="text-[15px] font-[680] tracking-[-0.01em] [font-stretch:112%]">{PROFILE.name}</span>
        </a>

        <nav
          aria-label="Main"
          className="hidden lg:block"
          onPointerLeave={closeSoon}
          // tabbing out of the panel closes it
          onBlur={(e) => menu && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node) && close()}
        >
            <LayoutGroup id="nav">
              <ul className="flex items-center gap-1">
                <li>
                  <MenuTrigger
                    label="Work"
                    open={menu === 'work'}
                    current={active === 'work'}
                    controls={menuId}
                    ref={(el) => {
                      triggers.current.work = el;
                    }}
                    onOpen={() => open('work')}
                    onToggle={(kb) => (menu === 'work' ? close() : open('work', kb))}
                  />
                </li>
                <li>
                  <MenuTrigger
                    label="About"
                    open={menu === 'about'}
                    current={aboutActive}
                    controls={menuId}
                    ref={(el) => {
                      triggers.current.about = el;
                    }}
                    onOpen={() => open('about')}
                    onToggle={(kb) => (menu === 'about' ? close() : open('about', kb))}
                  />
                </li>
                <li>
                  <NavLink href="#contact" current={active === 'contact'} onPointerEnter={close}>
                    Contact
                  </NavLink>
                </li>
              </ul>
            </LayoutGroup>

          <AnimatePresence>
            {menu && (
              <MenuPanel
                key="panel"
                id={menuId}
                menu={menu}
                caretX={caretX}
                onPointerEnter={() => window.clearTimeout(closeTimer.current)}
                onNavigate={close}
                onOpenProject={(id) => {
                  close();
                  onOpenProject(id);
                }}
              />
            )}
          </AnimatePresence>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenPalette}
            data-palette-trigger=""
            className="hidden h-9 items-center gap-2 rounded-md pr-1.5 pl-2.5 text-sm text-ink-2 shadow-[inset_0_0_0_1px_var(--rule-2)] transition-colors hover:bg-paper-3 hover:text-ink md:inline-flex"
          >
            <Icon name="search" size={16} />
            <span>Jump to…</span>
            <span className="ml-3 flex gap-1">
              <kbd className="kbd">{mod}</kbd>
              <kbd className="kbd">K</kbd>
            </span>
          </button>
          {/* on a phone, search and the notes switch live in the menu sheet */}
          <ShowWorkSwitch />
          <ThemeSwitch />
          <a href={PROFILE.resumePdfNamed} target="_blank" rel="noopener" className="btn btn-primary btn-sm ml-1.5 hidden sm:inline-flex">
            Résumé
            <HoverArrow />
          </a>
          <button
            type="button"
            className="icon-btn lg:hidden"
            data-menu-trigger=""
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <Icon name="menu" />
          </button>
        </div>
      </div>

      <Dock active={active as SectionId | null} onOpen={() => setMobileOpen(true)} />
      <AnimatePresence>
        {mobileOpen && (
          <MenuSheet
            active={active as SectionId | null}
            onClose={() => setMobileOpen(false)}
            onOpenPalette={onOpenPalette}
            onOpenAsk={onOpenAsk}
          />
        )}
      </AnimatePresence>
    </header>
  );
}

function Monogram() {
  return (
    <span
      aria-hidden="true"
      className="grid size-8 place-items-center rounded-[7px] bg-ink text-[12px] font-[760] tracking-[-0.02em] text-paper [font-stretch:120%] transition-transform duration-200 group-hover:-rotate-3"
    >
      ZB
    </span>
  );
}

interface TriggerProps {
  label: string;
  open: boolean;
  current: boolean;
  controls: string;
  ref: (el: HTMLButtonElement | null) => void;
  onOpen: () => void;
  /** true when the click came from the keyboard (Enter or Space) */
  onToggle: (fromKeyboard: boolean) => void;
}
function MenuTrigger({ label, open, current, controls, ref, onOpen, onToggle }: TriggerProps) {
  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onOpen()}
      onClick={(e) => onToggle(e.detail === 0)}
      className={cn(
        'relative flex h-9 items-center gap-1 rounded-md px-3 text-[14.5px] font-[560] transition-colors',
        open || current ? 'text-ink' : 'text-ink-2 hover:text-ink',
      )}
    >
      {label}
      <Icon name="chevronDown" size={14} className={cn('transition-transform duration-200', open && 'rotate-180')} />
      {current && <CurrentBar />}
    </button>
  );
}

function NavLink({ href, current, children, onPointerEnter }: { href: string; current: boolean; children: ReactNode; onPointerEnter?: () => void }) {
  return (
    <a
      href={href}
      onPointerEnter={onPointerEnter}
      aria-current={current ? 'location' : undefined}
      className={cn(
        'relative flex h-9 items-center rounded-md px-3 text-[14.5px] font-[560] transition-colors',
        current ? 'text-ink' : 'text-ink-2 hover:text-ink',
      )}
    >
      {children}
      {current && <CurrentBar />}
    </a>
  );
}

/** Where you are on the page: an amber rule that slides between items. */
function CurrentBar() {
  return (
    <motion.span
      layoutId="nav-current"
      transition={spring.crisp}
      className="absolute inset-x-3 -bottom-[5px] h-[2px] rounded-full bg-amber"
      aria-hidden="true"
    />
  );
}

interface PanelProps {
  id: string;
  menu: MenuId;
  caretX: number;
  onPointerEnter: () => void;
  onNavigate: () => void;
  onOpenProject: (id: string) => void;
}
const PANEL_W: Record<MenuId, number> = { work: 760, about: 560 };
// how far left of its trigger each panel opens, so the caret lands over the content
const PANEL_LEAD: Record<MenuId, number> = { work: 150, about: 190 };

function MenuPanel({ id, menu, caretX, onPointerEnter, onNavigate, onOpenProject }: PanelProps) {
  const { on: showing } = useShowWork();
  const frame = useRef<HTMLDivElement>(null);
  const [frameLeft, setFrameLeft] = useState(0);
  const [frameW, setFrameW] = useState(1180);
  const [heights, setHeights] = useState<Partial<Record<MenuId, number>>>({});

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setFrameLeft(r.left - (el.closest('header')?.getBoundingClientRect().left ?? 0));
      setFrameW(r.width);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // each menu's content reports its own height; the panel springs between them
  const measureRef = useMemo(() => {
    const make = (m: MenuId) => (el: HTMLDivElement | null) => {
      if (!el) return;
      const ro = new ResizeObserver(() => setHeights((h) => (h[m] === el.offsetHeight ? h : { ...h, [m]: el.offsetHeight })));
      ro.observe(el);
      return () => ro.disconnect();
    };
    return { work: make('work'), about: make('about') };
  }, []);

  const w = Math.min(PANEL_W[menu], frameW);
  const x = Math.max(0, Math.min(caretX - frameLeft - PANEL_LEAD[menu], frameW - w));
  const dir = menu === 'work' ? -1 : 1;

  return (
    <motion.div
      id={id}
      onPointerEnter={onPointerEnter}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }}
      transition={{ ...spring.crisp, opacity: fade }}
      className="absolute top-[calc(var(--nav-h)-4px)] left-0 z-50 w-full"
    >
      {/* the caret rides the trigger */}
      <motion.span
        aria-hidden="true"
        className="absolute top-[2px] left-0 z-10 size-3 rounded-[2px] bg-paper shadow-[-1px_-1px_0_var(--rule)]"
        style={{ rotate: 45 }}
        initial={false}
        animate={{ x: caretX - 6 }}
        transition={spring.crisp}
      />
      <div ref={frame} className="container-x relative">
        <motion.div
          className="relative mt-2 overflow-hidden rounded-xl bg-paper shadow-[0_0_0_1px_var(--rule),var(--shadow-float)]"
          initial={false}
          animate={{ width: w, height: heights[menu] ?? 0, x }}
          transition={spring.crisp}
        >
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={menu}
              data-menu={menu}
              ref={measureRef[menu]}
              className="absolute top-0 left-0"
              style={{ width: w }}
              initial={{ opacity: 0, x: 28 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 * dir }}
              transition={{ ...spring.crisp, opacity: fade }}
            >
              {menu === 'work' ? <WorkMenu onNavigate={onNavigate} onOpenProject={onOpenProject} /> : <AboutMenu onNavigate={onNavigate} />}
              {showing && (
                <p className="border-t border-rule bg-paper-2 px-6 py-2.5 text-pencil-red">
                  <span className="font-['Caveat_Variable',cursive] text-[19px] leading-none">One panel that changes shape between menus, all on one spring.</span>
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}

function WorkMenu({ onNavigate, onOpenProject }: { onNavigate: () => void; onOpenProject: (id: string) => void }) {
  return (
    <div className="grid grid-cols-[1.35fr_1fr]">
      <div className="p-3">
        <p className="label-type px-3 pt-2 pb-1.5">Start with these</p>
        <ul>
          {FLAGSHIPS.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onOpenProject(p.id)}
                className="group flex w-full items-center gap-3.5 rounded-lg p-2.5 text-left transition-colors hover:bg-paper-3"
              >
                {showsShot(shotId(p.id)) ? (
                  <img
                    src={shotSrc(shotId(p.id))}
                    alt=""
                    width={64}
                    height={40}
                    loading="lazy"
                    className="h-10 w-16 shrink-0 rounded-[5px] object-cover object-top shadow-[0_0_0_1px_var(--rule)]"
                  />
                ) : (
                  <span className="grid h-10 w-16 shrink-0 place-items-center rounded-[5px] bg-term shadow-[0_0_0_1px_var(--rule)]">
                    {p.logo && <img src={p.logo} alt="" className="size-6 object-contain" />}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[14.5px] font-[620] text-ink">
                    {p.name}
                    <HoverArrow size={9} />
                  </span>
                  <span className="block truncate text-[13px] text-ink-3">{p.tagline}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-l border-rule bg-paper-2 p-3">
        <p className="label-type px-3 pt-2 pb-1.5">Also shipped</p>
        <ul className="grid">
          {ALSO_SHIPPED.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onOpenProject(p.id)}
                className="flex w-full items-baseline justify-between gap-3 rounded-md px-3 py-[7px] text-left text-[14px] text-ink-2 transition-colors hover:bg-paper-3 hover:text-ink"
              >
                <span className="truncate">{p.name}</span>
                <span className="font-mono text-[11px] text-ink-3">{p.kind}</span>
              </button>
            </li>
          ))}
        </ul>
        <a
          href="#work"
          onClick={onNavigate}
          className="mt-2 flex items-center gap-1.5 px-3 py-2 text-[13.5px] font-[600] text-amber-ink"
        >
          All {LIVE_COUNT} live sites
          <HoverArrow />
        </a>
      </div>
    </div>
  );
}

const ABOUT_LINKS = [
  { href: '#day-job', title: 'The day job', sub: 'Books for two telecom companies, and the automation that runs them' },
  { href: '#experience', title: 'Experience', sub: 'Bloomberg, investment banking, Grapevine, and now telecom' },
  { href: '#toolkit', title: 'Toolkit', sub: 'Which tools went into which projects' },
  { href: '#off-the-clock', title: 'Off the clock', sub: 'Snowboards, incentive design, fifty-some PCs' },
];

function AboutMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr]">
      <ul className="p-3">
        {ABOUT_LINKS.map((l) => (
          <li key={l.href}>
            <a href={l.href} onClick={onNavigate} className="group block rounded-lg px-3 py-2.5 transition-colors hover:bg-paper-3">
              <span className="flex items-center gap-1.5 text-[14.5px] font-[620] text-ink">
                {l.title}
                <HoverArrow size={9} />
              </span>
              <span className="block text-[13px] leading-snug text-ink-3">{l.sub}</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1 border-l border-rule bg-paper-2 p-3">
        <p className="label-type px-3 pt-2 pb-1.5">Résumés (PDF)</p>
        <a href={PROFILE.resumePdfNamed} target="_blank" rel="noopener" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[14px] text-ink-2 hover:bg-paper-3 hover:text-ink">
          <Icon name="file" size={16} /> Building with AI
        </a>
        <a href={PROFILE.resumePdf} target="_blank" rel="noopener" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[14px] text-ink-2 hover:bg-paper-3 hover:text-ink">
          <Icon name="file" size={16} /> Finance first
        </a>
        <button
          type="button"
          onClick={() => {
            onNavigate();
            openBasecamp();
          }}
          className="mt-auto flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-[14px] text-ink-2 hover:bg-paper-3 hover:text-ink"
        >
          <Icon name="cube" size={16} /> Walk the 3D basecamp
        </button>
      </div>
    </div>
  );
}

function ShowWorkSwitch() {
  const { on, toggle } = useShowWork();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      title="Show the work (W)"
      className={cn('icon-btn relative inline-flex w-auto gap-2 px-2.5 max-lg:hidden', on && 'text-amber-ink')}
    >
      <Icon name="pencil" size={17} />
      <span className="hidden text-[13.5px] font-[560] xl:inline">Show the work</span>
      <span className="sr-only xl:hidden">Show the work</span>
    </button>
  );
}

function ThemeSwitch() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
      }}
      className="icon-btn"
      aria-label={dark ? 'Switch to the light theme' : 'Switch to the dark theme'}
      title={dark ? 'Daylight' : 'After hours'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -60, opacity: 0, scale: 0.7 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 60, opacity: 0, scale: 0.7 }}
          transition={{ ...spring.stiff, opacity: fade }}
          className="grid"
        >
          <Icon name={dark ? 'moon' : 'sun'} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
