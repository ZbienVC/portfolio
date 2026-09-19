import { motion } from 'motion/react';
import { useState } from 'react';
import { Ink } from '../components/Ink';
import { SectionHead } from '../components/SectionHead';
import { MATRIX_COLUMNS, PRACTICE, TOOL_USAGE } from '../lib/data';
import { ease, spring } from '../lib/motion';
import { cn } from '../lib/cn';

/**
 * Not a cloud of logos: a matrix read straight off the project data. Rows are
 * tools, columns are the things I shipped (this page included), and a dot is a
 * real use. Hover to cross-reference; click a tool to filter the work by it.
 */
export function Toolkit({ onFilterTool }: { onFilterTool: (toolId: string) => void }) {
  const [row, setRow] = useState<string | null>(null);
  const [col, setCol] = useState<string | null>(null);

  return (
    <section id="toolkit" aria-labelledby="toolkit-title" className="section-y relative bg-paper-2">
      <div className="guides" aria-hidden="true" />
      <div className="container-x relative">
        <SectionHead
          id="toolkit-title"
          label="Toolkit"
          title="The tools, and where each one went."
          lede="Every dot is a real use, read off the projects above rather than typed into a list. Hover a tool to see where it went; click it to filter the work by it."
        />

        <div className="mt-14 grid gap-x-12 gap-y-14 lg:grid-cols-12 [&>*]:min-w-0">
          <Ink
            id="matrix"
            type="bracket"
            pen="red"
            target="box"
            place="below"
            className="min-w-0 lg:col-span-8"
            noteClassName="!top-[calc(100%+16px)] !left-[30%]"
            note="Nothing here was typed in twice. Each row is a tool's aliases matched against every project's tags, so the grid can't drift from the work."
            spec="uses = (tool, p) => p.tags.some(t => tool.aliases.includes(t))"
          >
            <div className="relative -mx-[calc(var(--gutter)+var(--inset))] overflow-x-auto px-[calc(var(--gutter)+var(--inset))] pb-2 lg:mx-0 lg:px-0" onPointerLeave={() => { setRow(null); setCol(null); }}>
              <table className="w-full min-w-[40rem] border-collapse">
                <caption className="sr-only">Which tools were used in which projects</caption>
                <thead>
                  <tr>
                    <th scope="col" className="sticky left-0 z-10 w-[10.5rem] bg-paper-2 text-left align-bottom">
                      <span className="label-type">Tool</span>
                    </th>
                    {MATRIX_COLUMNS.map((c) => (
                      <th
                        key={c.id}
                        scope="col"
                        className="h-36 w-8 px-0 align-bottom font-normal"
                        onPointerEnter={() => setCol(c.id)}
                      >
                        <span
                          className={cn(
                            'mx-auto block origin-bottom-left translate-x-[14px] -rotate-[58deg] text-left text-[12.5px] whitespace-nowrap transition-colors',
                            c.self ? 'font-[620] text-amber-ink' : col === c.id ? 'text-ink' : 'text-ink-3',
                            'w-6',
                          )}
                        >
                          {c.name}
                        </span>
                      </th>
                    ))}
                    <th scope="col" className="w-12 pl-3 text-right align-bottom">
                      <span className="label-type">Uses</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TOOL_USAGE.map(({ tool, columns }, ri) => {
                    const hot = row === tool.id;
                    return (
                      <tr key={tool.id} onPointerEnter={() => setRow(tool.id)} className="group">
                        <th scope="row" className="sticky left-0 z-10 bg-paper-2 py-0 pr-4 text-left font-normal">
                          <button
                            type="button"
                            onClick={() => onFilterTool(tool.id)}
                            onFocus={() => setRow(tool.id)}
                            className={cn(
                              'flex h-9 w-full items-center gap-2 border-b border-rule text-[14px] whitespace-nowrap transition-colors',
                              hot ? 'text-ink' : 'text-ink-2',
                            )}
                            title={`Show the work built with ${tool.label}`}
                          >
                            <span className={cn('h-3 w-0.5 rounded-full transition-colors', hot ? 'bg-amber' : 'bg-transparent')} aria-hidden="true" />
                            {tool.label}
                          </button>
                        </th>
                        {MATRIX_COLUMNS.map((c, ci) => {
                          const used = columns.includes(c.id);
                          const lit = used && (hot || col === c.id);
                          return (
                            <td
                              key={c.id}
                              onPointerEnter={() => setCol(c.id)}
                              className={cn('h-9 border-b border-rule p-0 text-center transition-colors', (hot || col === c.id) && 'bg-paper-3')}
                            >
                              {used ? (
                                <>
                                  <motion.span
                                    aria-hidden="true"
                                    className={cn('mx-auto block rounded-full', c.self ? 'bg-amber' : 'bg-ink')}
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true }}
                                    animate={{ width: lit ? 11 : 8, height: lit ? 11 : 8 }}
                                    transition={{ ...spring.stiff, delay: (ri + ci) * 0.012 }}
                                  />
                                  <span className="sr-only">used</span>
                                </>
                              ) : (
                                <span className="mx-auto block size-[3px] rounded-full bg-rule-2" aria-hidden="true" />
                              )}
                            </td>
                          );
                        })}
                        <td className="h-9 border-b border-rule pl-3 text-right font-mono text-[12.5px] text-ink-2 tabular-nums">{columns.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Ink>

          <div className="min-w-0 lg:col-span-4">
            <h3 className="label-type">And the part that isn&apos;t code</h3>
            <div className="mt-4 grid gap-7 border-t border-rule pt-6">
              {PRACTICE.map((g, i) => (
                <motion.div
                  key={g.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                  transition={{ duration: 0.6, ease: ease.out, delay: i * 0.06 }}
                >
                  <h4 className="text-[16px] font-[640] text-ink [font-stretch:106%]">{g.title}</h4>
                  <ul className="mt-2 grid gap-1">
                    {g.items.map((it) => (
                      <li key={it} className="text-[14.5px] text-ink-2">
                        {it}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
