import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { Ink } from '../components/Ink';
import { SectionHead } from '../components/SectionHead';
import { useReducedMotionPref } from '../lib/hooks';
import { ease, fade, spring } from '../lib/motion';
import { cn } from '../lib/cn';

/*
 * The day job, shown rather than claimed: a toy of the accounts-payable
 * pipeline (drop a document in, watch it get named, filed and turned into a
 * QuickBooks import) and of the month-over-month statement check. The carriers,
 * accounts and amounts are invented; the steps and the IIF format are real.
 */

interface Doc {
  id: string;
  raw: string;
  vendor: string;
  ref: string;
  date: string; // MM/DD/YYYY, as QuickBooks wants it
  amount: number;
  account: string;
}

const DOCS: Doc[] = [
  { id: 'nl', raw: 'scan_0831_final (2).pdf', vendor: 'Northline Carrier', ref: 'INV-4471', date: '08/31/2026', amount: 4812.2, account: 'Carrier Costs' },
  { id: 'bw', raw: 'IMG_20260902_0911.pdf', vendor: 'Brightwater Telecom', ref: 'STMT-0826', date: '08/31/2026', amount: 12906.55, account: 'Carrier Costs' },
  { id: 'kf', raw: 'Document (14).pdf', vendor: 'Keystone Fiber', ref: 'KF-20931', date: '09/01/2026', amount: 1240, account: 'Circuit Leases' },
];

const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const slug = (s: string) => s.replace(/[^A-Za-z0-9]+/g, '-');
const fileName = (d: Doc) => `${d.date.slice(6)}-${d.date.slice(0, 2)}_${slug(d.vendor)}_${d.ref}.pdf`;
const folder = (d: Doc) => `AP / ${d.date.slice(6)} / ${d.date.slice(0, 2)} / ${d.vendor} /`;
const iif = (d: Doc) => [
  `TRNS\tBILL\t${d.date}\tAccounts Payable\t${d.vendor}\t-${d.amount.toFixed(2)}\t${d.ref}`,
  `SPL\tBILL\t${d.date}\t${d.account}\t${d.vendor}\t${d.amount.toFixed(2)}\t${d.ref}`,
  'ENDTRNS',
];

const STEPS = ['Read', 'Named', 'Filed', 'Written as IIF', 'Imported'] as const;

export function DayJob() {
  const [tab, setTab] = useState<'ap' | 'check'>('ap');
  return (
    <section id="day-job" aria-labelledby="day-job-title" className="section-y relative bg-paper-2">
      <div className="guides" aria-hidden="true" />
      <div className="container-x relative grid gap-x-12 gap-y-12 lg:grid-cols-12 [&>*]:min-w-0">
        <div className="lg:col-span-5">
          <SectionHead
            id="day-job-title"
            label="The day job"
            title="I run the books for two telecom companies. The filing runs itself."
            lede="Payables, receivables, carrier and agent commissions, the monthly close. Invoices and carrier statements used to be renamed, filed and keyed into QuickBooks by hand. Now code I wrote does that, which takes about 30 hours of data entry out of every month."
          />
          <ul className="mt-10 border-t border-rule">
            {[
              ['30 hrs', 'of filing and data entry taken out of every month'],
              ['2', 'companies’ books: AP, AR, commissions, the close'],
              ['499-Q', 'FCC revenue reporting, pulled straight from billing data'],
            ].map(([n, t]) => (
              <li key={n} className="flex items-baseline gap-5 border-b border-rule py-4">
                <span className="w-[5.5rem] shrink-0 text-[26px] font-[700] tracking-[-0.03em] text-ink tabular-nums [font-stretch:112%]">{n}</span>
                <span className="text-[15px] text-ink-2">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7 lg:pt-2">
          <Ink
            id="day-job-toy"
            type="bracket"
            pen="red"
            target="box"
            place="below"
            noteClassName="!top-[calc(100%+18px)] !left-[4%]"
            note="A toy of the real pipeline, with invented carriers. Drag a document in: it's read, named, filed and written as a QuickBooks import."
            spec="Motion drag → drop zone hit-test → layoutId hand-off"
          >
            <div className="overflow-hidden rounded-xl bg-paper shadow-[0_0_0_1px_var(--rule),var(--shadow-panel)]">
              <div className="flex items-center gap-1 border-b border-rule bg-paper-2 px-2 py-2">
                <LayoutGroup id="dayjob-tabs">
                  {(
                    [
                      ['ap', 'Accounts payable'],
                      ['check', 'Statement check'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={tab === id}
                      onClick={() => setTab(id)}
                      className={cn('relative h-8 rounded-md px-3 text-[13.5px] font-[560]', tab === id ? 'text-ink' : 'text-ink-2 hover:text-ink')}
                    >
                      {tab === id && (
                        <motion.span
                          layoutId="dayjob-tab"
                          transition={spring.crisp}
                          className="absolute inset-0 rounded-md bg-paper shadow-[0_0_0_1px_var(--rule-2)]"
                        />
                      )}
                      <span className="relative">{label}</span>
                    </button>
                  ))}
                </LayoutGroup>
                <span className="ml-auto pr-2 font-mono text-[11px] text-ink-3">invented data, real steps</span>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: ease.out }}
                >
                  {tab === 'ap' ? <Payables /> : <StatementCheck />}
                </motion.div>
              </AnimatePresence>
            </div>
          </Ink>
        </div>
      </div>
    </section>
  );
}

/* ── Accounts payable: drop a document in ─────────────────────────────────── */

function Payables() {
  const reduce = useReducedMotionPref();
  const [inbox, setInbox] = useState(DOCS);
  const [current, setCurrent] = useState<{ doc: Doc; step: number } | null>(null);
  const [done, setDone] = useState<Doc[]>([]);
  const [over, setOver] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  // a drag ends in a click on the same button; only a drop in the zone should count
  const dragged = useRef(false);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const process = (doc: Doc) => {
    if (current) return;
    setInbox((q) => q.filter((d) => d.id !== doc.id));
    if (reduce) {
      setDone((d) => [...d, doc]);
      return;
    }
    setCurrent({ doc, step: 0 });
    const at = [650, 1300, 2000, 2900];
    at.forEach((ms, i) => {
      timers.current.push(window.setTimeout(() => setCurrent({ doc, step: i + 1 }), ms));
    });
    timers.current.push(
      window.setTimeout(() => {
        setCurrent(null);
        setDone((d) => [...d, doc]);
      }, 3900),
    );
  };

  const reset = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setCurrent(null);
    setDone([]);
    setInbox(DOCS);
  };

  const hit = (x: number, y: number) => {
    const r = zone.current?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  const minutes = 0;
  return (
    <div className="grid gap-px bg-rule md:grid-cols-[13.5rem_1fr]">
      {/* the inbox */}
      <div className="bg-paper p-4">
        <p className="label-type mb-3 flex items-center justify-between">
          Inbox <span className="tabular-nums">{inbox.length}</span>
        </p>
        <ul className="grid grid-cols-1 gap-2">
          <AnimatePresence initial={false}>
            {inbox.map((d) => (
              <motion.li key={d.id} layout className="min-w-0" exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }} transition={spring.crisp}>
                <motion.button
                  type="button"
                  layoutId={`doc-${d.id}`}
                  drag={!current}
                  dragSnapToOrigin
                  dragElastic={0.9}
                  whileDrag={{ scale: 1.05, rotate: -2, zIndex: 30, boxShadow: '0 18px 40px -12px rgb(0 0 0 / 0.35)' }}
                  onPointerDown={() => (dragged.current = false)}
                  onDragStart={() => (dragged.current = true)}
                  onDrag={(_, info) => setOver(hit(info.point.x - window.scrollX, info.point.y - window.scrollY))}
                  onDragEnd={(_, info) => {
                    setOver(false);
                    // after the click that trails the drop, so Enter on the button still works later
                    window.setTimeout(() => (dragged.current = false));
                    if (hit(info.point.x - window.scrollX, info.point.y - window.scrollY)) process(d);
                  }}
                  onClick={() => !dragged.current && process(d)}
                  disabled={!!current}
                  className="relative flex w-full cursor-grab items-center gap-2.5 rounded-md bg-paper-2 px-2.5 py-2 text-left shadow-[0_0_0_1px_var(--rule-2)] active:cursor-grabbing disabled:cursor-default disabled:opacity-60"
                >
                  <FileGlyph />
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[11.5px] text-ink">
                      {/* the visible name stays inside the accessible one */}
                      <span className="sr-only">Process </span>
                      {d.raw}
                    </span>
                    <span className="block font-mono text-[10.5px] text-ink-3">unnamed · unfiled</span>
                  </span>
                </motion.button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {inbox.length === 0 && !current && (
          <button type="button" onClick={reset} className="mt-2 flex items-center gap-2 text-[13px] font-[560] text-amber-ink">
            <Icon name="refresh" size={15} /> Put them back
          </button>
        )}
        {inbox.length > 0 && <p className="mt-3 text-[12px] leading-snug text-ink-3">Drag one into the pipeline, or tap it.</p>}
      </div>

      {/* the pipeline */}
      <div
        ref={zone}
        className={cn('relative min-h-[300px] bg-paper p-4 transition-colors duration-200 sm:p-5', over && 'bg-amber-wash')}
      >
        <div className={cn('pointer-events-none absolute inset-2 rounded-lg border border-dashed transition-colors', over ? 'border-amber' : 'border-transparent')} />
        {current ? (
          <Pipeline doc={current.doc} step={current.step} />
        ) : (
          <div className="grid h-full min-h-[260px] place-items-center text-center">
            <p className="max-w-[16rem] text-[14px] text-ink-3">
              {done.length === DOCS.length ? 'Inbox zero. Everything is named, filed and in QuickBooks.' : 'Drop a document here.'}
            </p>
          </div>
        )}
      </div>

      {/* what landed in QuickBooks */}
      <div className="bg-paper px-4 py-3.5 md:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="label-type">Imported to QuickBooks</p>
          <p className="font-mono text-[11.5px] text-ink-3 tabular-nums">
            {done.length} filed by code · {minutes} minutes by hand
          </p>
        </div>
        <ul className="mt-2 grid gap-1">
          <AnimatePresence initial={false}>
            {done.map((d) => (
              <motion.li
                key={d.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.crisp, opacity: fade }}
                className="flex items-center gap-3 text-[13.5px]"
              >
                <Icon name="check" size={15} className="text-tick-ink" />
                <span className="text-ink">Bill · {d.vendor}</span>
                <span className="font-mono text-[11.5px] text-ink-3">{d.ref}</span>
                <span className="ml-auto font-mono text-[12.5px] text-ink tabular-nums">{money(d.amount)}</span>
              </motion.li>
            ))}
          </AnimatePresence>
          {done.length === 0 && <li className="text-[13px] text-ink-3">Nothing yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function Pipeline({ doc, step }: { doc: Doc; step: number }) {
  return (
    <div className="relative">
      <motion.div layoutId={`doc-${doc.id}`} transition={spring.sheet} className="flex items-center gap-2.5 rounded-md bg-paper-2 px-2.5 py-2 shadow-[0_0_0_1px_var(--rule-2)]">
        <FileGlyph />
        <Scramble className="truncate font-mono text-[12px] text-ink" from={doc.raw} to={fileName(doc)} run={step >= 1} />
      </motion.div>
      <ol className="mt-4 grid gap-3">
        {STEPS.map((label, i) => {
          const state = step > i ? 'done' : step === i ? 'now' : 'next';
          return (
            <li key={label} className="grid grid-cols-[1.25rem_1fr] gap-3">
              <span
                className={cn(
                  'mt-[3px] grid size-4 place-items-center rounded-full border text-[9px] transition-colors duration-300',
                  state === 'done' ? 'border-tick bg-tick text-paper' : state === 'now' ? 'border-amber' : 'border-rule-2',
                )}
                aria-hidden="true"
              >
                {state === 'done' ? '✓' : state === 'now' ? <span className="size-1.5 animate-pulse rounded-full bg-amber" /> : null}
              </span>
              <div className="min-w-0">
                <p className={cn('text-[13.5px] font-[580]', state === 'next' ? 'text-ink-3' : 'text-ink')}>{label}</p>
                <AnimatePresence>
                  {step > i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3, ease: ease.out }}
                      className="overflow-hidden"
                    >
                      <StepDetail doc={doc} index={i} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepDetail({ doc, index }: { doc: Doc; index: number }) {
  const cls = 'mt-1 font-mono text-[11.5px] leading-relaxed text-ink-2';
  switch (index) {
    case 0:
      return (
        <p className={cls}>
          {doc.vendor} · {doc.ref} · {money(doc.amount)} · due {doc.date}
        </p>
      );
    case 1:
      return <p className={cls}>{fileName(doc)}</p>;
    case 2:
      return <p className={cls}>{folder(doc)}</p>;
    case 3:
      return (
        <pre className="mt-1.5 overflow-x-auto rounded-md bg-term px-3 py-2 font-mono text-[10.5px] leading-[1.7] text-term-ink">
          {iif(doc).map((l) => (
            <span key={l} className="block whitespace-pre">
              {l.split('\t').map((cell, j) => (
                <span key={j} className={cn('inline-block pr-3', j === 0 && 'text-term-amber')}>
                  {cell}
                </span>
              ))}
            </span>
          ))}
        </pre>
      );
    default:
      return null;
  }
}

/** Text that churns through glyphs into its new value (a filename being renamed). */
function Scramble({ from, to, run, className }: { from: string; to: string; run: boolean; className?: string }) {
  const [text, setText] = useState(from);
  useEffect(() => {
    if (!run) return;
    const glyphs = 'abcdefghijklmnopqrstuvwxyz0123456789_-';
    const len = Math.max(from.length, to.length);
    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / 520);
      let out = '';
      for (let i = 0; i < len; i++) {
        const settleAt = i / len; // left to right
        if (t >= settleAt + 0.25) out += to[i] ?? '';
        else if (t >= settleAt) out += glyphs[(Math.random() * glyphs.length) | 0];
        else out += from[i] ?? '';
      }
      setText(out);
      if (t < 1) raf = requestAnimationFrame(frame);
      else setText(to);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [run, from, to]);
  return (
    <span className={className} aria-label={run ? to : from}>
      {text}
    </span>
  );
}

function FileGlyph() {
  return (
    <svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true" className="shrink-0 text-ink-3">
      <path d="M2.5 1.5h8.5l4.5 4.5v14.5h-13Z" fill="var(--paper)" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M10.5 1.5v5h5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5 11h8M5 14h8M5 17h5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

/* ── The month-over-month check ───────────────────────────────────────────── */

type Flag = 'ok' | 'missing' | 'changed' | 'underpaid';
const LINES: { account: string; jul: number; aug: number | null; contract: number; flag: Flag }[] = [
  { account: 'Harbor Dental Group', jul: 418.2, aug: 418.2, contract: 418.2, flag: 'ok' },
  { account: 'Mercer Logistics', jul: 1122, aug: null, contract: 1122, flag: 'missing' },
  { account: 'Pine St. Bakery', jul: 96.5, aug: 112.75, contract: 112.75, flag: 'changed' },
  { account: 'Alder & Sons HVAC', jul: 640, aug: 512, contract: 640, flag: 'underpaid' },
  { account: 'Summit Realty', jul: 288.9, aug: 288.9, contract: 288.9, flag: 'ok' },
];

function StatementCheck() {
  const reduce = useReducedMotionPref();
  const [ran, setRan] = useState(false);
  const short = LINES.filter((l) => l.flag === 'underpaid').reduce((s, l) => s + (l.contract - (l.aug ?? 0)), 0);
  const flagged = LINES.filter((l) => l.flag !== 'ok').length;

  return (
    <div className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-ink-2">
          Northline Carrier commission statement, <span className="text-ink">August against July</span>.
        </p>
        <button type="button" onClick={() => setRan((r) => !r)} className="btn btn-sm btn-primary">
          {ran ? 'Clear' : 'Run the check'}
          <Icon name={ran ? 'refresh' : 'play'} size={14} />
        </button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[30rem] border-collapse text-[13.5px]">
          <thead>
            <tr className="label-type text-left">
              <th className="border-b border-rule-2 py-2 font-normal">Account</th>
              <th className="border-b border-rule-2 py-2 text-right font-normal">July</th>
              <th className="border-b border-rule-2 py-2 text-right font-normal">August</th>
              <th className="w-[11rem] border-b border-rule-2 py-2 pl-5 font-normal">Check</th>
            </tr>
          </thead>
          <tbody>
            {LINES.map((l, i) => (
              <tr key={l.account} className={cn('transition-colors duration-300', ran && l.flag !== 'ok' && 'bg-amber-wash')}>
                <td className="border-b border-rule py-2.5 text-ink">{l.account}</td>
                <td className="border-b border-rule py-2.5 text-right font-mono text-[12.5px] text-ink-2 tabular-nums">{money(l.jul)}</td>
                <td className="border-b border-rule py-2.5 text-right font-mono text-[12.5px] text-ink tabular-nums">{l.aug == null ? '—' : money(l.aug)}</td>
                <td className="border-b border-rule py-2.5 pl-5">
                  <AnimatePresence>
                    {ran && (
                      <motion.span
                        className="inline-flex items-center gap-1.5 font-mono text-[11.5px]"
                        initial={reduce ? false : { opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: ease.out, delay: reduce ? 0 : i * 0.09 }}
                      >
                        <FlagMark flag={l.flag} />
                        {l.flag === 'ok' && <span className="text-ink-3">ties out</span>}
                        {l.flag === 'missing' && <span className="text-fault">missing this month</span>}
                        {l.flag === 'changed' && <span className="text-amber-ink">changed +{money((l.aug ?? 0) - l.jul)}</span>}
                        {l.flag === 'underpaid' && <span className="text-fault">short {money(l.contract - (l.aug ?? 0))} vs contract</span>}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 min-h-[1.5em] text-[13.5px] text-ink-2" aria-live="polite">
        {ran && (
          <>
            <span className="font-[620] text-ink">{flagged} of {LINES.length} lines need a look</span>: one missing, one changed, one paid{' '}
            {money(short)} under contract. Doing that by hand at this volume was never realistic.
          </>
        )}
      </p>
    </div>
  );
}

function FlagMark({ flag }: { flag: Flag }) {
  if (flag === 'ok') return <Icon name="check" size={14} className="text-tick-ink" />;
  return (
    <span
      className={cn('grid size-4 place-items-center rounded-[4px] text-[10px] font-bold text-paper', flag === 'changed' ? 'bg-amber-ink' : 'bg-fault')}
      aria-hidden="true"
    >
      !
    </span>
  );
}
