import { AnimatePresence, motion, useAnimate, useMotionValue, useTransform, type PanInfo } from 'motion/react';
import { useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '../components/Icon';
import { Ink } from '../components/Ink';
import { SectionHead } from '../components/SectionHead';
import { PHOTOS, type Photo } from '../lib/data';
import { rng } from '../engines/ink';
import { useReducedMotionPref } from '../lib/hooks';
import { ease, spring } from '../lib/motion';

export function OffTheClock() {
  return (
    <section id="off-the-clock" aria-labelledby="otc-title" className="section-y relative overflow-hidden">
      <div className="guides" aria-hidden="true" />
      <div className="container-x relative grid items-center gap-x-12 gap-y-10 lg:grid-cols-12 lg:gap-y-16 [&>*]:min-w-0">
        <div className="lg:col-span-5">
          <SectionHead
            id="otc-title"
            label="Off the clock"
            title="Snowboards, incentives, and fifty-some PCs."
            lede="Most winter weekends I'm on a board, and more interested in why one flexes better than another than I probably should be. Otherwise: crypto mechanics, incentive design and how attention works. Long before my first finance job, I built and sold fifty-plus custom desktops on eBay."
          />
          <p className="mt-6 max-w-[34rem] text-[15px] leading-relaxed text-ink-3">
            Same habit every time: find out why a thing works, then make it work better.
          </p>
        </div>
        <div className="lg:col-span-7">
          <PhotoPile />
        </div>
      </div>
    </section>
  );
}

/* ── The pile: throw the top print off the table; the next one is underneath ── */

const VISIBLE = 4; // prints you can see in the stack
const lean = (i: number) => rng(`print-${i}`).range(-7, 7); // each print keeps its own angle
const sel = (i: number) => `[data-print="${i}"]`;

function PhotoPile() {
  const [order, setOrder] = useState(() => PHOTOS.map((_, i) => i));
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const busy = useRef(false);
  const reduce = useReducedMotionPref();
  const top = order[0];

  // send the top print off toward `dir` (keeping the hand's speed), then file it at the bottom
  const toss = async (dir: 1 | -1, velocity = 900) => {
    if (busy.current) return;
    busy.current = true;
    const i = order[0];
    if (!reduce) {
      await animate(
        sel(i),
        { x: dir * 820, y: -30, rotate: lean(i) + dir * 20 },
        { type: 'spring', stiffness: 150, damping: 24, velocity: Math.abs(velocity) },
      );
    }
    setOrder((o) => [...o.slice(1), o[0]]);
    // it's at the bottom of the pile now, out of sight: put it back square
    animate(sel(i), { x: 0, y: (PHOTOS.length - 1) * 6, rotate: lean(i) }, { duration: 0 });
    busy.current = false;
  };

  // bring the bottom print back onto the top, in from the left
  const back = async () => {
    if (busy.current) return;
    busy.current = true;
    const i = order[order.length - 1];
    if (!reduce) await animate(sel(i), { x: -820, y: -30, rotate: lean(i) - 20 }, { duration: 0 });
    setOrder((o) => [o[o.length - 1], ...o.slice(0, -1)]);
    if (!reduce) await animate(sel(i), { x: 0, y: 0, rotate: lean(i) }, spring.gentle);
    busy.current = false;
  };

  const release = (info: PanInfo) => {
    const { offset, velocity } = info;
    if (Math.abs(velocity.x) > 600 || Math.abs(offset.x) > 130) {
      toss(offset.x + velocity.x * 0.1 > 0 ? 1 : -1, velocity.x);
    } else {
      animate(sel(top), { x: 0, y: 0 }, { type: 'spring', stiffness: 320, damping: 24 });
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      toss(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      back();
    }
  };

  return (
    <Ink
      id="pile"
      type="underline"
      pen="red"
      target="box"
      place="below"
      noteClassName="!top-[calc(100%+22px)] !left-[8%]"
      note="Throw the top one. It leaves at the speed you let go, on a spring, and the next print is already underneath."
      spec="onDragEnd: |v| > 600 px/s or |dx| > 130 px → toss(v)"
    >
      <div
        ref={scope}
        className="relative mx-auto grid h-[min(480px,96vw)] w-full max-w-[560px] place-items-center select-none"
        role="region"
        aria-roledescription="photo stack"
        aria-label="Photos from off the clock. Use the arrow keys to go through them."
        tabIndex={0}
        onKeyDown={onKey}
      >
        {[...order].reverse().map((i) => (
          <Print key={i} index={i} photo={PHOTOS[i]} depth={order.indexOf(i)} onRelease={release} />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={top}
              className="truncate text-[15px] font-[560] text-ink"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: ease.out }}
              aria-live="polite"
            >
              {PHOTOS[top].label}
            </motion.p>
          </AnimatePresence>
          <p className="font-mono text-[11.5px] text-ink-3 tabular-nums">
            {String(top + 1).padStart(2, '0')} / {PHOTOS.length} · drag the top one to throw it
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="icon-btn shadow-[inset_0_0_0_1px_var(--rule-2)]" onClick={back} aria-label="Previous photo">
            <Icon name="arrowRight" className="rotate-180" size={17} />
          </button>
          <button type="button" className="icon-btn shadow-[inset_0_0_0_1px_var(--rule-2)]" onClick={() => toss(1)} aria-label="Next photo">
            <Icon name="arrowRight" size={17} />
          </button>
        </div>
      </div>
    </Ink>
  );
}

interface PrintProps {
  index: number;
  photo: Photo;
  depth: number;
  onRelease: (info: PanInfo) => void;
}

function Print({ index, photo, depth, onRelease }: PrintProps) {
  const isTop = depth === 0;
  const hidden = depth >= VISIBLE;
  const x = useMotionValue(0);
  const rotate = useMotionValue(lean(index));
  // the print tilts with the hand as it's dragged, and as it flies
  const tilt = useTransform(x, [-320, 0, 320], [-12, 0, 12]);
  const landscape = photo.w > photo.h;
  // prints are set by height, so the width they take is the height times the aspect
  const height = landscape ? 'min(250px, 50vw)' : 'min(360px, 76vw)';
  const thumbW = Math.round(480 * Math.min(1, photo.w / photo.h));

  return (
    <motion.div
      data-print={index}
      className="absolute"
      style={{ x, rotate, zIndex: 100 - depth }}
      initial={false}
      animate={{ y: depth * 6, scale: hidden ? 0.9 : 1 - depth * 0.035, opacity: hidden ? 0 : 1 }}
      transition={spring.gentle}
      drag={isTop}
      dragMomentum={false}
      dragElastic={0.9}
      whileDrag={{ scale: 1.03 }}
      onDragEnd={(_, info) => onRelease(info)}
    >
      <motion.div
        style={{ rotate: tilt, cursor: isTop ? 'grab' : 'default' }}
        className="rounded-[3px] bg-[oklch(0.985_0.004_85)] p-[7px] pb-[26px] shadow-[0_1px_2px_rgb(0_0_0/0.12),0_18px_40px_-18px_rgb(0_0_0/0.45)] active:cursor-grabbing"
      >
        {/* the two prints you can see get the sharp file on dense screens; the rest of the pile stays on thumbnails */}
        <img
          src={photo.thumb}
          srcSet={depth < 2 ? `${photo.thumb} ${thumbW}w, ${photo.src} ${photo.w}w` : undefined}
          sizes={depth < 2 ? `calc(${height} * ${(photo.w / photo.h).toFixed(3)})` : undefined}
          alt={isTop ? photo.label : ''}
          width={photo.w}
          height={photo.h}
          draggable={false}
          loading="lazy"
          decoding="async"
          className={landscape ? 'block h-[min(250px,50vw)] w-auto' : 'block h-[min(360px,76vw)] w-auto'}
        />
      </motion.div>
    </motion.div>
  );
}
