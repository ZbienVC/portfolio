import { forwardRef, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/**
 * Two drawn devices: a laptop and a phone, in the site's warm ink. They're plain
 * frames (no photos of hardware), sized by their screens, so whatever goes on the
 * screen (a demo clip, a still, the live site) keeps its true proportions.
 */

export function Laptop({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <figure className={cn('relative', className)} aria-label={label}>
      <div className="rounded-t-[14px] bg-[oklch(0.2_0.012_55)] px-[1.1%] pt-[1.6%] pb-[1.1%] shadow-[inset_0_0_0_1px_oklch(0.32_0.012_55),var(--shadow-panel)] dark:bg-[oklch(0.15_0.01_55)]">
        <span className="absolute top-[0.7%] left-1/2 size-[5px] -translate-x-1/2 rounded-full bg-[oklch(0.32_0.01_55)]" aria-hidden="true" />
        <div className="relative aspect-[16/10] overflow-hidden rounded-[3px] bg-black">{children}</div>
      </div>
      {/* the deck: a little wider than the lid, with the thumb notch */}
      <div className="relative -mx-[4.5%] h-[clamp(9px,1.5vw,15px)] rounded-b-[12px] bg-[linear-gradient(to_bottom,oklch(0.78_0.008_70),oklch(0.62_0.01_65))] shadow-[0_10px_24px_-12px_oklch(0.2_0.02_50/0.55)] dark:bg-[linear-gradient(to_bottom,oklch(0.42_0.01_60),oklch(0.3_0.01_60))]">
        <span className="absolute top-0 left-1/2 h-[42%] w-[13%] -translate-x-1/2 rounded-b-[6px] bg-[oklch(0.55_0.01_65)] dark:bg-[oklch(0.25_0.01_60)]" aria-hidden="true" />
      </div>
    </figure>
  );
}

export const Phone = forwardRef<HTMLElement, { children: ReactNode; className?: string; label?: string }>(function Phone(
  { children, className, label },
  ref,
) {
  return (
    <figure
      ref={ref}
      className={cn(
        'relative rounded-[clamp(26px,13%,40px)/clamp(26px,6%,40px)] bg-[oklch(0.2_0.012_55)] p-[3.2%] shadow-[inset_0_0_0_1px_oklch(0.32_0.012_55),var(--shadow-panel)] dark:bg-[oklch(0.15_0.01_55)]',
        className,
      )}
      aria-label={label}
    >
      <div className="relative aspect-[390/844] overflow-hidden rounded-[clamp(20px,10.5%,32px)/clamp(20px,4.9%,32px)] bg-black">
        {children}
        <span className="pointer-events-none absolute top-[1.6%] left-1/2 z-10 h-[3.1%] w-[29%] -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
      </div>
    </figure>
  );
});
