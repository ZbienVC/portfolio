import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react';
import { useRef, useState } from 'react';
import { HoverArrow, Icon } from '../components/Icon';
import { Ink } from '../components/Ink';
import { SectionHead } from '../components/SectionHead';
import { EDUCATION, PROFILE, ROLES, SIDE_WORK, durationLabel, monthsBetween, type Role } from '../lib/data';
import { useReducedMotionPref } from '../lib/hooks';
import { ease, spring } from '../lib/motion';
import { cn } from '../lib/cn';

/**
 * The career as a ledger. A rule draws itself down the entries as you read
 * (scroll-linked, so it's a plain scaleY on the compositor), and each entry's
 * mark latches once the rule reaches it and stays lit (Atelier's line-draw,
 * done with Motion's useScroll).
 */
export function Experience() {
  const list = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotionPref();
  const { scrollYProgress } = useScroll({ target: list, offset: ['start 72%', 'end 58%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 260, damping: 40, restDelta: 0.001 });
  const scaleY = useTransform(progress, (p) => (reduce ? 1 : p));
  const [reached, setReached] = useState(reduce ? ROLES.length : 0);

  // latch: a role lights when the rule passes it and never un-lights
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const n = Math.min(ROLES.length, Math.floor(p * ROLES.length + 0.35));
    if (n > reached) setReached(n);
  });

  return (
    <section id="experience" aria-labelledby="experience-title" className="section-y relative">
      <div className="guides" aria-hidden="true" />
      <div className="container-x relative grid gap-x-12 gap-y-12 lg:grid-cols-12 [&>*]:min-w-0">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-[calc(var(--nav-h)+48px)]">
            <SectionHead
              id="experience-title"
              label="Experience"
              title="Five years with the numbers."
              lede="Financial services, telecom and startups: surveillance data at Bloomberg, capital raises in investment banking, savings models at Grapevine, and now the books for two telecom companies."
            />
            <dl className="mt-10 grid gap-5 border-t border-rule pt-6">
              <div>
                <dt className="label-type">Education</dt>
                <dd className="mt-1.5 text-[15px] text-ink">
                  Rutgers University, B.S. Finance
                  <span className="block text-[14px] text-ink-2">Concentration in Business Analytics · Dean&apos;s List · {EDUCATION.date}</span>
                </dd>
              </div>
              <div>
                <dt className="label-type">Certificate</dt>
                <dd className="mt-1.5 text-[15px] text-ink">
                  SQL for Data Science, UC Davis
                  <span className="block text-[14px] text-ink-2">Dec 2025</span>
                </dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <a href={PROFILE.resumePdfNamed} target="_blank" rel="noopener" className="btn btn-sm btn-primary">
                Résumé: building with AI <HoverArrow />
              </a>
              <a href={PROFILE.resumePdf} target="_blank" rel="noopener" className="btn btn-sm btn-quiet">
                <Icon name="file" size={15} /> Finance first
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <Ink
            id="timeline-rule"
            type="underline"
            target="box"
            place="above"
            as="div"
            className="mb-2 h-0"
            noteClassName="!bottom-[calc(100%+6px)] !left-10"
            note="This rule draws as you read, and each role stays lit once it's reached. It's a scaleY on the compositor, so it costs nothing to scroll."
            spec="useScroll({ target, offset: ['start 72%', 'end 58%'] })"
          >
            <span />
          </Ink>
          <ol ref={list} className="relative">
            {/* the rule: a hairline track, and the amber that draws down it */}
            <span className="absolute top-2 bottom-2 left-[7px] w-px bg-rule-2" aria-hidden="true" />
            <motion.span
              className="absolute top-2 bottom-2 left-[7px] w-px origin-top bg-amber"
              style={{ scaleY }}
              aria-hidden="true"
            />
            {ROLES.map((r, i) => (
              <RoleEntry key={`${r.company}-${r.start}`} role={r} lit={i < reached} first={i === 0} />
            ))}
          </ol>

          <div className="mt-14 border-t border-rule pt-8">
            <h3 className="label-type">Alongside, the whole time</h3>
            <ul className="mt-4 grid gap-6 sm:grid-cols-2">
              {SIDE_WORK.map((r) => (
                <li key={r.role}>
                  <p className="text-[16px] font-[640] text-ink [font-stretch:106%]">{r.role}</p>
                  <p className="mt-0.5 font-mono text-[11.5px] text-ink-3">
                    {r.company} · {r.period}
                  </p>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{r.highlights[0]}.</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoleEntry({ role: r, lit, first }: { role: Role; lit: boolean; first: boolean }) {
  const [open, setOpen] = useState(first);
  const months = monthsBetween(r.start, r.end);
  const rest = r.highlights.length - 2;
  return (
    <li className="relative pb-10 pl-10 last:pb-0">
      {/* the mark: hollow until the rule reaches it */}
      <motion.span
        aria-hidden="true"
        className="absolute top-[7px] left-0 grid size-[15px] place-items-center rounded-full border bg-paper"
        initial={false}
        animate={{ borderColor: lit ? 'var(--amber)' : 'var(--rule-2)', scale: lit ? 1 : 0.86 }}
        transition={spring.stiff}
      >
        <motion.span
          className="size-[7px] rounded-full bg-amber"
          initial={false}
          animate={{ scale: lit ? 1 : 0, opacity: lit ? 1 : 0 }}
          transition={spring.stiff}
        />
      </motion.span>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-[19px] font-[660] tracking-[-0.015em] text-ink [font-stretch:108%]">{r.role}</h3>
        <p className="font-mono text-[12px] text-ink-3 tabular-nums">
          {r.period} · {durationLabel(months)}
        </p>
      </div>
      <p className="mt-1 text-[15px] text-ink-2">
        {r.company} <span className="text-ink-3">· {r.location} · {r.type}</span>
      </p>

      <ul className="mt-4 grid gap-2">
        {r.highlights.slice(0, 2).map((h) => (
          <li key={h} className="text-[15px] leading-relaxed text-ink-2 [text-wrap:pretty]">
            {h}.
          </li>
        ))}
        <AnimatePresence initial={false}>
          {open &&
            r.highlights.slice(2).map((h) => (
              <motion.li
                key={h}
                className="overflow-hidden text-[15px] leading-relaxed text-ink-2 [text-wrap:pretty]"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.32, ease: ease.out }}
              >
                {h}.
              </motion.li>
            ))}
        </AnimatePresence>
      </ul>
      {rest > 0 && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={cn('mt-3 inline-flex items-center gap-1.5 font-mono text-[12px] text-amber-ink')}
        >
          {open ? 'Less' : `${rest} more`}
          <Icon name="chevronDown" size={14} className={cn('transition-transform', open && 'rotate-180')} />
        </button>
      )}
    </li>
  );
}
