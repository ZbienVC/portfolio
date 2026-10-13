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
 *
 * On a phone the whole grid fits the screen instead of scrolling sideways under
 * a pinned column: narrower columns, names that slant back over the empty space
 * above the tool list (so none run off the right edge), tool names that may wrap.
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
          lede={
            <>
              <span className="max-lg:hidden">
                Each dot means I used that tool on that project. Hover a tool to see where; click it to see just those projects.
              </span>
              <span className="lg:hidden">Each dot means I used that tool on that project. Tap a tool to see just those projects.</span>
            </>
          }
        />

        <div className="mt-10 grid gap-x-12 gap-y-10 lg:mt-14 lg:grid-cols-12 lg:gap-y-14 [&>*]:min-w-0">
          <Ink
            id="matrix"
            type="bracket"
            pen="red"
            target="box"
            place="below"
            className="min-w-0 lg:col-span-8"
            noteClassName="!top-[calc(100%+16px)] !left-[30%]"
            note="Nothing here is typed in by hand. The grid is worked out from each project's own tags, so it can't fall out of date."
            spec="uses = (tool, p) => p.tags.some(t => tool.aliases.includes(t))"
          >
            <div
              className="relative -mx-[calc(var(--gutter)+var(--inset)-12px)] lg:mx-0 lg:overflow-x-auto lg:pb-2"
              onPointerLeave={() => {
                setRow(null);
                setCol(null);
              }}
            >
              <table className="w-full border-collapse max-lg:table-fixed lg:min-w-[40rem]">
                <caption className="sr-only">Which tools were used in which projects</caption>
                <thead>
                  <tr>
                    <th scope="col" className="w-[6.25rem] bg-paper-2 text-left align-bottom lg:sticky lg:left-0 lg:z-10 lg:w-[10.5rem]">
                      <span className="label-type">Tool</span>
                    </th>
                    {MATRIX_COLUMNS.map((c) => (
                      <th key={c.id} scope="col" className="relative h-[104px] px-0 align-bottom font-normal lg:h-36 lg:w-8" onPointerEnter={() => setCol(c.id)}>
                        <span
                          className={cn(
                            // a phone: the name ends at its column and slants back up to the left
                            'absolute right-1/2 bottom-1.5 origin-bottom-right rotate-[58deg] text-[11px] whitespace-nowrap transition-colors',
                            // a desktop: it starts at its column and rises to the right
                            'lg:static lg:mx-auto lg:block lg:w-6 lg:origin-bottom-left lg:translate-x-[14px] lg:-rotate-[58deg] lg:text-left lg:text-[12.5px]',
                            c.self ? 'font-[620] text-amber-ink' : col === c.id ? 'text-ink' : 'text-ink-3',
                          )}
                        >
                          {c.name}
                        </span>
                      </th>
                    ))}
                    <th scope="col" className="w-8 pl-1 text-right align-bottom lg:w-12 lg:pl-3">
                      <span className="label-type">Uses</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TOOL_USAGE.map(({ tool, columns }, ri) => {
                    const hot = row === tool.id;
                    return (
                      <tr key={tool.id} onPointerEnter={() => setRow(tool.id)} className="group">
                        <th scope="row" className="bg-paper-2 py-0 pr-2 text-left font-normal lg:sticky lg:left-0 lg:z-10 lg:pr-4">
                          <button
                            type="button"
                            onClick={() => onFilterTool(tool.id)}
                            onFocus={() => setRow(tool.id)}
                            className={cn(
                              'flex h-9 w-full items-center gap-2 border-b border-rule text-left text-[13px] leading-tight transition-colors lg:text-[14px] lg:whitespace-nowrap',
                              hot ? 'text-ink' : 'text-ink-2',
                            )}
                            title={`Show the projects built with ${tool.label}`}
                          >
                            <span className={cn('h-3 w-0.5 shrink-0 rounded-full transition-colors', hot ? 'bg-amber' : 'bg-transparent')} aria-hidden="true" />
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
                        <td className="h-9 border-b border-rule pl-1 text-right font-mono text-[12px] text-ink-2 tabular-nums lg:pl-3 lg:text-[12.5px]">{columns.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Ink>

          <div className="min-w-0 lg:col-span-4">
            <h3 className="label-type">Skills that don&apos;t fit in a grid</h3>
            <div className="mt-4 grid gap-5 border-t border-rule pt-5 lg:gap-7 lg:pt-6">
              {PRACTICE.map((g, i) => (
                <motion.div
                  key={g.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                  transition={{ duration: 0.6, ease: ease.out, delay: i * 0.06 }}
                >
                  <h4 className="text-[16px] font-[640] text-ink [font-stretch:106%]">{g.title}</h4>
                  {/* a phone runs each group's items together as one line of text; a desktop lists them */}
                  <ul className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2 lg:mt-2 lg:grid lg:gap-1">
                    {g.items.map((it) => (
                      <li key={it} className="inline after:mx-1.5 after:text-ink-3 after:content-['·'] last:after:content-none lg:block lg:after:content-none">
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
