import { useState } from 'react';
import { SectionHead } from '../components/SectionHead';
import { UNITS, launchLabel } from '../lib/data';
import { Stack } from '../stack/Stack';

/**
 * What the process has produced: every live site as a block, stacked in the
 * order it went live. It follows How I build because it's that section's output.
 * Without WebGL the same facts are a plain list.
 */
export function Shipped({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const [flat, setFlat] = useState(false);
  const first = UNITS[0];
  return (
    <section id="shipped" aria-labelledby="shipped-title" className="section-y relative">
      <div className="guides" aria-hidden="true" />
      <div className="container-x relative">
        <SectionHead
          id="shipped-title"
          label={`Output · ${UNITS.length} live sites since ${launchLabel(first.launched)}`}
          title="What it has shipped, in order."
        />
        <div className="mt-8 lg:mt-10">
          {flat ? (
            <ol className="border-t border-rule">
              {UNITS.map((u) => (
                <li key={u.key} className="border-b border-rule">
                  <button type="button" onClick={() => onOpenProject(u.projectId)} className="flex w-full items-baseline justify-between gap-4 py-3 text-left hover:bg-paper-2">
                    <span className="text-[15px] font-[600] text-ink">{u.name}</span>
                    <span className="font-mono text-[12px] text-ink-3">{launchLabel(u.launched)}</span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <Stack match={null} onOpenProject={onOpenProject} onUnavailable={() => setFlat(true)} />
          )}
        </div>
      </div>
    </section>
  );
}
