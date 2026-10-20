import { motion } from 'motion/react';
import { useEffect } from 'react';
import { HoverArrow, Icon } from '../components/Icon';
import { SectionHead } from '../components/SectionHead';
import { Shot } from '../components/Shot';
import { NEW_WORK, PING_TARGETS, projectById, type NewWork as NewWorkItem, type Project, type Signature } from '../lib/data';
import { startPingsOnce, useBoard } from '../lib/pings';
import { useInViewOnce, useReducedMotionPref } from '../lib/hooks';
import { ease } from '../lib/motion';
import { cn } from '../lib/cn';

/**
 * The latest builds, above the flagships. Four tiles of four different sizes,
 * each with its own way of showing how the thing works, so the row never reads
 * as one card stamped out four times.
 *
 * lg grid (12 columns):  [ Hookline 8 ][ Feast 4, tall ]
 *                        [ Unearth 5 ][ Specimen 7     ]
 */
const LAYOUT: Record<string, { span: string; frame: string; variant: 'cover' | 'mobile' }> = {
  hookline: { span: 'lg:col-span-8', frame: 'aspect-[16/10]', variant: 'cover' },
  feast: { span: 'lg:col-span-4', frame: 'aspect-[16/10] lg:aspect-auto lg:h-[min(31rem,58vh)]', variant: 'mobile' },
  unearth: { span: 'lg:col-span-5', frame: 'aspect-[16/10]', variant: 'cover' },
  specimen: { span: 'lg:col-span-7', frame: 'aspect-[16/10] lg:aspect-[16/9]', variant: 'cover' },
};

interface NewWorkProps {
  onOpenProject: (id: string, fromCard?: boolean) => void;
}

export function NewWork({ onOpenProject }: NewWorkProps) {
  useEffect(() => startPingsOnce(), []);
  const items = NEW_WORK.map((n) => ({ n, p: projectById(n.id) })).filter((x): x is { n: NewWorkItem; p: Project } => !!x.p);
  return (
    <section id="new" aria-labelledby="new-title" className="section-y relative border-b border-rule">
      <div className="guides" aria-hidden="true" />
      <div className="container-x relative">
        <SectionHead
          id="new-title"
          label={`New · ${items.length} recent builds`}
          title="What I've been building lately."
          lede="An AI crew that makes videos, a party game for a living room, a spreadsheet detective and a gallery of art that draws itself. All four are live, and I built each one end to end."
        />

        <div className="mt-10 grid gap-x-8 gap-y-14 lg:mt-14 lg:grid-cols-12 lg:gap-y-16 [&>*]:min-w-0">
          {items.map(({ n, p }, i) => (
            <Tile key={p.id} item={n} project={p} index={i} onOpen={() => onOpenProject(p.id, true)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Tile({ item, project: p, index, onOpen }: { item: NewWorkItem; project: Project; index: number; onOpen: () => void }) {
  const look = LAYOUT[p.id] ?? LAYOUT.unearth;
  return (
    <motion.article
      className={cn('group relative flex flex-col', look.span)}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.8, ease: ease.out, delay: (index % 2) * 0.08 }}
    >
      {/* the ledger line above each tile: its number, what it is, and whether it answered just now */}
      <div className="mb-4 flex items-center gap-3 border-t border-rule-2 pt-3 font-mono text-[11.5px] text-ink-3">
        <span className="tabular-nums text-ink-2">N°{String(index + 1).padStart(2, '0')}</span>
        <span aria-hidden="true">·</span>
        <span>{p.kind}</span>
        <Status project={p} />
      </div>

      <div className="relative z-20 cursor-pointer" onClick={onOpen}>
        <Shot
          projectId={p.id}
          layoutId={`shot-${p.id}`}
          pan
          variant={look.variant}
          className={cn(look.frame, 'transition-shadow duration-300 group-hover:shadow-[0_0_0_1px_var(--rule-2),var(--shadow-float)]')}
          alt={`${p.name}, the live site`}
        />
      </div>

      <h3 className="h3-type mt-6 text-ink">
        <button type="button" onClick={onOpen} data-project-card={p.id} className="text-left after:absolute after:inset-0 after:z-10 after:content-['']">
          {p.name}
        </button>
      </h3>
      <p className="mt-2 max-w-[36rem] text-[15.5px] leading-relaxed text-ink-2">{item.hook}</p>

      <SignatureStrip signature={item.signature} />

      <div className="relative z-20 mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-5">
        <button type="button" onClick={onOpen} className="text-link inline-flex items-center gap-1.5 text-[14px]">
          The long version <HoverArrow />
        </button>
        {p.url && (
          <a href={p.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[14px] font-[560] text-ink-2 hover:text-ink">
            Open it <Icon name="external" size={15} />
          </a>
        )}
      </div>
    </motion.article>
  );
}

/** The site's own check from this visit, same as the status board: it answered your browser, this fast. */
function Status({ project }: { project: Project }) {
  const board = useBoard();
  const target = PING_TARGETS.find((t) => t.projectId === project.id);
  if (!target) return null;
  const r = board.results[target.key];
  const state = r?.state ?? 'pending';
  const said = state === 'up' ? `Up · ${r?.ms} ms` : state === 'down' ? 'Not answering' : 'Checking';
  return (
    <span className="ml-auto flex items-center gap-2" aria-live="polite">
      <span className="dot" data-state={state} aria-hidden="true" />
      <span className="tabular-nums">{said}</span>
    </span>
  );
}

/* ── How it works, drawn three different ways ─────────────────────────────── */

function SignatureStrip({ signature: s }: { signature: Signature }) {
  if (s.kind === 'chain') return <Chain steps={s.steps} />;
  if (s.kind === 'split') return <Split left={s.left} right={s.right} link={s.link} />;
  return <Figures items={s.items} />;
}

/** A pipeline on the terminal ground: the steps light up in order once it scrolls in. */
function Chain({ steps }: { steps: string[] }) {
  const [ref, seen] = useInViewOnce<HTMLOListElement>();
  const reduce = useReducedMotionPref();
  return (
    <ol
      ref={ref}
      aria-label="How a video gets made"
      className="mt-5 flex flex-wrap items-center gap-y-2 rounded-lg bg-term px-4 py-3 font-mono text-[12px] text-term-dim"
    >
      {steps.map((step, i) => (
        <li key={step} className="flex items-center">
          {i > 0 && (
            <span className="px-2 text-term-rule" aria-hidden="true">
              →
            </span>
          )}
          <motion.span
            className="text-term-ink"
            initial={false}
            animate={{ opacity: seen || reduce ? 1 : 0.38 }}
            transition={{ duration: 0.3, delay: reduce ? 0 : 0.25 + i * 0.16 }}
          >
            {step}
          </motion.span>
        </li>
      ))}
      <li className="ml-auto flex items-center gap-1.5 pl-3 text-term-amber">
        <span aria-hidden="true">▸</span> 1080×1920 MP4
      </li>
    </ol>
  );
}

/** Two screens and the thing that joins them. */
function Split({ left, right, link }: { left: { k: string; v: string }; right: { k: string; v: string }; link: string }) {
  return (
    <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-stretch overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--rule-2)]">
      <div className="bg-paper-2 px-3.5 py-3">
        <p className="font-mono text-[11px] text-ink-3">{left.k}</p>
        <p className="mt-1 text-[13.5px] font-[560] text-ink">{left.v}</p>
      </div>
      <div className="grid place-items-center border-x border-rule bg-amber-wash px-2.5">
        <span className="font-mono text-[10.5px] leading-tight text-amber-ink [writing-mode:vertical-rl] rotate-180">{link}</span>
      </div>
      <div className="bg-paper-2 px-3.5 py-3">
        <p className="font-mono text-[11px] text-ink-3">{right.k}</p>
        <p className="mt-1 text-[13.5px] font-[560] text-ink">{right.v}</p>
      </div>
    </div>
  );
}

/** A few numbers that tie out to the thing itself, set like a statement's totals. */
function Figures({ items }: { items: { n: string; label: string }[] }) {
  return (
    <dl className="mt-5 grid grid-cols-3 border-y border-rule">
      {items.map((f, i) => (
        // the label is the term, set under its number
        <div key={f.label} className={cn('flex flex-col-reverse py-3', i > 0 && 'border-l border-rule pl-4')}>
          <dt className="mt-1.5 text-[12.5px] text-ink-3">{f.label}</dt>
          <dd className="font-mono text-[26px] leading-none font-[500] tracking-[-0.02em] text-ink tabular-nums">{f.n}</dd>
        </div>
      ))}
    </dl>
  );
}
