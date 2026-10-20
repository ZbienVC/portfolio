import { AnimatePresence, motion } from 'motion/react';
import { useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useInViewOnce, useReducedMotionPref } from '../lib/hooks';
import { ease } from '../lib/motion';
import { cn } from '../lib/cn';
import { SYSTEMS, RUN_STEPS, type System } from '../lib/how';

/**
 * How I build: the AI system behind the work, as one instrument panel. The run
 * strip shows a single job going from a goal to my yes; below it, each of the
 * four systems with what it does and the numbers from its own records.
 */
export function HowIBuild() {
  const [active, setActive] = useState(0);
  const sys = SYSTEMS[active];

  const onKey = (e: ReactKeyboardEvent, i: number) => {
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + SYSTEMS.length) % SYSTEMS.length;
    setActive(next);
    document.getElementById(`how-tab-${SYSTEMS[next].id}`)?.focus();
  };

  return (
    <section id="how" aria-labelledby="how-title" className="section-y relative bg-term text-term-ink">
      <div className="container-x relative">
        <header className="max-w-[48rem]">
          <p className="flex items-center gap-2 font-mono text-[12px] tracking-[0.06em] text-term-amber uppercase">
            <span className="h-px w-5 bg-term-amber" aria-hidden="true" />
            How I build
          </p>
          <h2 id="how-title" className="h2-type mt-4 text-term-ink">
            I build with a crew of AI agents. Nothing ships without my yes.
          </h2>
          <p className="mt-5 max-w-[40rem] text-[17px] leading-relaxed text-term-dim">
            I wrote the tools that run the crew: who researches, who builds, who reviews, and what it may spend. Here is one job, start to finish, and the five tools behind it.
          </p>
        </header>

        <RunStrip />

        <div className="mt-12 grid gap-x-12 gap-y-8 lg:mt-16 lg:grid-cols-12">
          <div role="tablist" aria-label="The systems" aria-orientation="vertical" className="no-scrollbar -mx-[calc(var(--gutter)+var(--inset))] flex gap-2 overflow-x-auto px-[calc(var(--gutter)+var(--inset))] lg:col-span-4 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0">
            {SYSTEMS.map((s, i) => {
              const on = i === active;
              return (
                <button
                  key={s.id}
                  id={`how-tab-${s.id}`}
                  role="tab"
                  aria-selected={on}
                  aria-controls="how-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => onKey(e, i)}
                  className={cn(
                    'group relative shrink-0 rounded-lg px-4 py-3 text-left transition-colors max-lg:shadow-[inset_0_0_0_1px_var(--term-rule)] lg:rounded-none lg:border-t lg:border-term-rule lg:px-0 lg:py-4',
                    on ? 'max-lg:bg-term-2' : 'hover:max-lg:bg-term-2/60',
                  )}
                >
                  {on && <motion.span layoutId="how-mark" className="absolute top-0 left-0 hidden h-[2px] w-16 bg-term-amber lg:block" transition={{ type: 'spring', stiffness: 400, damping: 38 }} aria-hidden="true" />}
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-[11px] text-term-dim tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    <span className={cn('text-[19px] font-[680] tracking-[-0.015em] whitespace-nowrap [font-stretch:110%]', on ? 'text-term-ink' : 'text-term-dim group-hover:text-term-ink')}>{s.name}</span>
                  </span>
                  <span className="mt-1 hidden pl-[30px] text-[14px] text-term-dim lg:block">{s.role}</span>
                </button>
              );
            })}
          </div>

          <div id="how-panel" role="tabpanel" aria-labelledby={`how-tab-${sys.id}`} className="lg:col-span-8">
            <AnimatePresence mode="wait" initial={false}>
              <Panel key={sys.id} system={sys} />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

/** One job, goal to merge, with a marker that travels the line once it scrolls in. */
function RunStrip() {
  const [ref, seen] = useInViewOnce<HTMLOListElement>('0px 0px -20% 0px');
  const reduce = useReducedMotionPref();
  return (
    <div className="mt-12 lg:mt-14">
      <p className="font-mono text-[11.5px] text-term-dim">One job, start to finish</p>
      <ol ref={ref} className="relative mt-4 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-6 lg:gap-0">
        {/* the rail the job travels along (wide screens) */}
        <span className="absolute top-[11px] right-0 left-0 hidden h-px bg-term-rule lg:block" aria-hidden="true" />
        <motion.span
          className="absolute top-[11px] left-0 hidden h-px origin-left bg-term-amber lg:block"
          style={{ right: 0 }}
          initial={false}
          animate={{ scaleX: seen || reduce ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 2.4, ease: ease.inOut, delay: 0.2 }}
          aria-hidden="true"
        />
        {RUN_STEPS.map((step, i) => (
          <motion.li
            key={step.title}
            className="relative lg:pr-6"
            initial={false}
            animate={{ opacity: seen || reduce ? 1 : 0.35 }}
            transition={{ duration: 0.3, delay: reduce ? 0 : 0.2 + i * 0.4 }}
          >
            <span
              className={cn(
                'relative z-10 grid size-[23px] place-items-center rounded-full font-mono text-[10.5px] tabular-nums',
                step.you ? 'bg-term-amber text-term' : 'bg-term-2 text-term-ink shadow-[inset_0_0_0_1px_var(--term-rule)]',
              )}
            >
              {i + 1}
            </span>
            <p className={cn('mt-3 text-[15px] font-[640] [font-stretch:106%]', step.you ? 'text-term-amber' : 'text-term-ink')}>{step.title}</p>
            <p className="mt-1 text-[13.5px] leading-snug text-term-dim">{step.body}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

function Panel({ system: s }: { system: System }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
      transition={{ duration: 0.34, ease: ease.out }}
      className="rounded-xl bg-term-2 p-5 shadow-[inset_0_0_0_1px_var(--term-rule)] sm:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-[26px] font-[720] tracking-[-0.02em] text-term-ink [font-stretch:114%]">{s.name}</h3>
        <span className="font-mono text-[11.5px] text-term-dim">{s.runsOn}</span>
      </div>
      <p className="mt-3 max-w-[40rem] text-[16px] leading-relaxed text-term-ink/90 [text-wrap:pretty]">{s.what}</p>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-term-rule sm:grid-cols-4">
        {s.figures.map((f) => (
          <div key={f.label} className="flex flex-col-reverse bg-term px-4 py-3.5">
            <dt className="mt-1.5 text-[12.5px] leading-snug text-term-dim">{f.label}</dt>
            <dd className="font-mono text-[28px] leading-none font-[500] tracking-[-0.02em] text-term-amber tabular-nums">{f.n}</dd>
          </div>
        ))}
      </dl>

      {s.detail.kind === 'chips' && (
        <div className="mt-6">
          <p className="font-mono text-[11.5px] text-term-dim">{s.detail.label}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {s.detail.items.map((t) => (
              <li key={t.name} className="rounded-md bg-term px-2.5 py-1.5 text-[13px] text-term-ink shadow-[inset_0_0_0_1px_var(--term-rule)]">
                {t.name} {t.note && <span className="ml-1 font-mono text-[11px] text-term-dim">{t.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {s.detail.kind === 'rules' && (
        <ul className="mt-6 grid gap-px overflow-hidden rounded-lg bg-term-rule sm:grid-cols-3">
          {s.detail.items.map((r) => (
            <li key={r.name} className="bg-term px-4 py-3">
              <p className="text-[14px] font-[620] text-term-ink">{r.name}</p>
              <p className="mt-1 text-[13px] leading-snug text-term-dim">{r.body}</p>
            </li>
          ))}
        </ul>
      )}

      {s.honest && (
        <div className="mt-6 border-t border-term-rule pt-5">
          <p className="font-mono text-[11.5px] text-term-amber">The honest part</p>
          <p className="mt-2 max-w-[40rem] text-[14.5px] leading-relaxed text-term-ink/90 [text-wrap:pretty]">{s.honest}</p>
        </div>
      )}
    </motion.div>
  );
}
