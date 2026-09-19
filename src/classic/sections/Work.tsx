import { AnimatePresence, LayoutGroup, motion, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { HoverArrow, Icon } from '../components/Icon';
import { Ink } from '../components/Ink';
import { SectionHead } from '../components/SectionHead';
import { Shot } from '../components/Shot';
import {
  ALSO_SHIPPED,
  FILTERS,
  FLAGSHIPS,
  LIVE_COUNT,
  PROJECTS,
  TOOLS,
  inFilter,
  liveSites,
  shotId,
  shotSrc,
  showsShot,
  type FilterId,
  type Project,
} from '../lib/data';
import { useFinePointer, useReducedMotionPref } from '../lib/hooks';
import { ease, fade, spring } from '../lib/motion';
import { cn } from '../lib/cn';

export type WorkFilter = { kind: 'category'; id: FilterId } | { kind: 'tool'; id: string };

interface WorkProps {
  filter: WorkFilter;
  onFilter: (f: WorkFilter) => void;
  onOpenProject: (id: string, fromCard?: boolean) => void;
}

const SPANS = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7'];

export function Work({ filter, onFilter, onOpenProject }: WorkProps) {
  const rail = useRef<HTMLDivElement>(null);
  return (
    <section id="work" aria-labelledby="work-title" className="section-y relative">
      <div className="guides" aria-hidden="true" />
      <div className="container-x relative">
        <SectionHead
          id="work-title"
          label={`Work · ${LIVE_COUNT} live sites`}
          title="Fourteen shipped. Four to start with."
          lede="I designed, built and shipped each of these myself, from the database to the last hover state. Open any of them for the long version."
        />

        {/* on a phone the four are a row you swipe through, the next one peeking in; on a desktop, a grid */}
        <motion.div
          ref={rail}
          layoutScroll
          className="no-scrollbar mt-12 -mx-[calc(var(--gutter)+var(--inset))] flex snap-x snap-mandatory scroll-px-[calc(var(--gutter)+var(--inset))] gap-4 overflow-x-auto px-[calc(var(--gutter)+var(--inset))] pb-1 lg:mx-0 lg:mt-14 lg:grid lg:snap-none lg:grid-cols-12 lg:gap-x-8 lg:gap-y-16 lg:overflow-visible lg:px-0 lg:pb-0 [&>*]:min-w-0"
        >
          {FLAGSHIPS.map((p, i) => (
            <Flagship
              key={p.id}
              project={p}
              index={i}
              className={cn(SPANS[i], 'w-[84%] shrink-0 snap-start sm:w-[62%] lg:w-auto')}
              onOpen={() => onOpenProject(p.id, true)}
            />
          ))}
        </motion.div>
        <RailDots rail={rail} />

        <Ledger filter={filter} onFilter={onFilter} onOpenProject={onOpenProject} />
      </div>
    </section>
  );
}

function Flagship({ project: p, index, className, onOpen }: { project: Project; index: number; className?: string; onOpen: () => void }) {
  const card = (
    <>
      {/* above the card's stretched link, so hovering it can pan the capture; a click still opens the sheet */}
      <div className="relative z-20 cursor-pointer" onClick={onOpen}>
        <Shot
          projectId={p.id}
          layoutId={`shot-${p.id}`}
          pan
          className="aspect-[16/10] transition-shadow duration-300 group-hover:shadow-[0_0_0_1px_var(--rule-2),var(--shadow-float)]"
          alt={`${p.name}, the live site`}
        />
      </div>
      {/* the kind sits on the name's line, so the description gets the card's full width */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <h3 className="h3-type min-w-0 text-ink">
          <button type="button" onClick={onOpen} data-project-card={p.id} className="text-left after:absolute after:inset-0 after:z-10 after:content-['']">
            {p.name}
          </button>
        </h3>
        <span className="chip shrink-0">{p.kind}</span>
      </div>
      <p className="mt-2 max-w-[34rem] text-[15.5px] leading-relaxed text-ink-2 max-lg:line-clamp-3">{p.short}</p>
      <ul className="mt-5 border-t border-rule max-lg:hidden">
        {(p.highlights ?? []).slice(0, 3).map((h, i) => (
          <li key={h} className="flex gap-4 border-b border-rule py-2.5 text-[14px] text-ink-2">
            <span className="font-mono text-[11px] leading-[22px] text-ink-3 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
            {h}
          </li>
        ))}
      </ul>
      <div className="relative z-20 mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <span className="flex flex-wrap gap-1.5 max-sm:hidden">
          {p.tags.slice(0, 4).map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </span>
        <span className="ml-auto flex items-center gap-4">
          <button type="button" onClick={onOpen} className="text-link inline-flex items-center gap-1.5 text-[14px]">
            The long version <HoverArrow />
          </button>
          {p.url && (
            <a href={p.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[14px] font-[560] text-ink-2 hover:text-ink">
              Visit <Icon name="external" size={15} />
            </a>
          )}
        </span>
      </div>
    </>
  );

  return (
    <motion.article
      className={cn('group relative', className)}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.8, ease: ease.out, delay: (index % 2) * 0.08 }}
    >
      {index === 0 ? (
        <Ink
          id="flagship-card"
          type="box"
          pen="red"
          target="box"
          place="above"
          noteClassName="!bottom-[calc(100%+34px)] !left-[calc(100%+48px)] !max-w-[330px]"
          note="Hover the screenshot and it scrolls the whole page. Click and it becomes the sheet: the same element, animated to its new place."
          spec="<motion.div layoutId={`shot-${id}`}>"
        >
          {card}
        </Ink>
      ) : (
        card
      )}
    </motion.article>
  );
}

/** Where you are in the phone's row of four: tap a mark to go straight to that project. */
function RailDots({ rail }: { rail: RefObject<HTMLDivElement | null> }) {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotionPref();

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const cards = [...el.children] as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(cards.indexOf(e.target as HTMLElement));
      },
      { root: el, threshold: 0.6 },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [rail]);

  return (
    <div className="mt-5 flex items-center gap-4 lg:hidden">
      <div className="flex items-center">
        {FLAGSHIPS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-label={`${p.name}, ${i + 1} of ${FLAGSHIPS.length}`}
            aria-current={i === active ? 'true' : undefined}
            onClick={() => rail.current?.children[i]?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'start', block: 'nearest' })}
            className="grid h-8 min-w-7 place-items-center px-1.5"
          >
            <span className={cn('block h-1 rounded-full transition-[width,background-color] duration-300', i === active ? 'w-7 bg-amber' : 'w-2.5 bg-rule-2')} />
          </button>
        ))}
      </div>
      <span className="font-mono text-[11.5px] text-ink-3 tabular-nums">
        {active + 1} / {FLAGSHIPS.length} · swipe for the next
      </span>
    </div>
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
  const items = [...FLAGSHIPS, ...ALSO_SHIPPED].filter((p) =>
    filter.kind === 'tool' ? !!tool && p.tags.some((t) => tool.aliases.includes(t)) : inFilter(p, filter.id),
  );
  const sites = items.reduce((n, p) => n + liveSites(p), 0);

  const track = (e: ReactPointerEvent) => {
    x.set(e.clientX);
    y.set(e.clientY);
  };

  return (
    <div id="ledger" className="mt-16 scroll-mt-28 lg:mt-28">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div>
          <h3 className="h3-type text-ink">The whole ledger</h3>
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
          <Filters filter={filter} onFilter={onFilter} toolLabel={tool?.label} />
        </Ink>
      </div>

      <motion.ul
        layout
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
        {fine && !reduce && hover && showsShot(shotId(hover.id)) && (
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
      className="group relative grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-4 transition-colors hover:bg-paper-2 sm:grid-cols-[minmax(0,15rem)_1fr_auto] md:grid-cols-[minmax(0,15rem)_1fr_8.5rem_auto] md:px-2"
      onPointerEnter={() => onHover(p)}
    >
      <h4 className="col-start-1 row-start-1 text-[16px] font-[640] tracking-[-0.01em] text-ink [font-stretch:108%] sm:col-auto sm:row-auto">
        <button type="button" onClick={onOpen} data-project={p.id} className="text-left after:absolute after:inset-0 after:content-['']">
          {p.name}
        </button>
      </h4>
      <p className="col-span-2 row-start-2 text-[14px] text-ink-2 sm:col-span-1 sm:row-start-auto">{p.short}</p>
      <span className="hidden font-mono text-[11.5px] text-ink-3 md:block">{p.kind}</span>
      <span className="col-start-2 row-start-1 flex items-center justify-end gap-3 sm:col-auto sm:row-auto">
        {p.collection && <span className="font-mono text-[11.5px] text-ink-3">{p.collection.length} sites</span>}
        <Icon name="arrowRight" size={16} className="text-ink-3 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ink" />
      </span>
    </div>
  );
}
