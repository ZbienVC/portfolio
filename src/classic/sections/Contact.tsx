import { AnimatePresence, motion } from 'motion/react';
import { HoverArrow, Icon } from '../components/Icon';
import { PROFILE } from '../lib/data';
import { useCopy } from '../lib/hooks';
import { spring } from '../lib/motion';
import { openBasecamp } from '../lib/basecamp';

export function Contact({ onAsk }: { onAsk: () => void }) {
  const { copied, copy } = useCopy();
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative overflow-hidden bg-term text-term-ink">
      <div className="closing-glaze" aria-hidden="true" />
      <div className="container-x relative py-[clamp(88px,11vw,160px)]">
        <p className="flex items-center gap-2 font-mono text-[12px] text-term-dim">
          <span className="h-px w-5 bg-term-amber" aria-hidden="true" />
          Contact
        </p>
        <h2 id="contact-title" className="h2-type mt-5 max-w-[16ch] text-[clamp(2.5rem,1.4rem+4vw,4.75rem)] text-term-ink">
          Got a process someone still does by hand?
        </h2>
        <p className="mt-6 max-w-[36rem] text-[17px] leading-relaxed text-term-dim">
          Or numbers that don&apos;t tie out, or a product that should exist and doesn&apos;t. Those are my favorite problems. Write to me, I answer.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3 lg:mt-10">
          <a href={`mailto:${PROFILE.email}`} className="btn bg-term-amber text-term shadow-[0_8px_24px_-10px_var(--term-amber)] hover:bg-[oklch(0.84_0.14_70)]">
            {PROFILE.email}
            <HoverArrow />
          </a>
          <button
            type="button"
            onClick={() => copy(PROFILE.email)}
            className="btn text-term-ink shadow-[inset_0_0_0_1px_var(--term-rule)] hover:bg-term-2"
            aria-live="polite"
          >
            <span className="relative grid size-4 place-items-center">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={copied ? 'y' : 'n'}
                  initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={spring.stiff}
                  className="grid"
                >
                  <Icon name={copied ? 'check' : 'copy'} size={16} className={copied ? 'text-term-tick' : undefined} />
                </motion.span>
              </AnimatePresence>
            </span>
            {copied ? 'Copied' : 'Copy address'}
          </button>
          <button type="button" onClick={onAsk} className="btn text-term-ink shadow-[inset_0_0_0_1px_var(--term-rule)] hover:bg-term-2">
            <Icon name="ask" size={16} />
            Ask my AI about my work
          </button>
        </div>

        <ul className="mt-10 grid gap-px overflow-hidden rounded-lg bg-term-rule sm:grid-cols-3 lg:mt-16">
          {[
            { href: PROFILE.socials.linkedin, label: 'LinkedIn', sub: 'zach-bienstock', icon: 'linkedin' as const },
            { href: PROFILE.socials.github, label: 'GitHub', sub: 'ZbienVC', icon: 'github' as const },
            { href: PROFILE.resumePdfNamed, label: 'Résumé', sub: 'PDF, one page', icon: 'file' as const },
          ].map((l) => (
            <li key={l.label} className="bg-term">
              <a href={l.href} target="_blank" rel="noopener" className="group flex items-center gap-4 p-5 transition-colors hover:bg-term-2">
                <Icon name={l.icon} size={20} className="text-term-dim transition-colors group-hover:text-term-amber" />
                <span>
                  <span className="block text-[15px] font-[600] text-term-ink">{l.label}</span>
                  <span className="block font-mono text-[11.5px] text-term-dim">{l.sub}</span>
                </span>
                <span className="ml-auto text-term-dim">
                  <HoverArrow size={11} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* on a phone the dock floats over the bottom of the page, so the footer leaves it room */}
      <footer className="container-x relative flex flex-wrap items-center justify-between gap-4 border-t border-term-rule py-7 font-mono text-[11.5px] text-term-dim max-lg:pb-24">
        <p>Designed and built by {PROFILE.name}, {PROFILE.location}. React, Motion, and a WebGL shader.</p>
        <p className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span>
            Press <kbd className="kbd bg-term-2 text-term-ink shadow-[inset_0_0_0_1px_var(--term-rule)]">W</kbd> to show the work
          </span>
          <button type="button" onClick={openBasecamp} className="inline-flex items-center gap-1.5 hover:text-term-ink">
            <Icon name="cube" size={14} /> Walk the 3D basecamp
          </button>
          <a href="https://github.com/ZbienVC/portfolio" target="_blank" rel="noopener" className="hover:text-term-ink">
            Source
          </a>
        </p>
      </footer>
    </section>
  );
}
