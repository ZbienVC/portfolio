import { AnimatePresence, LayoutGroup, motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Icon } from '../components/Icon';
import { Ink } from '../components/Ink';
import { SectionHead } from '../components/SectionHead';
import { FILTERS, LIVE_COUNT, PROJECTS, STAGE_IDS, TOOLS, inFilter, liveSites, shotId, shotSrc, showsShot, type FilterId, type Project, type Unit } from '../lib/data';
import { useFinePointer, useReducedMotionPref } from '../lib/hooks';
import { startPingsOnce } from '../lib/pings';
import { Stack } from '../stack/Stack';
import { Stage } from './Stage';
import { ease, fade, spring } from '../lib/motion';
import { cn } from '../lib/cn';

// the list reads in the page's order: the stage's eight first, then the rest
const ORDERED = [...STAGE_IDS.map((id) => PROJECTS.find((p) => p.id === id)!).filter(Boolean), ...PROJECTS.filter((p) => !STAGE_IDS.includes(p.id))];

export type WorkFilter = { kind: 'category'; id: FilterId } | { kind: 'tool'; id: string };

interface WorkProps {
  filter: WorkFilter;
  onFilter: (f: WorkFilter) => void;
  onOpenProject: (id: string, fromCard?: boolean) => void;
}

// "fifteen" reads better than "15" in a heading; numbers past the list fall back to digits
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const TENS: Record<number, string> = { 2: 'twenty', 3: 'thirty', 4: 'forty' };
function countWord(n: number) {
  if (n < WORDS.length) return WORDS[n];
  const t = TENS[Math.floor(n / 10)];
  return t ? (n % 10 ? `${t}-${WORDS[n % 10]}` : t) : String(n);
}

export function Work({ filter, onFilter, onOpenProject }: WorkProps) {
  // the stage's live dots and the board share one set of checks
  useEffect(() => startPingsOnce(), []);
  return (
    <section id="work" aria-labelledby="work-title" className="section-y relative">
      <div className="guides" aria-hidden="true" />
      <div className="container-x relative">
        <SectionHead
          id="work-title"
          label={`Work · ${LIVE_COUNT} live sites`}
          title={`I've shipped ${countWord(LIVE_COUNT)}. Here are eight, running.`}
          lede="Each one plays a short recorded visit, on a laptop and on a phone. Pick one to take over the tour, or try the live site right here. Everything else is stacked below, oldest at the bottom."
        />
        <Stage onOpenProject={onOpenProject} />
        <Ledger filter={filter} onFilter={onFilter} onOpenProject={onOpenProject} />
      </div>
    </section>
  );
}

/* ── The ledger: every project, filterable ─────────────────────────────────── */

function Ledger({ filter, onFilter, onOpenProject }: WorkProps) {
  const [hover, setHover] = useState<Project | null>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotionPref();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.6 });

  const tool = filter.kind === 'tool' ? TOOLS.find((t) => t.id === filter.id) : undefined;
  const keep = (tags: string[], category: string[]) =>
    filter.kind === 'tool' ? !!tool && tags.some((t) => tool.aliases.includes(t)) : filter.id === 'all' || category.includes(filter.id);
  const items = ORDERED.filter((p) => keep(p.tags, p.category));
  const sites = items.reduce((n, p) => n + liveSites(p), 0);

  // the stack is the default; the list is one click away, and takes over if the stack can't draw
  // on a phone the tower is too small to read, so the list leads there
  const [view, setView] = useState<'stack' | 'list'>(() => (window.matchMedia('(min-width: 768px)').matches ? 'stack' : 'list'));
  const [stackless, setStackless] = useState(false);
  const shown = stackless ? 'list' : view;
  // the stack greys out what the filter leaves out; a stable function so the scene isn't re-filtered every render
  const filterKey = filter.kind + ':' + filter.id;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const match = useMemo(() => (filterKey === 'category:all' ? null : (u: Unit) => keep(u.tags, u.category)), [filterKey]);

  const track = (e: ReactPointerEvent) => {
    x.set(e.clientX);
    y.set(e.clientY);
  };

  return (
    <div id="ledger" className="mt-12 scroll-mt-28 lg:mt-28">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div>
          <h3 className="h3-type text-ink">Everything I&apos;ve shipped, stacked</h3>
          <p className="mt-1.5 font-mono text-[12.5px] text-ink-3" aria-live="polite">
            {items.length} project{items.length === 1 ? '' : 's'} · {sites} live site{sites === 1 ? '' : 's'}
            {tool && <> · built with {tool.label}</>}
          </p>
        </div>
        <Ink
          id="filters"
          type="underline"
          target="box"
          place="left"
          noteClassName="!top-[-14px] !right-[calc(100%+56px)] !max-w-[300px] text-right"
          note="Filter it. Rows that stay slide to their new places; the rest step out of the way."
          spec="<AnimatePresence mode='popLayout'> + layout"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Filters filter={filter} onFilter={onFilter} toolLabel={tool?.label} />
            {!stackless && <ViewSwitch view={view} onView={setView} />}
          </div>
        </Ink>
      </div>

      {shown === 'stack' && (
        <div className="mt-6">
          <Stack match={match} onOpenProject={onOpenProject} onUnavailable={() => setStackless(true)} />
        </div>
      )}

      <motion.ul
        layout
        hidden={shown !== 'list'}
        className="relative mt-6 border-t border-rule-2 bg-paper"
        onPointerMove={fine && !reduce ? track : undefined}
        onPointerLeave={() => setHover(null)}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((p) => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.14 } }}
              transition={{ ...spring.crisp, opacity: fade }}
              className="border-b border-rule"
            >
              <LedgerRow project={p} onOpen={() => onOpenProject(p.id)} onHover={setHover} />
            </motion.li>
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <li className="py-10 text-center text-ink-3">
            Nothing here yet.{' '}
            <button type="button" className="text-link" onClick={() => onFilter({ kind: 'category', id: 'all' })}>
              Show everything
            </button>
          </li>
        )}
      </motion.ul>

      {/* a preview that trails the pointer down the rows */}
      <AnimatePresence>
        {shown === 'list' && fine && !reduce && hover && showsShot(shotId(hover.id)) && (
          <motion.div
            key="preview"
            aria-hidden="true"
            className="pointer-events-none fixed top-0 left-0 z-40 w-[300px] overflow-hidden rounded-lg bg-paper shadow-[0_0_0_1px_var(--rule),var(--shadow-float)]"
            style={{ x: sx, y: sy, translateX: 28, translateY: '-50%' }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
            transition={{ ...spring.crisp, opacity: fade }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img
                key={hover.id}
                src={shotSrc(shotId(hover.id))}
                alt=""
                className="aspect-[16/10] w-full object-cover object-top"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: ease.out }}
              />
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ViewSwitch({ view, onView }: { view: 'stack' | 'list'; onView: (v: 'stack' | 'list') => void }) {
  return (
    <div role="group" aria-label="Show the projects as" className="flex items-center gap-1 rounded-lg bg-paper-3 p-1 shadow-[inset_0_0_0_1px_var(--rule)]">
      {(['stack', 'list'] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          onClick={() => onView(v)}
          className={cn(
            'h-8 rounded-md px-3 text-[13.5px] font-[560] transition-colors',
            view === v ? 'bg-paper text-ink shadow-[0_0_0_1px_var(--rule-2),0_1px_2px_hsl(var(--shadow-tint)/0.12)]' : 'text-ink-2 hover:text-ink',
          )}
        >
          {v === 'stack' ? 'Stack' : 'List'}
        </button>
      ))}
    </div>
  );
}

function Filters({ filter, onFilter, toolLabel }: { filter: WorkFilter; onFilter: (f: WorkFilter) => void; toolLabel?: string }) {
  const count = (id: FilterId) => PROJECTS.filter((p) => inFilter(p, id)).length;
  return (
    <LayoutGroup id="filters">
      <div role="group" aria-label="Filter projects" className="flex flex-wrap items-center gap-1 rounded-lg bg-paper-3 p-1 shadow-[inset_0_0_0_1px_var(--rule)]">
        {FILTERS.map((f) => {
          const on = filter.kind === 'category' && filter.id === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => onFilter({ kind: 'category', id: f.id })}
              className={cn('relative h-8 rounded-md px-3 text-[13.5px] font-[560] transition-colors', on ? 'text-ink' : 'text-ink-2 hover:text-ink')}
            >
              {on && (
                <motion.span
                  layoutId="filter-pill"
                  transition={spring.crisp}
                  className="absolute inset-0 rounded-md bg-paper shadow-[0_0_0_1px_var(--rule-2),0_1px_2px_hsl(var(--shadow-tint)/0.12)]"
                  aria-hidden="true"
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {f.label}
                <span className="font-mono text-[11px] text-ink-3 tabular-nums">{count(f.id)}</span>
              </span>
            </button>
          );
        })}
        {toolLabel && (
          <button
            type="button"
            onClick={() => onFilter({ kind: 'category', id: 'all' })}
            className="relative flex h-8 items-center gap-1.5 rounded-md px-3 text-[13.5px] font-[560] text-ink"
            aria-label={`Built with ${toolLabel}. Clear this filter`}
          >
            <motion.span
              layoutId="filter-pill"
              transition={spring.crisp}
              className="absolute inset-0 rounded-md bg-amber-wash shadow-[0_0_0_1px_var(--amber)]"
              aria-hidden="true"
            />
            <span className="relative">{toolLabel}</span>
            <Icon name="close" size={14} className="relative text-ink-2" />
          </button>
        )}
      </div>
    </LayoutGroup>
  );
}

function LedgerRow({ project: p, onOpen, onHover }: { project: Project; onOpen: () => void; onHover: (p: Project | null) => void }) {
  return (
    <div
      className="group relative grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-0.5 py-3 transition-colors hover:bg-paper-2 sm:gap-y-1 sm:py-4 sm:grid-cols-[minmax(0,15rem)_1fr_auto] md:grid-cols-[minmax(0,15rem)_1fr_8.5rem_auto] md:px-2"
      onPointerEnter={() => onHover(p)}
    >
      <h4 className="col-start-1 row-start-1 text-[16px] font-[640] tracking-[-0.01em] text-ink [font-stretch:108%] sm:col-auto sm:row-auto">
        <button type="button" onClick={onOpen} data-project={p.id} className="text-left after:absolute after:inset-0 after:content-['']">
          {p.name}
        </button>
      </h4>
      <p className="col-span-2 row-start-2 text-[14px] text-ink-2 max-sm:line-clamp-1 sm:col-span-1 sm:row-start-auto">{p.short}</p>
      <span className="hidden font-mono text-[11.5px] text-ink-3 md:block">{p.kind}</span>
      <span className="col-start-2 row-start-1 flex items-center justify-end gap-3 sm:col-auto sm:row-auto">
        {p.collection && <span className="font-mono text-[11.5px] text-ink-3">{p.collection.length} sites</span>}
        <Icon name="arrowRight" size={16} className="text-ink-3 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ink" />
      </span>
    </div>
  );
}
