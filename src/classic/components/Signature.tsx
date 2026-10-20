import { motion } from 'motion/react';
import type { Signature } from '../lib/data';
import { useInViewOnce, useReducedMotionPref } from '../lib/hooks';
import { cn } from '../lib/cn';

/** How a project works, drawn one of three ways: a pipeline, two sides joined, or a few totals. */
export function SignatureStrip({ signature: s, className }: { signature: Signature; className?: string }) {
  if (s.kind === 'chain') return <Chain label={s.label} steps={s.steps} end={s.end} className={className} />;
  if (s.kind === 'split') return <Split left={s.left} right={s.right} link={s.link} className={className} />;
  return <Figures items={s.items} className={className} />;
}

/** A pipeline on the terminal ground: the steps light up in order once it scrolls in. */
function Chain({ label, steps, end, className }: { label: string; steps: string[]; end?: string; className?: string }) {
  const [ref, seen] = useInViewOnce<HTMLOListElement>();
  const reduce = useReducedMotionPref();
  return (
    <ol
      ref={ref}
      aria-label={label}
      className={cn('flex flex-wrap items-center gap-y-2 rounded-lg bg-term px-4 py-3 font-mono text-[12px] text-term-ink', className)}
    >
      {steps.map((step, i) => (
        <li key={step} className="flex items-center">
          {i > 0 && (
            <span className="px-2 text-term-amber/70" aria-hidden="true">
              →
            </span>
          )}
          <motion.span initial={false} animate={{ opacity: seen || reduce ? 1 : 0.38 }} transition={{ duration: 0.3, delay: reduce ? 0 : 0.25 + i * 0.16 }}>
            {step}
          </motion.span>
        </li>
      ))}
      {end && (
        <li className="ml-auto flex items-center gap-1.5 pl-3 text-term-amber">
          <span aria-hidden="true">▸</span> {end}
        </li>
      )}
    </ol>
  );
}

/** Two screens and the thing that joins them. */
function Split({ left, right, link, className }: { left: { k: string; v: string }; right: { k: string; v: string }; link: string; className?: string }) {
  return (
    <div className={cn('grid grid-cols-[1fr_auto_1fr] items-stretch overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_var(--rule-2)]', className)}>
      <div className="bg-paper-2 px-3.5 py-3">
        <p className="font-mono text-[11px] text-ink-3">{left.k}</p>
        <p className="mt-1 text-[13.5px] font-[560] text-ink">{left.v}</p>
      </div>
      <div className="grid place-items-center border-x border-rule bg-amber-wash px-2.5">
        <span className="rotate-180 font-mono text-[10.5px] leading-tight text-amber-ink [writing-mode:vertical-rl]">{link}</span>
      </div>
      <div className="bg-paper-2 px-3.5 py-3">
        <p className="font-mono text-[11px] text-ink-3">{right.k}</p>
        <p className="mt-1 text-[13.5px] font-[560] text-ink">{right.v}</p>
      </div>
    </div>
  );
}

/** A few numbers that tie out to the thing itself, set like a statement's totals. */
function Figures({ items, className }: { items: { n: string; label: string }[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-3 border-y border-rule', className)}>
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
