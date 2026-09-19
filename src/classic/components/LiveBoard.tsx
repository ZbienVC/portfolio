import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { LIVE_COUNT, PING_TARGETS, shotId, shotSrc, showsShot, type PingTarget } from '../lib/data';
import { runPings, startPingsOnce, useBoard, type PingResult } from '../lib/pings';
import { ease, spring } from '../lib/motion';
import { cn } from '../lib/cn';
import { Icon } from './Icon';
import { Ink } from './Ink';
import { SplitFlap } from './SplitFlap';

const pad2 = (n: number) => String(n).padStart(2, '0');
// a latency bar: log-scaled so 80 ms and 1.2 s both read, capped at 2 s
const barFor = (ms: number) => Math.max(0.06, Math.min(1, Math.log10(Math.max(ms, 40) / 40) / Math.log10(2000 / 40)));

/**
 * The hero's proof, and its signature moment: the visitor's browser calls every
 * live site as the page loads. Rows tick green with real response times, and
 * the split-flap counter turns forward one flap per answer.
 */
export function LiveBoard({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const board = useBoard();
  const [hover, setHover] = useState<PingTarget | null>(null);

  useEffect(() => startPingsOnce(), []);

  const failed = PING_TARGETS.filter((t) => board.results[t.key]?.state === 'down');
  const clock = board.checkedAt
    ? new Date(board.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <Ink
      id="board"
      type="bracket"
      pen="red"
      target="box"
      place="below"
      noteClassName="ink-note--pale !top-[calc(100%+20px)] !left-[4%] !max-w-[440px]"
      note="Real numbers: your browser just sent each site a HEAD request and timed the answer. The counter is a split-flap drum that only turns forward, one flap per answer."
      spec="fetch(url, { method: 'HEAD', mode: 'no-cors' }) · 72 ms a flap"
    >
      <div className="board relative overflow-hidden rounded-xl bg-term text-term-ink shadow-[0_0_0_1px_var(--term-rule),var(--shadow-float)]">
        {/* header: the function line, the count, the re-run */}
        <div className="flex items-center gap-3 border-b border-term-rule px-4 py-3 sm:px-5">
          <span className="font-mono text-[12px] tracking-[0.04em] text-term-amber">
            STATUS <span className="text-term-dim">&lt;GO&gt;</span>
          </span>
          <span className="ml-auto inline-flex items-center gap-2.5">
            <span className="font-mono text-[11px] tracking-[0.06em] text-term-dim">LIVE</span>
            <SplitFlap
              value={pad2(board.answered)}
              length={2}
              className="text-[22px]"
              label={(v) => `${Number(v) || 0} of ${PING_TARGETS.length} sites answered`}
            />
            <span className="font-mono text-[12px] text-term-dim">/ {pad2(PING_TARGETS.length)}</span>
          </span>
          <button
            type="button"
            onClick={runPings}
            disabled={!board.done}
            className="ml-1 grid size-8 place-items-center rounded-md text-term-dim transition-colors hover:bg-term-2 hover:text-term-ink disabled:opacity-40"
            aria-label="Check every site again"
            title="Check again"
          >
            <Icon name="refresh" size={16} className={cn(!board.done && board.run > 0 && 'animate-spin [animation-duration:1.4s]')} />
          </button>
        </div>

        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Each of my {LIVE_COUNT} live sites, checked from your browser when this page loaded
          </caption>
          <thead>
            <tr className="font-mono text-[10.5px] tracking-[0.08em] text-term-dim">
              <th scope="col" className="py-2.5 pl-4 font-normal sm:pl-5">
                SITE
              </th>
              <th scope="col" className="hidden py-2.5 font-normal xs:table-cell">
                WHERE
              </th>
              <th scope="col" className="py-2.5 pr-4 text-right font-normal sm:pr-5">
                ANSWERED IN
              </th>
            </tr>
          </thead>
          <tbody>
            {PING_TARGETS.map((t) => (
              <Row
                key={t.key}
                target={t}
                result={board.results[t.key]}
                active={hover?.key === t.key}
                onHover={setHover}
                onOpen={() => onOpenProject(t.projectId)}
              />
            ))}
          </tbody>
        </table>

        <div className="border-t border-term-rule px-4 py-3 text-[12.5px] leading-relaxed text-term-dim sm:px-5" aria-live="polite">
          {/* one line while it runs, one when it's done: the live region speaks twice, not per site */}
          {!board.done ? (
            <span>Calling every site from your browser…</span>
          ) : failed.length === 0 ? (
            <span>
              All {PING_TARGETS.length} answered your browser at {clock}. Median <b className="font-mono font-medium text-term-ink">{board.medianMs} ms</b>.
            </span>
          ) : (
            <span>
              {board.answered} of {PING_TARGETS.length} answered at {clock}.{' '}
              <span className="text-term-amber">{failed.map((f) => f.name).join(', ')}</span> didn&apos;t answer within 8 seconds.
            </span>
          )}
        </div>
      </div>

      {/* a peek at the site under the pointer, hung off the board's left edge */}
      <AnimatePresence>
        {hover && (
          <motion.div
            key="peek"
            className="pointer-events-none absolute top-16 right-[calc(100%+20px)] z-30 hidden w-[260px] overflow-hidden rounded-lg bg-paper shadow-[0_0_0_1px_var(--rule),var(--shadow-float)] xl:block"
            initial={{ opacity: 0, x: 12, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ ...spring.crisp, opacity: { duration: 0.16 } }}
          >
            <Peek target={hover} />
          </motion.div>
        )}
      </AnimatePresence>
    </Ink>
  );
}

// token sites have their own shots ($OMO → omo); everything else shows its project's cover
const peekId = (t: PingTarget) => (t.projectId === 'cryptosites' ? t.name.replace('$', '').toLowerCase() : shotId(t.projectId));

function Peek({ target }: { target: PingTarget }) {
  const [failed, setFailed] = useState(false);
  const id = peekId(target);
  return (
    <>
      {failed || !showsShot(id) ? (
        <div className="grid aspect-[16/10] place-items-center bg-term text-[20px] font-[720] tracking-[-0.02em] text-term-amber [font-stretch:118%]">
          {target.name}
        </div>
      ) : (
        <img src={shotSrc(id)} alt="" className="aspect-[16/10] w-full object-cover object-top" onError={() => setFailed(true)} />
      )}
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="truncate text-[13px] font-[620] text-ink">{target.name}</span>
        <span className="font-mono text-[11px] text-ink-3">{target.host}</span>
      </div>
    </>
  );
}

interface RowProps {
  target: PingTarget;
  result?: PingResult;
  active: boolean;
  onHover: (t: PingTarget | null) => void;
  onOpen: () => void;
}
function Row({ target, result, active, onHover, onOpen }: RowProps) {
  const state = result?.state ?? 'pending';
  return (
    <tr
      className={cn('group border-t border-term-rule/70 transition-colors', active && 'bg-term-2')}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(target)}
      onPointerLeave={() => onHover(null)}
    >
      <th scope="row" className="py-0 pl-4 font-normal sm:pl-5">
        <button
          type="button"
          onClick={onOpen}
          onFocus={() => onHover(target)}
          onBlur={() => onHover(null)}
          className="flex w-full items-center gap-2.5 py-[5px] text-left text-[13.5px] font-[560] text-term-ink outline-offset-[-2px]"
        >
          <span className="dot" data-state={state} aria-hidden="true" />
          <span className="truncate">{target.name}</span>
          <Icon name="arrowRight" size={13} className="shrink-0 -translate-x-1 text-term-dim opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
        </button>
      </th>
      <td className="hidden font-mono text-[11.5px] text-term-dim xs:table-cell">{target.host}</td>
      <td className="pr-4 text-right sm:pr-5">
        <span className="inline-flex items-center justify-end gap-2.5 font-mono text-[12.5px] whitespace-nowrap tabular-nums">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={state}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: ease.out }}
              className={cn(state === 'up' ? 'text-term-ink' : state === 'down' ? 'text-term-amber' : 'text-term-dim')}
            >
              {state === 'up' ? `${result?.ms} ms` : state === 'down' ? 'no answer' : '···'}
            </motion.span>
          </AnimatePresence>
          {/* the bar steps aside where the board is narrowest (small laptops), so the times keep their room */}
          <span className="hidden h-[5px] w-14 overflow-hidden rounded-full bg-term-2 sm:block lg:hidden xl:block" aria-hidden="true">
            <motion.span
              className="block h-full origin-left rounded-full bg-term-amber/70"
              initial={false}
              animate={{ scaleX: state === 'up' && result?.ms != null ? barFor(result.ms) : 0 }}
              transition={spring.crisp}
            />
          </span>
        </span>
      </td>
    </tr>
  );
}
