import { useEffect, useRef, useState } from 'react';
import { DIGITS, aim, mount, whenSettled, type Drum, type FlapModule } from '../engines/split-flap';
import { useReducedMotionPref } from '../lib/hooks';
import { cn } from '../lib/cn';

interface SplitFlapProps {
  value: string;
  /** module count; the value is right-aligned into it */
  length: number;
  drum?: Drum;
  /** ms between neighbouring modules starting, so a change settles left to right */
  colStagger?: number;
  className?: string;
  /** what a screen reader reads for the row */
  label?: (value: string) => string;
  /** announce each settled value; off by default, since a counter that turns 14 times shouldn't speak 14 times */
  live?: boolean;
}

/** A row of split-flap modules. Drum state lives in refs; React only says where to go. */
export function SplitFlap({ value, length, drum = DIGITS, colStagger = 60, className, label, live = false }: SplitFlapProps) {
  const text = value.padStart(length, ' ').slice(-length);
  const cells = useRef<(HTMLSpanElement | null)[]>([]);
  const mods = useRef<FlapModule[]>([]);
  const reduce = useReducedMotionPref();
  const [said, setSaid] = useState(text);

  useEffect(() => {
    mods.current = cells.current.slice(0, length).map((el) => mount(el as HTMLSpanElement, drum));
  }, [drum, length]);

  useEffect(() => {
    const ms = mods.current;
    [...text].forEach((ch, i) => aim(ms[i], Math.max(0, drum.faces.indexOf(ch)), i * colStagger, reduce));
    return whenSettled(ms, () => setSaid(text));
  }, [text, drum, colStagger, reduce]);

  return (
    <span className={cn('inline-flex', className)}>
      <span className="flap-row" aria-hidden="true">
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className="flap"
            ref={(el) => {
              cells.current[i] = el;
            }}
          />
        ))}
      </span>
      <span className="visually-hidden" aria-live={live ? 'polite' : undefined}>
        {label ? label(said.trim()) : said.trim()}
      </span>
    </span>
  );
}
