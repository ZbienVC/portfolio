import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ease } from '../lib/motion';
import { cn } from '../lib/cn';

interface SectionHeadProps {
  id?: string;
  label: string;
  title: ReactNode;
  lede?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** A section's opening: a mono label that says what's here, a heading, a lede. Left-aligned, always. */
export function SectionHead({ id, label, title, lede, className, children }: SectionHeadProps) {
  return (
    <motion.header
      className={cn('max-w-[46rem]', className)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.7, ease: ease.out }}
    >
      <p className="label-type flex items-center gap-2">
        <span className="h-px w-5 bg-amber" aria-hidden="true" />
        {label}
      </p>
      <h2 id={id} className="h2-type mt-4 text-ink">
        {title}
      </h2>
      {lede && <p className="lede mt-5 max-w-[38rem]">{lede}</p>}
      {children}
    </motion.header>
  );
}
