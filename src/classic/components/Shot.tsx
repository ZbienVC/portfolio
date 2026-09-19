import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { projectById, shotId, shotSrc, showsShot } from '../lib/data';
import { useFinePointer, useReducedMotionPref } from '../lib/hooks';
import { ease } from '../lib/motion';
import { cn } from '../lib/cn';

interface ShotProps {
  projectId: string;
  /** a different capture than the project's cover (a token site inside a collection) */
  shot?: string;
  /** shared-element id: the card's image becomes the sheet's image */
  layoutId?: string;
  /** on hover, scroll through the full-page capture */
  pan?: boolean;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  alt?: string;
}

/**
 * A live site's screenshot in a hairline frame. With `pan`, hovering scrolls
 * through the whole page capture at reading speed and springs back on leave.
 */
export function Shot({ projectId, shot, layoutId, pan = false, className, imgClassName, loading = 'lazy', alt = '' }: ShotProps) {
  const id = shot ?? shotId(projectId);
  const [missing, setMissing] = useState(!showsShot(id));
  const fine = useFinePointer();
  const reduce = useReducedMotionPref();
  const frame = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState(0); // px the full capture can scroll inside the frame
  const [panning, setPanning] = useState(false);
  const canPan = pan && fine && !reduce && !missing;

  const measure = (img: HTMLImageElement) => {
    const f = frame.current;
    if (!f || !img.naturalWidth) return;
    const h = (f.clientWidth / img.naturalWidth) * img.naturalHeight;
    setTravel(Math.max(0, h - f.clientHeight));
  };

  return (
    <motion.div
      ref={frame}
      layoutId={layoutId}
      transition={{ type: 'spring', stiffness: 300, damping: 34 }}
      className={cn('shot', className)}
      onPointerEnter={() => canPan && setPanning(true)}
      onPointerLeave={() => setPanning(false)}
    >
      {missing ? (
        <Cover projectId={projectId} />
      ) : (
        <>
          <img
            src={shotSrc(id)}
            alt={alt}
            loading={loading}
            decoding="async"
            onError={() => setMissing(true)}
            className={cn('absolute inset-0 size-full object-cover object-top', imgClassName)}
          />
          {canPan && (
            <motion.img
              src={shotSrc(id, 'full')}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              onLoad={(e) => measure(e.currentTarget)}
              onError={() => setTravel(0)}
              className="absolute inset-x-0 top-0 w-full max-w-none"
              initial={false}
              animate={{ opacity: panning && travel > 0 ? 1 : 0, y: panning ? -travel : 0 }}
              transition={{
                opacity: { duration: 0.2 },
                y: panning ? { duration: Math.max(1.2, travel / 260), ease: [0.45, 0, 0.55, 1] } : { duration: 0.7, ease: ease.out },
              }}
            />
          )}
        </>
      )}
    </motion.div>
  );
}

/** Designed stand-in when there's no capture: the product's mark and name on its own ground. */
function Cover({ projectId }: { projectId: string }) {
  const p = projectById(projectId);
  if (!p) return null;
  return (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(120%_90%_at_50%_0%,oklch(0.24_0.02_60),var(--term))]">
      <div className="flex flex-col items-center gap-4 text-center">
        {p.logo ? (
          <img src={p.logo} alt="" className="size-16 object-contain drop-shadow-[0_8px_24px_rgb(0_0_0/0.5)]" />
        ) : (
          <span className="grid size-16 place-items-center rounded-xl bg-paper/10 text-2xl font-[720] text-term-ink">{p.name.slice(0, 2)}</span>
        )}
        <span className="text-[22px] font-[700] tracking-[-0.02em] text-term-ink [font-stretch:116%]">{p.name}</span>
      </div>
    </div>
  );
}
