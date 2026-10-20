import { useEffect } from 'react';
import { PING_TARGETS } from '../lib/data';
import { runPings, startPingsOnce, useBoard } from '../lib/pings';
import { cn } from '../lib/cn';
import { Icon } from './Icon';
import { SplitFlap } from './SplitFlap';

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * The hero's proof, in one line: as the page loads, the visitor's own browser
 * checks every live site, and the split-flap counter turns forward one flap per
 * answer. The per-site detail (dots and times) lives on the Work strip, where
 * the projects are.
 */
export function LiveLine({ className }: { className?: string }) {
  const board = useBoard();
  useEffect(() => startPingsOnce(), []);
  const total = PING_TARGETS.length;
  const down = PING_TARGETS.filter((t) => board.results[t.key]?.state === 'down');

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[12.5px] text-ink-2', className)}>
      <span className="inline-flex items-center gap-2 rounded-lg bg-term px-2.5 py-1.5 text-term-ink shadow-[0_0_0_1px_var(--term-rule)]">
        <span className="dot" data-state={!board.done ? 'pending' : down.length ? 'down' : 'up'} aria-hidden="true" />
        <span className="text-[11px] tracking-[0.06em] text-term-dim">LIVE</span>
        <SplitFlap value={pad2(board.answered)} length={2} className="text-[17px]" label={(v) => `${Number(v) || 0} of ${total} sites answered`} />
        <span className="text-term-dim">/ {pad2(total)}</span>
      </span>
      <span aria-live="polite">
        {!board.done
          ? 'Your browser is checking each site right now…'
          : down.length === 0
            ? `All up, checked from your browser just now. Median reply ${board.medianMs} ms.`
            : down.length <= 2
              ? `${down.map((d) => d.name).join(' and ')} didn't answer in 8 seconds; the rest are up.`
              : `${down.length} didn't answer in 8 seconds; ${total - down.length} are up.`}
      </span>
      {board.done && (
        <button type="button" onClick={runPings} className="inline-flex items-center gap-1 text-ink-3 hover:text-ink" aria-label="Check every site again">
          <Icon name="refresh" size={13} /> again
        </button>
      )}
    </div>
  );
}
