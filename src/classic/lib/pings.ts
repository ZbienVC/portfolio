import { useSyncExternalStore } from 'react';
import { PING_TARGETS, type PingTarget } from './data';

/**
 * The status board's data: the visitor's own browser calls every live site.
 *
 * Each call is a HEAD request in `no-cors` mode, so nothing comes back but an
 * opaque "someone answered" and the time it took. That is honest about what it
 * measures: the site answered your browser, this fast, just now. A network error
 * or no answer within TIMEOUT_MS marks the row as silent.
 */

export type PingState = 'pending' | 'up' | 'down';
export interface PingResult {
  state: PingState;
  ms?: number;
}
export interface BoardSnapshot {
  run: number;
  results: Record<string, PingResult>;
  answered: number;
  settled: number;
  done: boolean;
  medianMs: number | null;
  checkedAt: number | null;
}

const TIMEOUT_MS = 8000;
const STAGGER_MS = 45; // rows come back as a wave, in reading order when speeds are equal

const pendingAll = (): Record<string, PingResult> =>
  Object.fromEntries(PING_TARGETS.map((t) => [t.key, { state: 'pending' as const }]));

let snapshot: BoardSnapshot = {
  run: 0,
  results: pendingAll(),
  answered: 0,
  settled: 0,
  done: false,
  medianMs: null,
  checkedAt: null,
};
const listeners = new Set<() => void>();
const emit = (next: BoardSnapshot) => {
  snapshot = next;
  listeners.forEach((l) => l());
};

async function ping(t: PingTarget, signal: AbortSignal): Promise<PingResult> {
  const started = performance.now();
  try {
    await fetch(t.url, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal,
    });
    return { state: 'up', ms: Math.round(performance.now() - started) };
  } catch {
    return { state: 'down' };
  }
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
};

let controller: AbortController | null = null;

/** Check every site again. A newer run supersedes an unfinished one. */
export function runPings() {
  controller?.abort();
  const c = (controller = new AbortController());
  const timeout = window.setTimeout(() => c.abort(), TIMEOUT_MS + STAGGER_MS * PING_TARGETS.length);
  const run = snapshot.run + 1;
  emit({ run, results: pendingAll(), answered: 0, settled: 0, done: false, medianMs: null, checkedAt: null });

  PING_TARGETS.forEach((t, i) => {
    window.setTimeout(async () => {
      const result = await ping(t, c.signal);
      if (c !== controller) return; // superseded by a newer run
      const results = { ...snapshot.results, [t.key]: result };
      const values = Object.values(results);
      const settled = values.filter((r) => r.state !== 'pending').length;
      const done = settled === PING_TARGETS.length;
      if (done) window.clearTimeout(timeout);
      emit({
        run,
        results,
        answered: values.filter((r) => r.state === 'up').length,
        settled,
        done,
        medianMs: median(values.flatMap((r) => (r.ms != null ? [r.ms] : []))),
        checkedAt: done ? Date.now() : null,
      });
    }, i * STAGGER_MS);
  });
}

let started = false;
/** The first check, once per page view, after the page has had a moment to paint. */
export function startPingsOnce(delay = 700) {
  if (started) return;
  started = true;
  window.setTimeout(runPings, delay);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const useBoard = () => useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
